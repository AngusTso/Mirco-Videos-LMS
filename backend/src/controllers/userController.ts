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
