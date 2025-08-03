import { Router } from "express";
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
} from "../controllers/userController";
import { autheticate } from "../middleware/authenticate";
import { restrictTo } from "../middleware/restrictTo";

const router = Router();

router.get("/", autheticate, restrictTo(["Admin"]), getUsers);

router.post("/", autheticate, restrictTo(["Admin"]), createUser);

router.put("/:id", autheticate, restrictTo(["Admin"]), updateUser);

router.delete("/:id", autheticate, restrictTo(["Admin"]), deleteUser);

export default router;
