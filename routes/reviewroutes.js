const express = require("express");

const reviewController = require("./../controllers/reviewcontroller");

const authController = require("./../controllers/authcontroller");

const router = express.Router({ mergeParams: true }); //in order to get reference routes form /tours/id/reviews beacause review routes must be controlled by a review controller

//meaning POST /reviews
// equals to POST /tours/:id/reviews

router.use(authController.protect);

router
  .route("/")
  .get(reviewController.getAllReviews)
  .post(
    authController.restrictTo("user"),
    reviewController.setTourUserIds,
    reviewController.createReview
  );

router
  .route("/:id")
  .get(reviewController.getReview)
  .patch(
    authController.restrictTo("user", "admin"),
    reviewController.updateReview
  )
  .delete(
    authController.restrictTo("user", "admin"),
    reviewController.deleteReview
  );

module.exports = router;
