import mongoose from "mongoose";
import bcrypt from "bcrypt";
import User from "../models/User";

// MongoDB connection string (replace with your MongoDB URI)
const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/micro-video-lms";

async function createAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    // Admin user details
    const adminData = {
      username: "admin",
      email: "admin@example.com",
      password: "AdminPassword123!", // Replace with a secure password
      role: "Admin" as "Admin",
      societies: [],
    };

    // Check if admin already exists
    const existingUser = await User.findOne({
      $or: [{ email: adminData.email }, { username: adminData.username }],
    });
    if (existingUser) {
      console.log("Admin user already exists:", existingUser.email);
      return;
    }

    // Hash the password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(adminData.password, saltRounds);

    // Create new admin user
    const newAdmin = new User({
      ...adminData,
      password: hashedPassword,
    });

    // Save the user to MongoDB
    await newAdmin.save();
    console.log("Admin user created successfully:", newAdmin.email);
  } catch (error) {
    console.error("Error creating admin user:", error);
  } finally {
    // Close the MongoDB connection
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

// Run the function
createAdmin();
