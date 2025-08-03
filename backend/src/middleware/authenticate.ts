import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthenticatedRequest extends Request {
  user?: { id: string; role: string };
}

export const authenticate = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  //get token from request
  const token = req.headers.authorization?.split(" ")[1];

  if (!token)
    return res.status(401).json({ code: 401, message: "No Token provided" });

  //if verify success, save the id and role to req.user else return error to user
  const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
    id: string;
    role: string;
  };
  req.user = decoded;
  next();

  try {
  } catch (error) {
    res.status(401).json({ code: 401, message: "Invalid Token" });
  }
};
