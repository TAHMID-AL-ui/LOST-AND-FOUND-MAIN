// server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

const authRoutes = require("./routes/auth");
const itemRoutes = require("./routes/items");

const app = express();

// Enable CORS so your React app can talk to this backend
app.use(cors());

// Enable parsing JSON bodies
app.use(express.json());

// === Serve uploaded images ===
// Any request to /uploads/filename will return the actual file from uploads folder
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// === Routes ===
app.use("/api/auth", authRoutes);    // Authentication routes (login/register)
app.use("/api/items", itemRoutes);   // Lost/Found item routes

// === Connect to MongoDB ===
mongoose.connect("mongodb://127.0.0.1:27017/lostfound", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("MongoDB connected"))
.catch(err => console.log("MongoDB connection error:", err));

// === Start the server ===
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
