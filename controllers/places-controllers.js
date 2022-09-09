const HttpError = require("../models/http-error");
const { v4: uuidv4 } = require("uuid");
const { validationResult } = require("express-validator");
const Place = require("../models/place");

let DUMMY_PLACES = [
  {
    id: "p1",
    title: "Empire State Building",
    description: "One of the most famous sky scrapers in the world!",
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/d/df/NYC_Empire_State_Building.jpg/640px-NYC_Empire_State_Building.jpg",
    address: "20 W 34th St, New York, NY 10001",
    location: {
      lat: 40.7484405,
      lng: -73.9878584,
    },
    creator: "u1",
  },
  {
    id: "p2",
    title: "Empire State Building",
    description: "One of the most famous sky scrapers in the world!",
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/d/df/NYC_Empire_State_Building.jpg/640px-NYC_Empire_State_Building.jpg",
    address: "20 W 34th St, New York, NY 10001",
    location: {
      lat: 40.7484405,
      lng: -73.9878584,
    },
    creator: "u2",
  },
  {
    id: "p3",
    title: "Best Choice painting",
    description: "Hire a Professional Painter!",
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/d/df/NYC_Empire_State_Building.jpg/640px-NYC_Empire_State_Building.jpg",
    address: "6 Towner Drive Knoxfield, VIC 3180",
    location: {
      lat: -37.88800152939171,
      lng: 145.2439506426094,
    },
    creator: "u3",
  },
];

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
  const { title, description, coordinates, address, creator } = req.body;
  const createdPlace = new Place({
    // now don't nee id because mongodb will create it
    title,
    description,
    location: coordinates,
    address,
    creator,
    image:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/d/df/NYC_Empire_State_Building.jpg/640px-NYC_Empire_State_Building.jpg",
  });

  try {
    await createdPlace.save(); // write data to mongodb
  } catch (err) {
    // handle error, otherwise this server can be crached...
    const error = new HttpError(
      "Creating place failed, please try again.",
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
    place = await Place.findById(placeId);
  } catch (err) {
    const error = new HttpError("Could not find a place for that id", 404);
    return next(error);
  }

  try {
    // Delete the document by its _id => use deleteOne with filter, instead of remove()
    const result = await Place.deleteOne({ _id: placeId });
    if (result.deletedCount === 1) {
      console.log("Successfully deleted one place.");
      res.status(200).json({ message: "Deleted a place." });
    } else {
      console.log("No documents matched the query. No place deleted.");
      res.status(200).json({ message: "No place deleted." });
    }
  } catch (err) {
    return next(
      new HttpError("Something went wrong, could not delete the place.", 500)
    );
  }
};

exports.getPlacesById = getPlacesById;
exports.getPlacesByUserId = getPlacesByUserId;
exports.createPlace = createPlace;
exports.updatePlace = updatePlace;
exports.deletePlace = deletePlace;
