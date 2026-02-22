// models/User.js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"],
    trim: true,
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: [6, "Password must be at least 6 characters"],
  },
  token: {
    type: String, // ✅ JWT stored in DB for login session
    default: null,
  },
  isAdmin: {
    type: Boolean,
    default: false, // ✅ Admin flag for access control
  },
}, {
  timestamps: true, // ✅ Adds createdAt and updatedAt
});

module.exports = mongoose.models.User || mongoose.model("User", userSchema);