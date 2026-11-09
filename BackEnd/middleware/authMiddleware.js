const jwt = require("jsonwebtoken");
const User = require("../models/User");

const auth = async (req, res, next) => {
  try {
    let token = req.cookies?.token;

    // Check Authorization header if cookie is unavailable
    if (!token && req.headers.authorization) {
      token = req.headers.authorization
        .replace(/^Bearer\s+/i, "")
        .trim();
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Please login to continue."
      });
    }

    // Verify JWT
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    // Support both old and new token formats
    const userId = decoded.id || decoded.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Invalid token."
      });
    }

    // Find authenticated user
    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found."
      });
    }

    // Attach user information
    req.user = {
      _id: user._id,
      id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin || false
    };

    next();

  } catch (err) {
    console.error("Authentication Error:", err.message);

    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Session expired. Please login again."
      });
    }

    return res.status(401).json({
      success: false,
      message: "Invalid authentication token."
    });
  }
};

module.exports = auth;
