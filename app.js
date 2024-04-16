const path = require("path");

const express = require("express");

const app = express(); // it is like creating a server through const server = require('http').createServer() ;

const morgan = require("morgan"); // <-- Middleware third party , gives console log of all the http requests

const cookieParser = require("cookie-parser");

//Data sanitization
const rateLimit = require("express-rate-limit");

const helmet = require("helmet");

const mongoSanitize = require("express-mongo-sanitize");

const xss = require("xss-clean");

const hpp = require("hpp");

//ROUTERS

const tourRouter = require("./routes/tourroutes");

const userRouter = require("./routes/userroutes");

const reviewRouter = require("./routes/reviewroutes");

const viewRouter = require("./routes/viewroutes");

//ERROR HANDLING

const appError = require("./utils/appError");

const globalErrorHandler = require("./controllers/errorcontroller");

//Setting views for MVC architecture

app.set("view engine", "pug");

app.set("views", path.join(__dirname, "views"));

//Serving Static files
app.use(express.static(path.join(__dirname, "public"))); //this serves static files

//MIDDLEWARES

//Security HTTP headers
app.use(helmet({ contentSecurityPolicy: false }));

//Development Login
if (process.env.NODE_ENV === "development") app.use(morgan("dev"));

//limit requests from same IP
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: "Too many requests from this IP , please try again in an hour!",
});
app.use("/api", limiter);

//Body parser , reading data from body into req.body
app.use(
  express.json({
    limit: "10kb",
  })
); //IT acts as a middleware(middleware : exists between req and res)

//Cookie Parser : parses cookies into req.cookie
app.use(cookieParser());

//cookie test middleware
app.use((req, res, next) => {
  console.log(req.cookies);
  next();
});

//Data Sanitization against NoSql query injection
app.use(mongoSanitize()); //for a db query { email : { $gt : ""}} :its always true so it gives access to all the emails

//Data SAnitization against XSS
app.use(xss()); // when html is written in the fields , the html behaves as code so to prevent it we use xss clean

//Preventing Parameter Pollution
app.use(
  hpp({
    whitelist: [
      "duration",
      "ratingsQuantity",
      "ratingsAverage",
      "maxGroupSize",
      "difficulty",
      "price",
    ],
  })
); //used when sending an api request containing params such as :sort split ; if there are multiple param

//our own middleware
// app.use((req, res, next) => {
//   console.log("Hello from the middleware");
//   next();
// });

// app.get("/", (req, res) => {
//   console.log(req.url);
//   res.status(200).json({
//     message: "Hello from the server side",
//     app: "Natours",
//   });
// });

// app.post("/", (req, res) => {
//   res.send("You can post to this URL");
// });

// const port = 3000;

// app.listen(port, () => {
//   console.log(`App running on port : ${port}`);
// });

//API and REST APIs

//rest api

//1. seperate api into logical resourses // any name can be a resource : eg localhost/addNewTour(addNewTour is endpoint)
//3. dont use add , or update , eg only use /(tours) instead of addNewTour or (getTour) and rather use post to add new tour and get method to use getTour

//STARTING TO BUILD API

// const tours = JSON.parse(
//   fs.readFileSync(`${__dirname}/dev-data/data/tours-simple.json`, "utf-8")
// );

// // console.log(tours);

// app.get("/api/v1/tours", (req, res) => {
//   res.status(200).json({
//     status: "sucesss",
//     results: tours.length,
//     data: {
//       tours,
//     },
//   });
// });

// app.get("/api/v1/tours/:id", (req, res) => {
//   // console.log(req.params); //all var stored in req.params

//   const tour = tours.find((el) => el.id == req.params.id);

//   if (!tour)
//     return res.status(404).json({
//       stauts: "failed",
//       message: "invalid id",
//     });

//   res.json({
//     status: "sucess",
//     data: {
//       tour,
//     },
//   });
// });

// app.post("/api/v1/tours", (req, res) => {
//   // console.log(req.body);
//   //we cannot use req.body without the middleware app.use(express.json())

//   const newId = tours[tours.length - 1].id + 1;
//   const newTour = {
//     id: newId, // new id num given to new posted data
//     ...req.body, // req.body is the data received from post request
//   };

//   tours.push(newTour); //adding new tour to array
//   fs.writeFile(
//     `${__dirname}/dev-data/data/tours-simple.json`,
//     JSON.stringify(tours), //write json version into file
//     (err) => {
//       console.log("Written into file");
//     }
//   );
//   res.status(201).json({
//     status: "success",
//     data: {
//       tour: newTour,
//     },
//   });
// });

// app.patch("/api/v1/tours/:id", (req, res) => {
//   res.status(200).json({
//     stauts: "success",
//     data: {
//       tour: "<Updated tour here >",
//     },
//   });

//   console.log(
//     "from patch recived body change for",
//     req.body,
//     "and id is ",
//     req.params.id
//   );
// });

// app.delete("/api/v1/tours/:id", (req, res) => {
//   const tour = tours.find((el) => el.id == req.params.id);

//   res.status(204).json({
//     stauts: "success",
//     data: null,
//   });
// });

// const port = 3000;

// app.listen(port, () => {
//   console.log(`App running on port : ${port}`);
// });

// Refactoring our code and building into fucntions

//ROUTES

// app.get("/api/v1/tours", getAllTours);

// app.get("/api/v1/tours/:id", getTour);

// app.post("/api/v1/tours", createTour);

// app.patch("/api/v1/tours/:id", updateTour);

// app.delete("/api/v1/tours/:id", deleteTour);

//USING ROUTERS : as a middleware

app.use("/", viewRouter); //VIEW ROUTER : router working just for displaying the frontend

app.use("/api/v1/tours", tourRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/reviews", reviewRouter);

//Handling unhandled route
app.all("*", (req, res, next) => {
  // res.status(404).json({
  //   status: "fail",
  //   message: `${req.originalUrl} is not  a valid url `,
  // });
  // console.log("this is an unhandled route");
  // const err = new Error(`${req.originalUrl} is not  a valid url `);
  // err.status = "fail";
  // err.statusCode = 404;
  next(new appError(`Cant find ${req.originalUrl} on this server`, 404));
});

//ERROR HANDLING MIDDLEWARE
app.use(globalErrorHandler);

module.exports = app;
