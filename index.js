const express = require("express");
const path = require("path");
const jwt = require("jsonwebtoken");
const bcrypt = require('bcrypt');

const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");

mongoose
  .connect("mongodb://127.0.0.1:27017", {
    dbName: "backend",
  })
  .then(() => {
    console.log("Database Connected!");
  })
  .catch((err) => {
    console.log(err);
  });

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
});

const user = mongoose.model("User", userSchema);

const app = express();

// Using Middleware
app.use(express.static(path.join(path.resolve(), "public")));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Setting up Authentication
const isAuthenticated = async (req, res, next) => {
  const { token } = req.cookies;

  if (token) {
    const decodedToken = jwt.verify(token, "8642dhruv");
    console.log(decodedToken);

    req.User = await user.findById(decodedToken._id);

    next();
  } else {
    res.redirect("/login");
  }
};

// Setting up View Engine
app.set("view engine", "ejs");

app.get("/", isAuthenticated, (req, res) => {
  console.log(req.User);
  res.render("logout", { name: req.User.name });
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  let User = await user.findOne({ email });

  if (User) {
    return res.redirect("/login");
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  User = await user.create({
    name,
    email,
    password: hashedPassword,
  });

  const token = jwt.sign({ _id: User._id }, "8642dhruv");

  res.cookie("token", token, {
    httpOnly: true,
    expires: new Date(Date.now() + 60 * 1000),
  });
  res.redirect("/");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  let User = await user.findOne({ email });

  if (!User) {
    return res.redirect("/register");
  }

  const isMatch = await bcrypt.compare(password, User.password)

  if (!isMatch) {
    return res.render("login", { email, message: "Incorrect Password!" });
  }

  const token = jwt.sign({ _id: User._id }, "8642dhruv");

  res.cookie("token", token, {
    httpOnly: true,
    expires: new Date(Date.now() + 60 * 1000),
  });
  res.redirect("/");

  // User = await user.create({
  //   name,
  //   email,
  // });
});

app.get("/logout", (req, res) => {
  res.cookie("token", null, {
    httpOnly: true,
    expires: new Date(Date.now()),
  });

  res.redirect("/");
});

const portNumber = 5000;

app.listen(portNumber, () => {
  console.log(`App is working at Port: ${portNumber}`);
});
