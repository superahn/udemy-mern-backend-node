const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const placesRoutes = require("./routes/places-routes");
const usersRoutes = require("./routes/users-routes");
const HttpError = require("./models/http-error");

// ecreate express...
const app = express();

// middlewares
app.use(bodyParser.json()); // important! priority

app.use("/api/places", placesRoutes); // => /api/places/...
app.use("/api/users", usersRoutes); // => /api/users/...

// for unsupport routes
app.use((req, res, next) => {
  const error = new HttpError("Could not find this route.", 404);
  throw error;
});

// for errors => using 4 parameters
app.use((error, req, res, next) => {
  if (res.headerSent) {
    return next(error);
  }
  res
    .status(error.code || 500)
    .json({ message: error.message || "An unknown error occured!" });
});

// mongoose connect
mongoose
  .connect(
    "mongodb+srv://sung:YaJSiLCz3XILlIeN@cluster0.lhjw6fd.mongodb.net/places?retryWrites=true&w=majority"
  )
  .then(() => {
    app.listen(5500); // if connecting to mongoose is successful, then start to listen server (node + express)
  })
  .catch((err) => {
    console.log(err);
  });
