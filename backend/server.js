const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const path = require("path");

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

const fetch = require('node-fetch');

// Simple proxy endpoints for OpenTripMap to keep API key server-side.
// Requires OPEN_TRIPMAP_KEY in backend/.env
const OTM_KEY_SERVER = process.env.OPEN_TRIPMAP_KEY;

app.get('/api/opentripmap/radius', async (req, res) => {
  if (!OTM_KEY_SERVER) return res.status(500).json({ error: 'Server missing OpenTripMap key' });
  const { lat, lon, radius = 5000, limit = 30, kinds } = req.query;
  if (!lat || !lon) return res.status(400).json({ error: 'lat and lon required' });
  try {
    let url = `https://api.opentripmap.com/0.1/en/places/radius?apikey=${OTM_KEY_SERVER}&radius=${radius}&limit=${limit}&offset=0&lon=${encodeURIComponent(lon)}&lat=${encodeURIComponent(lat)}`;
    if (kinds) url += `&kinds=${encodeURIComponent(kinds)}`;
    const r = await fetch(url);
    const data = await r.json();
    res.json(data);
  } catch (err) {
    console.error('Proxy radius error', err);
    res.status(500).json({ error: String(err) });
  }
});

app.get('/api/opentripmap/xid/:xid', async (req, res) => {
  if (!OTM_KEY_SERVER) return res.status(500).json({ error: 'Server missing OpenTripMap key' });
  const { xid } = req.params;
  if (!xid) return res.status(400).json({ error: 'xid required' });
  try {
    const url = `https://api.opentripmap.com/0.1/en/places/xid/${encodeURIComponent(xid)}?apikey=${OTM_KEY_SERVER}`;
    const r = await fetch(url);
    const data = await r.json();
    res.json(data);
  } catch (err) {
    console.error('Proxy xid error', err);
    res.status(500).json({ error: String(err) });
  }
});

app.use("/api/auth", authRoutes);

const PORT = process.env.PORT || 8080;
const MONGO_URI = process.env.MONGO_URI;

// Connect to MongoDB
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

app.get("/", (req, res) => {
  res.send("Backend is working!");
});

// PRODUCTION: serve frontend
if (process.env.NODE_ENV === "production") {
  const frontendPath = path.join(__dirname, "../frontend/dist");
  app.use(express.static(frontendPath));

  // Serve index for any unmatched route in production
  // Use `/*` to avoid path-to-regexp parsing issues with a plain `*`.
  // Catch-all fallback for single-page app — use app.use to avoid path-to-regexp parsing
  app.use((req, res) => {
    res.sendFile(path.join(frontendPath, "index.html"));
  });
}

app.listen(PORT, () =>
  console.log(`🚀 Server running on port ${PORT}`)
);
