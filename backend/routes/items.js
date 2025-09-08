const express = require("express");
const router = express.Router();
const multer = require("multer");
const Item = require("../models/Item");
const authMiddleware = require("../middleware/auth");

// === Configure multer for uploads ===
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});
const upload = multer({ storage });

// === POST /api/items/lost ===
router.post("/lost", authMiddleware, upload.single("image"), async (req, res) => {
  try {
    const { itemName, description, dateLost, location, category } = req.body;
    const newItem = new Item({
      itemName,
      description,
      type: "lost",
      dateLost,
      location,
      category: category || "other",
      reportedBy: req.user.id,
      image: req.file ? req.file.filename : null
    });
    await newItem.save();
    
    // Populate the reportedBy field before sending response
    await newItem.populate("reportedBy", "name");
    
    res.json({ message: "Lost item reported successfully", item: newItem });
  } catch (err) {
    res.status(500).json({ message: "Error reporting lost item" });
  }
});

// === POST /api/items/found ===
router.post("/found", authMiddleware, upload.single("image"), async (req, res) => {
  try {
    const { itemName, description, dateFound, location, category } = req.body;
    const newItem = new Item({
      itemName,
      description,
      type: "found",
      dateFound,
      location,
      category: category || "other",
      reportedBy: req.user.id,
      image: req.file ? req.file.filename : null
    });
    await newItem.save();
    
    // Populate the reportedBy field before sending response
    await newItem.populate("reportedBy", "name");
    
    res.json({ message: "Found item reported successfully", item: newItem });
  } catch (err) {
    res.status(500).json({ message: "Error reporting found item" });
  }
});

// === GET all items with filtering and search ===
router.get("/", authMiddleware, async (req, res) => {
  try {
    let query = {};
    
    // Category filtering
    if (req.query.category && req.query.category !== 'all') {
      query.category = req.query.category;
    }
    
    // Type filtering (lost/found)
    if (req.query.type && req.query.type !== 'all') {
      query.type = req.query.type;
    }
    
    // Search functionality
    if (req.query.search) {
      query.$or = [
        { itemName: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } },
        { location: { $regex: req.query.search, $options: 'i' } }
      ];
    }
    
    // My reports filtering
    if (req.query.myReports === 'true') {
      query.reportedBy = req.user.id;
    }

    const items = await Item.find(query)
      .populate("claimedBy", "name")
      .populate("reportedBy", "name");
    res.json({ items });
  } catch (err) {
    res.status(500).json({ message: "Error fetching items" });
  }
});

// === Claim item ===
router.post("/claim/:id", authMiddleware, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Item not found" });
    
    if (item.claimedBy) {
      return res.status(400).json({ message: "Item already claimed" });
    }
    
    item.claimedBy = req.user.id;
    await item.save();
    
    res.json({ message: "Item claimed successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error claiming item" });
  }
});

// === DELETE item (with admin check) ===
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Item not found" });
    
    // Check if user is owner OR admin
    const isOwner = item.reportedBy.toString() === req.user.id;
    const isAdmin = req.user.isAdmin;
    
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "Not authorized to delete this item" });
    }
    
    await Item.findByIdAndDelete(req.params.id);
    res.json({ message: "Item deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting item" });
  }
});

module.exports = router;