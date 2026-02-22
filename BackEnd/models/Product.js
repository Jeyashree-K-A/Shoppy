const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  discount: { type: Number },
  image: { type: String, required: true },
  category: { type: String, required: true }, // 👈 add this!
});

module.exports = mongoose.model("Product", productSchema);
