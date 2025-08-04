import { Request, Response } from "express";
import bcrypt from "bcrypt";
import User from "../models/User";

// Create new user
export const createUser = async (req: Request, res: Response) => {
  const { username, email, password, role } = req.body;
  console.log(
    "username, email, password, role:",
    username,
    email,
    password,
    role
  );
  try {
    // Check if user already exist by email or username
    const isUserExist = await User.findOne({ $or: [{ email }, { username }] });
    if (isUserExist)
      return res
        .status(400)
        .json({ code: 400, message: "User already exists" });

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const user = new User({
      username,
      email,
      password: hashedPassword,
      role,
      societies: [],
    });
    await user.save();

    // Send back user detail
    res.status(201).json({ id: user._id, username, email, role });
  } catch (e) {
    res.status(500).json({ code: 500, message: "Server Error" });
  }
};

// Get all users
export const getUsers = async (req: Request, res: Response) => {
  try {
    // Get all user info
    console.log("Get user");
    const users = await User.find({}, "username email role createdAt");
    console.log(users);
    res.status(200).json(users);
  } catch (e) {
    res.status(500).json({ code: 500, message: "Server error" });
  }
};

// Update user info
export const updateUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { username, email, role } = req.body;

  console.log(id, username, email, role);
  try {
    // Find user by ID
    const user = await User.findById(id);
    if (!user)
      return res.status(404).json({ code: 404, message: "User not found" });

    // Update fields if provided
    if (username) user.username = username;
    if (email) user.email = email;
    if (role) user.role = role;

    await user.save();

    // Send back updated user
    res.status(200).json({
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
    });
  } catch (e) {
    res.status(500).json({ code: 500, message: "Server error" });
  }
};

// Delete user
export const deleteUser = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    // Find and delete user
    const user = await User.findByIdAndDelete(id);
    if (!user)
      return res.status(404).json({ code: 404, message: "User not found" });

    res.status(204).json({ message: "User deleted" });
  } catch (e) {
    res.status(500).json({ code: 500, message: "Server error" });
  }
};
