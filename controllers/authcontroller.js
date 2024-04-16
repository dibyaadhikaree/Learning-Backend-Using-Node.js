const { promisify } = require("util");
const User = require("./../models/userModel");
const catchAsync = require("./../utils/catchAsync");
const jwt = require("jsonwebtoken");
const AppError = require("./../utils/appError");
const sendEmail = require("./../utils/email");
const crypto = require("crypto");

//Authentication Process :
//1. During login or signup a JWT webtoken is created , which holds the data reference that we have given .i.e : ID
//2. The token is just sent as a response to the client : ....remaining to connect to client-side/frontend .till now only a jwt token is sent as a prcess for logging in
//3.There is a protect middleware which checks that a token is valid or not, i.e a user is logged in or not
//Create  a JWT Web token  :
const signToken = (id) => {
  return jwt.sign(
    {
      id,
    },
    process.env.JWT_SECRET,
    {
      // algorithm: "RS256",
      expiresIn: process.env.JWT_EXPIRES_IN,
    }
  );
};

const createAndSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  //Storing JWT in cookie to make user logged in for a specific browser
  const cookieOptions = {
    maxAge: process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000,
    httpOnly: true, //cant be modified by the browser
  };

  if (process.env.NODE_ENV === "production") cookieOptions.secure = true;
  user.password = undefined;
  res.cookie("jwt", token, cookieOptions);

  //Sending the token
  res.status(statusCode).json({
    status: "success",
    token,
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    role: req.body.role,
  });

  createAndSendToken(newUser, 200, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  //1 CHECK IF EMAIL AND PW EXISTS

  if (!email || !password) {
    return next(new AppError(`There is no email or pass `, 400));
  }
  //2 CHECK IF THE USER EXIST && PASS IS CORRECT
  const user = await User.findOne({
    email,
  }).select("+password");

  if (!user || !(await user.correctPassword(password, user.password)))
    return next(new AppError("Incorrect email or pass", 401));

  //3 EVTH OK THEN SEND THE TOKEN TO THE CLIENT
  createAndSendToken(user, 200, res);
});

exports.logout = (req, res) => {
  res.cookie("jwt", "loggedouttoken", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(200).json({
    status: "success",
  });
};

exports.protect = catchAsync(async (req, res, next) => {
  //1. getting token and check if its there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  )
    token = req.headers.authorization.split(" ")[1];
  else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) next(new AppError("You are not logged in "));
  //2. validate the token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  //3. check if user still exists
  const freshUser = await User.findById(decoded.id);
  if (!freshUser) return next(new AppError("User doesnt exist", 401));

  //4. Check if user changed password after the JWT was issued
  const changedPass = freshUser.changedPasswordAfter(decoded.iat);
  if (changedPass)
    return next(new AppError("User has changed pass  , login again", 401));

  //Grant acesss to protected route
  req.user = freshUser;
  next();
});

//Only for rendered pages , no errors should be there as we are working for the frontend not for protecting
exports.isLoggedIn = async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );

      //3. check if user still exists
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) return next();
      //4. Check if user changed password after the JWT was issued
      const changedPass = currentUser.changedPasswordAfter(decoded.iat);
      if (changedPass) return next();

      //There is a logged in user till here ,other wise it would have already been passed into next middleware
      res.locals.user = currentUser;
      return next();
    } catch (err) {
      return next();
    }
  }
  return next();
};

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role))
      return next(new AppError("Permission Unauthorized", 403));
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  //Get user based on the posted email
  const email = req.body.email;
  const user = await User.findOne({ email });
  if (!user)
    return next(new AppError("There is no user with that email address", 404));

  // generate the random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false }); //we use this because password , passwordConfirm are the part of the schema

  //send it to users email
  const resetUrl = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `forgot your password? Submit a Patch req with new pass and pass Confirm to ${resetUrl}\n Else please ignore this email`;

  try {
    await sendEmail({
      email: user.email,
      subject: "Your password reset token is valid for 10mins",
      message,
    });

    res.status(200).json({
      status: "success",
      message: "Token sent to email",
      url: resetUrl,
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new AppError("Error sending the email ", 500));
  }
});
exports.resetPassword = catchAsync(async (req, res, next) => {
  //get user based on the token
  //hashing the unhashed token recieved from email
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  //find the user as a hashed token(passwordResetToken) is saved in users data during forgotpassword endpoint
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });
  //if token hasnt expired and there is a user then set the new password
  if (!user) return next(new AppError("The token has expired", 404));

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  //update changedPasswordAt property from the middleware
  await user.save();
  //Log the user in , send JWT
  createAndSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user._id).select("+password");

  // const user = req.user.select("+password");
  const { oldPass, newPass, confirmPass } = req.body;
  // get the user from the collection
  if (!user) return next(new AppError("Please login to continue", 404));
  // check if the posted password is correct
  const isPassCorrect = await user.correctPassword(oldPass, user.password);
  if (!isPassCorrect) return next(new AppError("Invalid Password", 404));
  //if pass is correct then update the password
  user.password = newPass;
  user.passwordConfirm = confirmPass;
  user.passwordChangedAt = Date.now();
  await user.save();
  //log the user in send JWT
  createAndSendToken(user, 200, res);
});
