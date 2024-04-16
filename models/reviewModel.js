const mongoose = require("mongoose");

const Tour = require("./tourModel");

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, "A review cant be empty"],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },

    createdAt: {
      type: Date,
      default: Date.now(),
    },

    tour: {
      type: mongoose.Schema.ObjectId,
      ref: "Tour",
      required: [true, "A review requires a tour"],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "A review must belong to a user"],
    },
  },
  {
    toJSON: {
      virtuals: true,
    },
    toObject: {
      virtuals: true,
    },
  }
);

//handling duplicate Reviews : a tour can have one review from one user ,
// so a in a Review { tour  : 2321  , user : 77cf2 }
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

reviewSchema.pre(/^find/, function (next) {
  this.populate({
    path: "user",
    select: "name photo",
  });

  next();
});

reviewSchema.post("save", function () {
  //this points to the current review
  this.constructor.calcAverageRatings(this.tour);
  //Review.calc: Review is not initailized in this state so to point to review we point to the constructor which is the model itself
});

reviewSchema.statics.calcAverageRatings = async function (tourId) {
  //aggregate functions only works on the model , i.e Review.aggregate  ; hence revSchema.statics points the this keyword to the model itself so we use static method instead of  a instance method
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: "$tour",
        nRating: { $sum: 1 },
        avgRating: { $avg: "$rating" },
      },
    },
  ]);

  if (stats.length > 0)
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating,
    });
  else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5,
    });
  }
};

reviewSchema.pre(/^findOneAnd/, async function (next) {
  //here this keyword is the current query
  this.r = await this.findOne();
  next();
});

//Ratings can be calculated only after a review is saved
reviewSchema.post(/^findOneAnd/, async function () {
  // await this.findOne() does not work here , query has already been executed
  await this.r.constructor.calcAverageRatings(this.r.tour);
});

module.exports = mongoose.model("Review", reviewSchema);
