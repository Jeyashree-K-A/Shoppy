// backend/makeAdmin.js
const mongoose = require("mongoose");
const User = require("./models/User");
require("dotenv").config();

const makeAdmin = async (email) => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/shoppy", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("✅ Connected to MongoDB");
    console.log("🔍 Searching for email:", email);

    // Find user by email (case-insensitive search using regex)
    const user = await User.findOne({ 
      email: { $regex: new RegExp(`^${email}$`, 'i') } 
    });

    if (!user) {
      console.log("❌ User not found with email:", email);
      console.log("💡 Tip: Make sure the email is exactly as registered");
      
      // List all users to help debug
      const allUsers = await User.find({}, { email: 1, name: 1 });
      console.log("\n📋 Available users in database:");
      allUsers.forEach(u => {
        console.log(`   - ${u.email} (${u.name})`);
      });
      
      process.exit(1);
    }

    // Check if already admin
    if (user.isAdmin) {
      console.log("⚠️  User is already an admin!");
      console.log("📧 Email:", user.email);
      console.log("👤 Name:", user.name);
      console.log("⚡ Admin Status:", user.isAdmin);
      process.exit(0);
    }

    // Update user to admin
    user.isAdmin = true;
    await user.save();

    console.log("\n✅ User updated successfully!");
    console.log("📧 Email:", user.email);
    console.log("👤 Name:", user.name);
    console.log("⚡ Admin Status:", user.isAdmin);
    console.log("\n🎉 You can now login and access the admin panel!");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
};

// Get email from command line argument
const email = process.argv[2];

if (!email) {
  console.log("❌ Please provide an email address");
  console.log("Usage: node makeAdmin.js user@example.com");
  console.log("\nExample:");
  console.log("  node makeAdmin.js 23cseb11jeyashree@gmail.com");
  process.exit(1);
}

makeAdmin(email);