const Tour = require("./../models/tourModel");
const catchAsync = require("./../utils/catchAsync");
const appError = require("./../utils/appError");

exports.getOverview = catchAsync(async (req, res, next) => {
  // 1. Get tour data from the collection
  const tours = await Tour.find({});
  //2. Build the template

  //3. Render the template using tour datat from 1.
  res.status(200).render("overview", {
    tours,
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  //1. Get the data for the requested tour, including(reviews and guides)
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: "reviews",
    fields: "review rating user",
  });

  if (!tour) return next(new appError("No tour found ", 404));
  //2. Build the template

  //3. Render template using data from 1
  res.status(200).render("tour", {
    title: `${tour.name}`,
    tour,
  });
});

exports.getLoginForm = (req, res) => {
  res.status(200).render("login", {
    title: "Login",
  });
};
