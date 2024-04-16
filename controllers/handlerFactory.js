const catchAsync = require("./../utils/catchAsync");
const appError = require("./../utils/appError");
const APIFeatures = require("./../utils/apiFeatures");

//HANDLING ROUTES ; making callback func for differnt http request
exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    // const tour = tours.find((el) => el.id == req.params.id);
    // console.log(req.params.id);
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc) {
      return next(new appError(`No doc found with that id`, 404));
    }

    res.status(204).json({
      status: "success",
      data: "null", //rest api architecture
    });
  });

exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true, //sends updated document
      runValidators: true,
    });

    if (!doc) {
      return next(new appError("Cant find a document with that id ", 404));
    }

    res.status(200).json({
      stauts: "success",
      data: {
        data: doc,
      },
    });
  });

exports.createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    //classic way of creating a tour
    // const newTour = new Tour({
    //   //data to be entered
    // });
    // newTour.save() ;   returns a promise if something is stored in db

    //Tour.create() puts a data in the datatbase automatticaly and returns a promise with data

    const doc = await Model.create(req.body);

    res.status(201).json({
      status: "success",
      data: {
        data: doc,
      },
    });
  });

exports.getOne = (Model, populateOptions) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    if (populateOptions) query = query.populate(populateOptions);
    const doc = await query;

    if (!doc) {
      return next(new appError("Cant find a tour with that id ", 404));
    }
    //Tour.findOne({ _id : req.params.id  });  similar to findById
    res.status(200).json({
      status: "success",
      data: {
        data: doc,
      },
    });
  });

exports.getAll = (Model) =>
  catchAsync(async (req, res, next) => {
    //here next keyword is used by catchAsync function so that it acts as a middleware and passes to next error handling middleware

    //EXECUTE THE QUERY

    //  /api/v1/tours?sort=ratings,filter=duration etc...
    // req.query  = {
    // duration: { gte: '5' },
    // difficulty: 'easy'  ,
    // sort : 'ratings'
    // }

    //To allow for nested GET reviews on tour(hack)
    let filter = {};
    //checking if the get request is for all reviews or a certain review requested from a tour or a user
    if (req.params.tourId) filter = { tour: req.params.tourId };

    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate(); //Chaining methods as .filter() returns an object with { this.query , this.queryStr }
    // and .sort() uses sort over {this.query}'s data and so on

    //awaiting the query
    // const doc = await features.query.explain(); //shows all the proceess and docs queried in order to get data

    const doc = await features.query;

    res.status(200).json({
      status: "sucesss",
      results: doc.length,
      data: {
        data: doc,
      },
    });
  });
