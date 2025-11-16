const WantToGo = require("../models/WantToGo");
const User = require("../models/User");

// Add a destination to a user's "want to go" list
exports.add = async (req, res) => {
  try {
    const { destination, email } = req.body;
    if (!destination || !email) {
      return res.status(400).json({ message: "Missing destination or email" });
    }

    // optional: verify user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const existing = await WantToGo.findOne({ email, destination });
    if (existing) {
      return res.status(200).json({ message: "Already in your Want to Go list ❤️" });
    }

    const item = new WantToGo({ email, destination });
    await item.save();

    return res.status(201).json({ message: "Added to Want to Go ❤️" });
  } catch (err) {
    console.error("WantToGo add error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// List want-to-go items for a user
exports.list = async (req, res) => {
  try {
    const email = req.query.email;
    if (!email) return res.status(400).json({ message: "Missing email" });

    const items = await WantToGo.find({ email }).sort({ createdAt: -1 });
    return res.status(200).json({ items });
  } catch (err) {
    console.error("WantToGo list error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
