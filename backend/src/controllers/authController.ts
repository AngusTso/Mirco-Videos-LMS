import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User";

// This function for user login
export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  try {
    // Find user by email
    const user = await User.findOne({ email });
    // No user found, give error
    if (!user)
      return res
        .status(401)
        .json({ code: 401, message: "Invalid email or password" });

    // Check if password match
    const isMatch = await bcrypt.compare(password, user.password);
    // Password wrong, give error
    if (!isMatch)
      return res
        .status(401)
        .json({ code: 401, message: "Invalid email or password" });

    // Everything ok, make JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: "3h" }
    );

    // Send token to frontend
    res.status(200).json({ token });
  } catch (e) {
    res.status(500).json({ code: 500, message: "Server error" });
  }
};
