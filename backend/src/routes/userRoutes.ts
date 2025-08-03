import { Router } from "express";
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
} from "../controllers/userController";
import { authenticate } from "../middleware/authenticate";
import { restrictTo } from "../middleware/restrictTo";

const router = Router();

router.get("/", authenticate, restrictTo(["Admin"]), getUsers);

router.post("/", authenticate, restrictTo(["Admin"]), createUser);

router.put("/:id", authenticate, restrictTo(["Admin"]), updateUser);

router.delete("/:id", authenticate, restrictTo(["Admin"]), deleteUser);

export default router;
