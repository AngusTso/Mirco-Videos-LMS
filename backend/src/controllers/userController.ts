import { Request, Response } from "express";
import bcrypt from "bcrypt";
import User from "../models/User";

export const createUser = async (req: Request, res: Response) => {
  const { username, email, password, role } = req.body;

  try {
    //check if user exist with the email and username, if exist return error
    const isUserExist = await User.findOne({ $or: [{ email }, { username }] });
    if (isUserExist)
      return res
        .status(400)
        .json({ code: 400, message: "User already exists" });

    //hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    //create the user
    const user = new User({
      username,
      email,
      password: hashedPassword,
      role,
      societies: [],
    });
    await user.save();
    res.status(201).json({ id: user._id, username, email, role });
  } catch (e) {
    res.status(500).json({ code: 500, message: "Server Error" });
  }
};

export const getUsers = async (req: Request, res: Response) => {
  try {
    //get all user(username,email,role,createdAt)
    const users = await User.find({}, "username email role createdAt");
    res.status(200).json(users);
  } catch (e) {
    res.status(500).json({ code: 500, message: "Server error" });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { username, email, role } = req.body;

  try {
    const user = await User.findById(id);
    if (!user)
      return res.status(404).json({ code: 404, message: "User not found" });

    //update user field based on the req body
    if (username) user.username = username;
    if (email) user.email = email;
    if (role) user.role = role;

    await user.save();

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

export const deleteUser = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const user = await User.findByIdAndDelete(id);
    if (!user)
      return res.status(404).json({ code: 404, message: "User not found" });

    res.status(204).json({ message: "User deleted" });
  } catch (e) {
    res.status(500).json({ code: 500, message: "Server error" });
  }
};
