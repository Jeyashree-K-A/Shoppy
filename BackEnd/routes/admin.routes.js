// routes/admin.routes.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");
//const path = require("path");
//const fs = require("fs");
const Product = require("../models/Product");
const authMiddleware = require("../middleware/authMiddleware");

// ✅ Cloudinary Storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "mern_products",
    allowed_formats: ["jpeg", "jpg", "png", "gif", "webp"],
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});
// // Configure multer for image upload
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     const uploadDir = "uploads/products";
//     if (!fs.existsSync(uploadDir)) {
//       fs.mkdirSync(uploadDir, { recursive: true });
//     }
//     cb(null, uploadDir);
//   },
//   filename: function (req, file, cb) {
//     const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
//     cb(null, uniqueSuffix + path.extname(file.originalname));
//   },
// });

// const fileFilter = (req, file, cb) => {
//   const allowedTypes = /jpeg|jpg|png|gif|webp/;
//   const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
//   const mimetype = allowedTypes.test(file.mimetype);

//   if (mimetype && extname) {
//     return cb(null, true);
//   } else {
//     cb(new Error("Only image files are allowed!"));
//   }
// };

// const upload = multer({
//   storage: storage,
//   limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
//   fileFilter: fileFilter,
// });

// Get all products (for admin panel)
router.get("/products", authMiddleware, async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json({ success: true, products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get single product by ID
router.get("/products/:id", authMiddleware, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }
    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Add new product
router.post("/products", authMiddleware, upload.single("image"), async (req, res) => {
  try {
    const { name, price, discount, category } = req.body;

    if (!name || !price || !category) {
      return res.status(400).json({
        success: false,
        message: "Name, price, and category are required",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Product image is required",
      });
    }

    const product = new Product({
      name,
      price: parseFloat(price),
      discount: discount ? parseFloat(discount) : 0,
      category,
      image: req.file.path,
    });

    await product.save();
    res.status(201).json({
      success: true,
      message: "Product added successfully",
      product,
    });
  } catch (error) {
    // // Delete uploaded file if product creation fails
    // if (req.file) {
    //   fs.unlinkSync(req.file.path);
    // }
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update product
router.put("/products/:id", authMiddleware, upload.single("image"), async (req, res) => {
  try {
    const { name, price, discount, category } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product) {
      //if (req.file) fs.unlinkSync(req.file.path);
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    // Update fields
    if (name) product.name = name;
    if (price) product.price = parseFloat(price);
    if (discount !== undefined) product.discount = parseFloat(discount);
    if (category) product.category = category;

    // Handle image update
    if (req.file) {
      // // Delete old image
      // const oldImagePath = path.join(__dirname, "..", product.image);
      // if (fs.existsSync(oldImagePath)) {
      //   fs.unlinkSync(oldImagePath);
      // }
      product.image = req.file.path;
    }

    await product.save();
    res.json({
      success: true,
      message: "Product updated successfully",
      product,
    });
  } catch (error) {
    if (req.file) fs.unlinkSync(req.file.path);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete product
router.delete("/products/:id", authMiddleware, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    // // Delete product image
    // const imagePath = path.join(__dirname, "..", product.image);
    // if (fs.existsSync(imagePath)) {
    //   fs.unlinkSync(imagePath);
    // }

    await Product.findByIdAndDelete(req.params.id);
    res.json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get products by category
router.get("/products/category/:category", async (req, res) => {
  try {
    const products = await Product.find({ category: req.params.category });
    res.json({ success: true, products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;