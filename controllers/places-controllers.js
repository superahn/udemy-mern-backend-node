const HttpError = require("../models/http-error");
const { validationResult } = require("express-validator");
const mongoose = require("mongoose");

const getCoordsForAddress = require("../util/location");
const Place = require("../models/place");
const User = require("../models/user");
const { setEngine } = require("crypto");

const getPlacesById = async (req, res, next) => {
  const placeId = req.params.pid; // { pid: 'p1' }

  let place;
  try {
    place = await Place.findById(placeId);
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not find a place.",
      500
    );
    return next(error);
  }

  if (!place) {
    return next(
      new HttpError("Could not find a place for the provided id.", 404)
    );
  }

  res.json({ place: place.toObject({ getters: true }) }); //  { place } => { place:place }
};

const getPlacesByUserId = async (req, res, next) => {
  const userId = req.params.uid; // { uid: 'u1' }

  let places;
  try {
    places = await Place.find({ creator: userId }); // places will be array
  } catch (err) {
    const error = new HttpError(
      "Fetching places failed, please try again later.",
      500
    );
    return next(error);
  }

  if (!places || places.length === 0) {
    return next(
      new HttpError("Could not find places for the provided user id."),
      404
    );
  }

  res.json({
    places: places.map((place) => place.toObject({ getters: true })),
  }); //  { place } => { place:place }
};

const createPlace = async (req, res, next) => {
  // return error:
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid inputs passed, please check your data", 422)
    );
  }

  // const title = req.body.title
  const { title, description, address, creator } = req.body;

  let coordinates = {
    lat: 40.7484474,
    lng: -73.9871516,
  };
  /*
  try {
    coordinates = await getCoordsForAddress(address);
    console.log(coordinates);
  } catch (error) {
    return next(error);
  }
  */

  const createdPlace = new Place({
    // now don't nee id because mongodb will create it
    title,
    description,
    location: coordinates,
    address,
    image:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/d/df/NYC_Empire_State_Building.jpg/640px-NYC_Empire_State_Building.jpg",
    creator,
  });

  // check if there is user in the db.
  let user;
  try {
    user = await User.findById(creator);
  } catch (err) {
    const error = new HttpError(
      "Creating place failed, please try again. #1",
      500
    );
    return next(error); // pass the error into an Express error handler with the next argument.
  }

  if (!user) {
    const error = new HttpError("Could not find user for provided id", 404);
    return next(error);
  }

  // creating a place and adding it to an user
  try {
    const sess = await mongoose.startSession();
    sess.startTransaction(); // --> TRANSACTION START!
    await createdPlace.save({ session: sess }); // write Place to mongodb
    user.places.push(createdPlace);
    await user.save({ session: sess }); // write Place to mongodb
    await sess.commitTransaction(); // <-- TRANSACTION END!!!
  } catch (err) {
    // handle error, otherwise this server can be crached...
    const error = new HttpError(
      "Creating place failed, please try again. #2",
      500
    );
    return next(error); // pass the error into an Express error handler with the next argument.
  }

  res.status(201).json({ place: createdPlace });
};

const updatePlace = async (req, res, next) => {
  // return error:
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid inputs passed, please check your data", 422)
    );
  }

  const { title, description } = req.body;
  const placeId = req.params.pid;

  // using mongoose to get a place from db
  let place;
  try {
    place = await Place.findById(placeId);
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not update a place. #1",
      500
    );
    return next(error);
  }

  // change a place with new data from params
  place.title = title;
  place.description = description;

  // save to db
  try {
    await place.save(); // write data to mongodb
  } catch (err) {
    // handle error, otherwise this server can be crached...
    const error = new HttpError(
      "Something went wrong, could not update a place. #2",
      500
    );
    return next(error); // pass the error into an Express error handler with the next argument.
  }

  res.status(200).json({ place: place.toObject({ getters: true }) });
};

const deletePlace = async (req, res, next) => {
  const placeId = req.params.pid;

  let place;
  try {
    // use .populate to pull(place) from  place.creator.places...
    place = await Place.findById(placeId).populate("creator");
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not delete place. #1",
      500
    );
    return next(error);
  }

  if (!place) {
    const error = new HttpError("Could not find a place for this id.", 404);
    return next(error);
  }

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction(); // --> TRANSACTION START!
    await place.remove({ session: sess }); // delete a place from db
    place.creator.places.pull(place); // IMPORTANT: do populate after findBuyId()
    await place.creator.save({ session: sess }); // write Place to mongodb
    await sess.commitTransaction(); // <-- TRANSACTION END!!!
  } catch (err) {
    return next(
      new HttpError("Something went wrong, could not delete the place. #2", 500)
    );
  }

  res.status(200).json({ message: "Deleted a place." });
};

exports.getPlacesById = getPlacesById;
exports.getPlacesByUserId = getPlacesByUserId;
exports.createPlace = createPlace;
exports.updatePlace = updatePlace;
exports.deletePlace = deletePlace;
