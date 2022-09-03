const HttpError = require("../models/http-error");
const { v4: uuidv4 } = require("uuid");
const { validationResult } = require("express-validator");

let DUMMY_USERS = [
  {
    id: "u1",
    name: "Sung Ahn",
    email: "test@test.com",
    password: "testers",
  },
];

const getUsers = (req, res, next) => {
  res.json({ users: DUMMY_USERS });
};

const signup = (req, res, next) => {
  // throw error:
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new HttpError("Invalid inputs passed, please check your data", 422);
  }

  const { name, email, password } = req.body;

  // check if there is a same email already.
  const hasUser = DUMMY_USERS.find((u) => u.email == email);
  if (hasUser) {
    throw new HttpError("Could not create user, email already exist", 422);
  }

  const createdUser = {
    id: uuidv4(),
    name, // name: name
    email,
    password,
  };

  DUMMY_USERS.push(createdUser);
  res.status(201).json({ user: createdUser });
};
const login = (req, res, next) => {
  const { email, password } = req.body;

  const identifiedfUser = DUMMY_USERS.find((u) => u.email === email);
  if (!identifiedfUser || identifiedfUser.password !== password) {
    throw new HttpError(
      "Could not identify user, credentials seem to be wrong.",
      401
    );
  }

  res.status(200).json({ message: "Logged in!" });
};

exports.getUsers = getUsers;
exports.signup = signup;
exports.login = login;
