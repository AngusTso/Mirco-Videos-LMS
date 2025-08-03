import { Router } from "express";
import { createUser } from "../controllers/userController";
import { autheticate } from "../middleware/authenticate";
import { restrictTo } from "../middleware/restrictTo";

const router = Router();

router.post("/", autheticate, restrictTo(["Admin"]), createUser);

export default router;
