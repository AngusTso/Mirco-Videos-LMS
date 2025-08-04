import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../middleware/authenticate";

export const restrictTo = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      console.log(roles);
      return res.status(403).json({ code: 403, message: "Forbidden" });
    }

    next();
  };
};
