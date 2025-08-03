import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User";

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    //user with that email doesn't exist
    if (!user)
      return res
        .status(401)
        .json({ code: 401, message: "Invalid email or password" });

    const isMatch = await bcrypt.compare(password, user.password);
    //password not match
    if (!isMatch)
      return res
        .status(401)
        .json({ code: 401, message: "Invalid email or password" });

    //generate token if everything matched
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: "3h" }
    );

    //return the token if everything fine
    res.status(200).json({ token });
  } catch (e) {
    res.status(500).json({ code: 500, message: "Server error" });
  }
};
