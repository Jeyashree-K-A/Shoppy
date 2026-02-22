// middleware/authMiddleware.js
const jwt = require("jsonwebtoken");
const User = require("../models/User");

/**
 * Middleware to protect routes by verifying JWT token from cookies OR Authorization header
 */
const auth = async (req, res, next) => {
  try {
    // ✅ Check both cookie AND Authorization header (for React fetch requests)
    let token = req.cookies?.token;
    
    // If no cookie token, check Authorization header
    if (!token && req.headers.authorization) {
      token = req.headers.authorization.replace("Bearer ", "").trim();
    }

    // If still no token found
    if (!token) {
      console.log("❌ No token found in cookies or headers");
      return res.status(401).json({ 
        success: false,
        message: "Unauthorized. No token provided." 
      });
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Look up the user by ID
    const user = await User.findById(decoded.id).select("-password");
    
    if (!user) {
      console.log("❌ User not found for token:", decoded.id);
      return res.status(401).json({ 
        success: false,
        message: "Unauthorized. User not found." 
      });
    }

    // ✅ Attach FULL user object to request (this is the FIX!)
    // Now req.user._id will work properly in cart routes
    req.user = {
      _id: user._id,          // ⭐ THIS IS THE KEY FIX - was 'id', should be '_id'
      id: user._id,           // Keep both for compatibility
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin || false
    };
    
    //console.log("✅ Auth successful for user:", user.email);
    next();
  } catch (err) {
    console.error("🔒 Auth Middleware Error:", err.message);
    
    // Handle specific JWT errors
    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({ 
        success: false,
        message: "Unauthorized. Invalid token." 
      });
    }
    
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ 
        success: false,
        message: "Unauthorized. Token has expired. Please login again." 
      });
    }
    
    return res.status(401).json({ 
      success: false,
      message: "Unauthorized. Authentication failed." 
    });
  }
};

module.exports = auth;