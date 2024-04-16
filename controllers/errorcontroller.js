//Main motive of an error controller:
//1 It contains an error handling middleware that consists of err as the first argument and is called in app by app.use((err , req , res , next))
//2 Main motive is to send the error
//3 If the app is in development mode then just send the err as it comes in the middleware . if(dev)then sendErr normally
//4 If the app is in production then we send more personalized errors to the client which is more compact and doesnt leak data

const AppError = require("./../utils/appError");

const handleJWTError = (err) =>
  new AppError("Invalid token , Please login again ", 401);

const handleJWTExpired = (err) =>
  new AppError("Your token has expired, Please login again ", 401);

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path} : ${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  const value = err.errmsg.match(/(["'])(?:(?=(\\?))\2.)*?\1/);
  // console.log(value);
  const message = `Duplicate filed value : x .Please use another value`;
  return new AppError(message, 404);
};

const handleValidationDB = (err) => {
  const errors = Object.values(err.errors).map((el) => {
    return el.message;
  });
  const message = `Invalid input data. ${errors.join(". ")}`;
  return new AppError(message, 400);
};

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

const sendErrorProd = (err, res) => {
  //Operationl, trusted error ;send msg to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
    //Programming or other unknown error : dont't leak error details
  } else {
    //1 Log the error
    console.error("Error !", err);
    res.status(500).json({
      status: "error",
      message: "Something went very wrong!",
    });
  }
};

//Error handling middleware consisting of err as first argument
//this middleware is an endpoint which sends an error . res.send(err)
module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  //   console.log(err.stack);

  if (process.env.NODE_ENV === "development") {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === "production") {
    let error = { ...err };
    if (error.name === "CastError") error = handleCastErrorDB(error);
    if ((error.code = 11000)) error = handleDuplicateFieldsDB(error);
    if ((error.name = "ValidationError")) error = handleValidationDB(error);
    if ((error.name = "JsonWebTokenError")) error = handleJWTError(error);
    if ((error.name = "TokenExpiredError")) error = handleJWTExpired(error);
    sendErrorProd(error, res);
  }
};
