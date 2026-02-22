const express = require("express");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");
const Product = require("../models/Product");

const router = express.Router();

// ✅ Cloudinary Storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "mern_products",
    allowed_formats: ["jpg", "png", "jpeg", "webp"],
  },
});

const upload = multer({ storage });

// ✅ Create Product
router.post("/", upload.single("image"), async (req, res) => {
  try {
    const { name, price, discount, category } = req.body;

    const newProduct = new Product({
      name,
      price,
      discount,
      category,
      image: req.file ? req.file.path : "", // ✅ Cloudinary URL
    });

    const saved = await newProduct.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error("Product creation error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Get All Products
router.get("/", async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ Search
router.get("/search", async (req, res) => {
  const query = req.query.q;
  try {
    const regex = new RegExp(query, "i");
    const products = await Product.find({ name: regex });
    res.json(products);
  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ error: "Search failed" });
  }
});

module.exports = router;
