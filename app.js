const express = require("express");
const bodyParser = require("body-parser");

const placeRoutes = require("./routes/places-routes");

// ecreate express...
const app = express();

// middlewares
app.use("/api/places", placeRoutes); // => /api/places/...

app.use((error, req, res, next) => {
  if (res.headerSent) {
    return next(error);
  }
  res
    .status(error.code || 500)
    .json({ message: error.message || "An unknown error occured!" });
});

// listen...
app.listen(5500);
