const dotenv = require("dotenv");

const mongoose = require("mongoose");

process.on("uncaughtException", (err) => {
  console.log("Uncatught exception , shutting down");
  console.log(err.name, err.message);
});

dotenv.config({
  path: "./config.env",
});

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
    console.log("db connections succesful");
  });

const app = require("./app");

// console.log(app.get("env"));
// console.log(process.env);

const port = process.env.PORT;
const server = app.listen(port, () => {
  console.log(`Listening to server on port ${port}`);
});

process.on("unhandledRejection", (err) => {
  console.log(err.name, err.message);
  server.close(() => {
    process.exit();
  });
});
