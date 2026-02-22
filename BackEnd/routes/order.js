// routes/order.js
const express = require("express");
const auth = require("../middleware/authMiddleware");
const Order = require("../models/Order");
const router = express.Router();

// ✅ Get all orders for the logged-in user
router.get("/my-orders", auth, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate("products.productId", "name price image") // only get name, price, image
      .sort({ orderedAt: -1 });

    res.status(200).json({ orders });
  } catch (err) {
    console.error("❌ Get orders error:", err);
    res.status(500).json({ message: "Failed to fetch order history" });
  }
});

module.exports = router;
