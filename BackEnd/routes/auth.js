const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const auth = require("../middleware/authMiddleware");

const router = express.Router();

const isProduction = process.env.NODE_ENV === "production";

// Cookie configuration
const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "none" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/"
};

// ================= SIGNUP =================

router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        error: "Please enter name, email and password."
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: "Password must contain at least 6 characters."
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail
    });

    if (existingUser) {
      return res.status(400).json({
        error: "Email already exists. Please login."
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword
    });

    await newUser.save();

    return res.status(201).json({
      success: true,
      message: "Signup successful!",
      user: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        isAdmin: newUser.isAdmin || false
      }
    });

  } catch (err) {
    console.error("Signup Error:", err);

    if (err.code === 11000) {
      return res.status(400).json({
        error: "Email already exists. Please login."
      });
    }

    return res.status(500).json({
      error: "Signup failed. Please try again."
    });
  }
});


// ================= LOGIN =================

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required."
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail
    });

    if (!user) {
      return res.status(400).json({
        error: "Invalid email or password."
      });
    }

    const isMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!isMatch) {
      return res.status(400).json({
        error: "Invalid email or password."
      });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Store token
    user.token = token;
    await user.save();

    // Set cookie
    res.cookie("token", token, cookieOptions);

    return res.status(200).json({
      success: true,
      message: "Login successful!",
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin || false
      }
    });

  } catch (err) {
    console.error("Login Error:", err);

    return res.status(500).json({
      error: "Login failed. Please try again."
    });
  }
});


// ================= GET LOGGED-IN USER =================

router.get("/me", auth, async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      user: req.user
    });

  } catch (err) {
    console.error("Get User Error:", err);

    return res.status(500).json({
      error: "Failed to fetch user."
    });
  }
});


// ================= LOGOUT =================

router.get("/logout", async (req, res) => {
  try {
    let token = req.cookies?.token;

    if (!token && req.headers.authorization) {
      token = req.headers.authorization
        .replace(/^Bearer\s+/i, "")
        .trim();
    }

    if (token) {
      try {
        const decoded = jwt.verify(
          token,
          process.env.JWT_SECRET
        );

        const userId = decoded.id || decoded.userId;

        if (userId) {
          await User.findByIdAndUpdate(userId, {
            $set: { token: null }
          });
        }
      } catch (tokenError) {
        console.log("Invalid or expired token during logout.");
      }
    }

    res.clearCookie("token", {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      path: "/"
    });

    return res.status(200).json({
      success: true,
      message: "Logout successful!"
    });

  } catch (err) {
    console.error("Logout Error:", err);

    return res.status(500).json({
      error: "Logout failed."
    });
  }
});

module.exports = router;
