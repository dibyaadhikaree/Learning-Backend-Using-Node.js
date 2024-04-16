const express = require("express");

const tourController = require("../controllers/tourcontroller");

const authController = require("../controllers/authcontroller");

const reviewRouter = require("./reviewroutes");

const router = express.Router();

// router.param("id", tourController.checkID); ///THis explains how a middleware works , router.param to define parameter middleware , i.e whenever there is a parameter with having id  this middleware works

//NESTED ROUTE:
router.use("/:tourId/reviews", reviewRouter); //Merging params , i.e a request for /reviews or /tourId/reviews will be passed to the reviewRouter

router.route("/tour-stats").get(tourController.getTourStats);
router.route("/monthly-plan/:year").get(tourController.getMonthlyPlan);
router
  .route("/top-5-cheap")
  .get(tourController.aliasTopTours, tourController.getAllTours);

router
  .route("/tours-within/:distance/center/:latlng/unit/:unit")
  .get(tourController.getToursWithin);

router.route("/distances/:latlng/unit/:unit").get(tourController.getDistances);

router
  .route("/")
  .get(tourController.getAllTours)
  .post(
    authController.protect,
    authController.restrictTo("admin", "lead-guide"),
    tourController.createTour
  );

router
  .route("/:id")
  .get(tourController.getTour)
  .patch(
    authController.protect,
    authController.restrictTo("admin", "lead-guide"),
    tourController.updateTour
  )
  .delete(
    authController.protect,
    authController.restrictTo("admin", "lead-guide"),
    tourController.deleteTour
  );

//POST  /tour/23434dklf/reviews
//GET /tour/id/reviews
//GET /tour/id/reviews/95043254

// router
//   .route("/:tourId/reviews")
//   .get(
//     authController.protect,
//     authController.restrictTo("user"),
//     reviewController.getReview
//   )
//   .post(
//     authController.protect,
//     authController.restrictTo("user"),
//     reviewController.createReview
//   );

module.exports = router;
