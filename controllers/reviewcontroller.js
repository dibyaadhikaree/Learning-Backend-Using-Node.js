const Review = require("./../models/reviewModel");

const factory = require("./handlerFactory");

//Set user ids or tour ids if it is coming from a merged param :check review routes for more
//i.e if /api/v1/tours/terqwdr143925u/reveiws : we want to get reveiw for tour with given id  ,
//or elser we can get/set  a review from /api/v1/reviews
exports.setTourUserIds = (req, res, next) => {
  //Allow nested routes
  //Data is saved to req.body because  a review requires a tour and user compulsarily
  //so while creating a review this middleware is used first
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user._id;
  //this stil allows the api to pass user and tour data into body
  //.i.e while posting the review req.body should look like { review : .. , rating :... , tour: .. , user :..  }
  next();
};

exports.getAllReviews = factory.getAll(Review);

exports.getReview = factory.getOne(Review);

exports.createReview = factory.createOne(Review);

exports.deleteReview = factory.deleteOne(Review);

exports.updateReview = factory.updateOne(Review);

//POST  /tour/23434dklf/reviews
//GET /tour/id/reviews
//GET /tour/id/reviews/95043254
