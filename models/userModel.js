const mongoose = require("mongoose");

const validator = require("validator");

const bcrypt = require("bcryptjs");

const crypto = require("crypto");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please tell us your name"],
  },
  email: {
    type: String,
    required: [true, "Please tell us your email"],
    unique: true,
    validate: {
      validator: validator.isEmail,
      message: "It is not a valid email address",
    },
  },
  photo: String,
  role: {
    type: String,
    enum: ["user", "guide", "lead-tour-guide", "admin"],
    default: "user",
  },

  password: {
    type: String,
    required: [true, "Please provide a password"],
    minlength: [8, "Password should be > 8 characters"],
    select: false, //this will not show in any output
  },
  passwordConfirm: {
    type: String,
    required: [true, "Please confirm your password"],
    minlength: 8,
    validate: {
      //This only works on create/save
      validator: function (val) {
        return val == this.password;
      },
      message: "The passwords do not match",
    },
  },
  passwordChangedAt: {
    type: Date,
    select: false,
  },

  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

//Hashing or Encryption : password is encrypted before saving to the database
userSchema.pre("save", async function (next) {
  //encrypt only on new creation or password updation
  if (!this.isModified("password")) return;

  this.password = await bcrypt.hash(this.password, 12);

  //we dont need the confirm pass as this is only for user to not make any mistakes
  this.passwordConfirm = undefined;

  next();
});

//if password is modified then put on the passwordChangedAt property
userSchema.pre("save", function (next) {
  if (!this.isModified("password") || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000; //this ensures that token has been created after the pass has changed.
  next();
});

//Middleware to show only active users
userSchema.pre(/^find/, function (next) {
  //this points to the current query
  this.find({ active: { $ne: false } });
  next();
});

//INSTANCE METHOD : available to all documents

//Check if user given password and users actual password is the same
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTImestamp) {
  if (this.passwordChangedAt) {
    const changedTime = parseInt(this.passwordChangedAt.getTime() / 1000, 10);

    return changedTime > JWTTImestamp;
  }

  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");

  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // console.log({ resetToken, passwordResetToken: this.passwordResetToken });

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  // this.save({
  //   validateBeforeSave: true,
  // });

  return resetToken;
};

module.exports = mongoose.model("User", userSchema);
