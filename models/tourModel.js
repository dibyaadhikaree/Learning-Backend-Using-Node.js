const mongoose = require("mongoose");

const slugify = require("slugify");

const validator = require("validator");

const User = require("./userModel");

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "A tour must have a name"],
      unique: true,
      maxlength: [40, "A tour name must have less or equal then 40 characters"],
      minlength: [10, "A tour name must have more or equal than 10 characters"],
    },
    duration: {
      type: Number,
      required: [true, "A tour must have a duration"],
    },
    description: {
      type: String,
      required: [true, "A description is required for the tour"],
    },
    maxGroupSize: {
      type: Number,
      required: [true, "A tour must have a group size "],
    },
    difficulty: {
      type: String,
      required: [true, "Tour must have a difficulty"],
      enum: {
        values: ["easy", "medium", "difficult"],
        message: "Difficulty is either E,M or D",
      },
    },
    rating: {
      type: Number,
      default: 4.5,
      min: [1, "rating must be above 1 "],
      max: [5, "rating must be below 5"],
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      set: (val) => Math.round(val * 10) / 10,
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, "A tour must have a price"],
    },
    priceDiscount: {
      type: Number,

      validate: {
        validator: function (val) {
          //RUNS ONLY ON CREATING THE DATABASE , BUT NOT ON UPDATING
          return val < this.price;
        },
        message: "The price discount({VALUE}) must be less than original price",
      },
    },
    summary: {
      type: String,
      trim: true, //removes white space character
      required: [true, "A summary is required"],
    },
    imageCover: {
      type: String,
      required: [true, "A tour must have  a a cover image"],
    },
    images: [String],

    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    startDates: [Date],
    slug: {
      type: String,
    },
    secretTour: {
      type: Boolean,
      default: false,
    },

    startLocation: {
      //GeoJson
      type: {
        type: String,
        default: "Point",
        enum: ["Point"],
        message: "A location must have a point",
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: "Point",
          enum: ["Point"],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],

    //referencing guides from user id : child referencing : child lai parent ma rakheko
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "User",
      },
    ],
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

//Virtual Populate : in order to have reference about tourReviews in tour model but without creating an infinite arrays of reviews which goes on expanding

tourSchema.virtual("reviews", {
  ref: "Review",
  foreignField: "tour", // it is the field in which foreign key is stored , ie in reviews we have a field 'tour' and in tour we need to reference for review
  localField: "_id", //this is the data which is stored in foreign model
});
//: to view the reviews data , a tour should be Populated with "reviews" when getting a tour  , then we can get all the reviews for the tour

//tourSchema.index({ price: 1  });
//Indexing helps to improve performance and queries becomes much faster
//here price becomes indexed , meaning it gets sorted. Whenever a price[gte/lte] query is made the search becomes faster.

tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
//to query about geoSpatial data we need to have an index of the location field
tourSchema.index({ startLocation: "2dsphere" });

tourSchema.virtual("durationWeeks").get(function () {
  return this.duration / 7;
});

//DOCUMENT MIDDLEWARE ; runs before .save() and .create() but not insertMany

tourSchema.pre("save", function (next) {
  // console.log(this); //this is the document object before saving
  this.slug = slugify(this.name, {
    lower: true,
  });
  next();
});

///DOCUMENT MIDDLEWARE
// tourSchema.pre("save", function (next) {
//   console.log("Will save document");
//   next();
// });

// tourSchema.post("save", function (doc, next) {
//   console.log(doc);
//   next();
// });

//QUERY MIDDLEWARE

tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: "guides",
    select: "-__v -passwordChangedAt",
  });

  next();
  //.populate : fillup the field guides on the tour / After Data modelling
});

// tourSchema.pre(/^find/, function (next) {
//   this.find({ secretTour: { $ne: true } }); //filters out all elements which has secretTour = false
//   this.time = Date.now();
//   next();
// });

// tourSchema.post(/^find/, function (docs, next) {
//   console.log("query took this much ", Date.now() - this.time);
//   console.log(docs);
//   next();
// });

//AGGREGATION MIDDLEWARE

// tourSchema.pre("aggregate", function (next) {
//   this.pipeline().unshift({
//     $match: { secretTour: { $ne: true } },
//   });
//   console.log(this.pipeline());
//   next();
// });

module.exports = mongoose.model("Tour", tourSchema);
