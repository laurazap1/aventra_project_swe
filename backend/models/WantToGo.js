const mongoose = require("mongoose");

const wantToGoSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true },
    destination: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("WantToGo", wantToGoSchema);
