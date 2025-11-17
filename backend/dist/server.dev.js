"use strict";

var express = require("express");

var mongoose = require("mongoose");

var dotenv = require("dotenv");

var cors = require("cors");

var authRoutes = require("./routes/authRoutes");

dotenv.config();
var app = express();
app.use(express.json());
app.use(cors());
app.use("/api/auth", authRoutes);
var PORT = 8080;
var MONGO_URI = process.env.MONGO_URI; // Connect to MongoDB

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(function () {
  return console.log("✅ MongoDB connected");
})["catch"](function (err) {
  return console.error("❌ MongoDB connection error:", err);
});
app.get("/", function (req, res) {
  res.send("Backend is working!");
});
app.listen(PORT, function () {
  return console.log("\uD83D\uDE80 Server running on port ".concat(PORT));
});
//# sourceMappingURL=server.dev.js.map
