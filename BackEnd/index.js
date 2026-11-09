const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/db");

dotenv.config();

const app = express();

app.set("trust proxy", 1);

// CORS configuration
app.use(cors({
  origin: [
    "http://localhost:3000",
    "https://shoppy-ou5z.onrender.com"
  ],
  credentials: true
}));

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Database connection
connectDB();

// Routes
app.use("/api/products", require("./routes/products"));
app.use("/api/auth", require("./routes/auth"));
app.use("/api/cart", require("./routes/cart.routes"));
app.use("/api/orders", require("./routes/order"));
app.use("/api/admin", require("./routes/admin.routes"));

// Test routes
app.get("/", (req, res) => {
  res.send("Welcome to Shoppy API!");
});

app.get("/api/test", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Shoppy API is working!"
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error("Server Error:", err);

  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      success: false,
      message: "File size too large. Maximum size is 5MB"
    });
  }

  if (err.message === "Only image files are allowed!") {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }

  res.status(500).json({
    success: false,
    message: err.message || "Something went wrong!"
  });
});

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Shoppy server running on port ${PORT}`);
});
