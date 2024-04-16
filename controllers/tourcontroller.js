const Tour = require("../models/tourModel"); //Requiring tourModel because MVC architechture suggest that model should be passed to the controller

// const tours = JSON.parse(
//   fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`, "utf-8")
// );  //this is data reading manually not from database

// THis is a middleware that checks if any thing is posted when POST Request is pulled
// exports.checkBody = (req, res, next) => {
//   //CHECKING IF THERE IS MSG IN BODY

//   if (req.body.constructor === Object && Object.keys(req.body).length === 0) {
//     return res.status(404).json({
//       status: "failed",
//       message: "No body entered",
//     });
//   }
//   next();
// };

const catchAsync = require("./../utils/catchAsync");
const factory = require("./handlerFactory");
const appError = require("./../utils/appError");

exports.aliasTopTours = (req, res, next) => {
  req.query.limit = "5";
  req.query.sort = "-ratingsAverage,price";
  req.query.fields = "name,price,ratingsAverage,summary,difficulty";
  next();
};

// -------> THESE are called the Route Handlers

// exports.createTour = catchAsync(async (req, res, next) => {
//   //classic way of creating a tour
//   // const newTour = new Tour({
//   //   //data to be entered
//   // });
//   // newTour.save() ;   returns a promise if something is stored in db

//   //Tour.create() puts a data in the datatbase automatticaly and returns a promise with data

//   const newTour = await Tour.create(req.body);

//   res.status(201).json({
//     status: "success",
//     data: {
//       tour: newTour,
//     },
//   });
// });
exports.getAllTours = factory.getAll(Tour);
exports.getTour = factory.getOne(Tour, { path: "reviews" }); //2nd arg is for populting data and it is the populateOption
exports.createTour = factory.createOne(Tour);
exports.updateTour = factory.updateOne(Tour);
exports.deleteTour = factory.deleteOne(Tour);

// exports.updateTour = catchAsync(async (req, res, next) => {
//   const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
//     new: true, //sends updated document
//     runValidators: true,
//   });

//   if (!tour) {
//     return next(new appError("Cant find a tour with that id ", 404));
//   }
//   //alternative for
//   // Tour.updateOne({idfilter } , {newdoc})
//   res.status(200).json({
//     stauts: "success",
//     data: {
//       tour,
//     },
//   });
// });

// exports.deleteTour = catchAsync(async (req, res, next) => {
//   // const tour = tours.find((el) => el.id == req.params.id);
//   // console.log(req.params.id);
//   const tour = await Tour.findByIdAndDelete(req.params.id);

//   if (!tour) {
//     return next(new appError("Cant find a tour with that id ", 404));
//   }

//   res.status(204).json({
//     status: "success",
//     data: "null", //rest api architecture
//   });
// });

// /tours-within/:distance/center/:latlng/unit/:unit
// /tours-within/500/center/-49,45/unit/kms
exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(",");
  let rad;

  if (unit == "km") rad = distance / 6378.1;
  else if (unit == "mi") rad = distance / 3963.2;
  if (!rad)
    return next(
      new appError("The distance's unit must be in miles or in km ", 400)
    );
  if (!lat || !lng)
    return next(new appError("Please specify lat lng in format", 404));

  //$geoWithin is an geoSpatial operator which finds documents within certain geometry
  const tour = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], rad] } },
    //to perform a geoSpatial query the model must require an index of the property
  });

  res.status(200).json({
    status: "success",
    results: tour.length,
    data: {
      tour,
    },
  });
});

exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(",");

  if (!lat || !lng)
    return next(new appError("Please specify lat lng in format", 404));

  const multiplier = unit === "mi" ? 0.000621 : 0.001;

  //To perform the calculations we always use Aggregation Pipeline

  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: "Point",
          coordinates: [lng * 1, lat * 1],
        },
        distanceField: "distance",
        distanceMultiplier: multiplier, //dividing by 1000 , converting metres into km
      },
    },
    {
      //project selects the field you want to display to the user
      $project: {
        distance: 1,
        name: 1,
      },
    },
  ]);

  res.status(200).json({
    status: "success",
    data: {
      distances,
    },
  });
});

//DATA AGGREAGATION PIPELINE , [different stages ,once a stage is passed , data has to be manipulated to the o/p of 1st stage]
exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    { $match: { ratingsAverage: { $gte: 4.5 } } },
    {
      $group: {
        _id: "$difficulty",
        numRatings: { $sum: "$ratingsQuantity" },
        numTours: { $sum: 1 },
        avgRating: { $avg: "$ratingsAverage" },
        avgPrice: { $avg: "$price" },
        minPrice: { $min: "$price" },
        maxPrice: { $max: "$price" },
      },
    },
    {
      $sort: { avgPrice: 1 },
    },
    {
      $match: {
        // _id: { $ne: "easy" },
      },
    },
  ]);

  res.status(200).json({
    result: "success",
    data: {
      stats,
    },
  });
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1; //2021
  const plan = await Tour.aggregate([
    {
      $unwind: "$startDates",
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-01`),
        },
      },
    },
    {
      $group: {
        _id: {
          $month: "$startDates",
        },
        numTourStarts: { $sum: 1 },
        tours: { $push: "$name" },
      },
    },
    {
      $addFields: {
        month: "$_id",
      },
    },
    {
      $project: {
        _id: 0,
      },
    },
    {
      $sort: {
        numTourStarts: -1,
      },
    },
    {
      $limit: 12,
    },
  ]);

  res.status(200).json({
    result: "success",
    data: {
      plan,
    },
  });
});
