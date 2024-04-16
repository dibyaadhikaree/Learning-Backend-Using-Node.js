const dotenv = require("dotenv");

dotenv.config({
  path: "./../../config.env",
});

const fs = require("fs");

const mongoose = require("mongoose");

const Tour = require("./../../models/tourModel");
const User = require("./../../models/userModel");
const Review = require("./../../models/reviewModel");

const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, "utf-8"));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, "utf-8"));
const reviews = JSON.parse(
  fs.readFileSync(`${__dirname}/reviews.json`, "utf-8")
);

const DB = process.env.DATABASE.replace(
  "<PASSWORD>",
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
  })
  .then(() => {
    console.log("Db connection successful");
  });

const importData = async () => {
  try {
    await Tour.create(tours);
    await User.create(users, { validateBeforeSave: false });
    await Review.create(reviews);
    console.log("Data loaded successfully");
  } catch (err) {
    console.log(err);
    console.log("Failed to import data");
  }
  process.exit();
};

const deleteData = async () => {
  try {
    await Tour.deleteMany({});
    await User.deleteMany({});
    await Review.deleteMany({});
    console.log("Database cleared");
  } catch (error) {
    console.log("Failed to delete data");
  }
  process.exit();
};

if (process.argv[2] === "--delete") {
  deleteData();
} else if (process.argv[2] === "--import") importData();
