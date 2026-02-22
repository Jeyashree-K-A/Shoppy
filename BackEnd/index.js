const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/db");


// ✅ Load environment variables
dotenv.config();

// ✅ Connect to MongoDB
connectDB();
//console.log("BREVO KEY:", process.env.BREVO_API_KEY);

// ✅ Initialize Express app
const app = express();

// ✅ Middleware
app.use(cors({
  origin: ["http://localhost:3000", "https://shoppy-ou5z.onrender.com"],
  credentials: true,
}));
app.use(express.json());           // ✅ Parse JSON body
app.use(express.urlencoded({ extended: true })); // ✅ Parse URL-encoded data (for form submissions)
app.use(cookieParser());           // ✅ Parse cookies

// ✅ Routes
app.use("/api/products", require("./routes/products"));
app.use("/api/auth", require("./routes/auth"));
app.use("/api/cart", require("./routes/cart.routes"));
app.use("/api/orders", require("./routes/order"));
app.use("/api/admin", require("./routes/admin.routes")); // ✅ Admin routes for product management

app.get("/", (req, res) => {
  res.send("Welcome to Shoppy API!");
});

app.get("/api/test", (req, res) => {
  res.json({ msg: "Proxy is working" });
});

// ✅ Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  // Handle Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
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

// ✅ Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
