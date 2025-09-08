const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema({
  itemName: { type: String, required: true },
  description: String,
  type: { type: String, enum: ["lost", "found"], required: true },
  dateLost: Date,
  dateFound: Date,
  location: String,
  category: { type: String, enum: ["electronics", "clothing", "documents", "jewelry", "other"], default: "other" },
  image: String,
  claimedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true });

module.exports = mongoose.model("Item", itemSchema);