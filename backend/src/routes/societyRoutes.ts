import { Router } from "express";
import {
  createSociety,
  addMembers,
  removeMembers,
  getSocieties,
} from "../controllers/societyController";
import { authenticate } from "../middleware/authenticate";
import { restrictTo } from "../middleware/restrictTo";

const router = Router();

router.get(
  "/",
  authenticate,
  restrictTo(["Admin", "Teacher", "Student"]),
  getSocieties
);
router.post("/", authenticate, restrictTo(["Teacher"]), createSociety);
router.post(
  "/:societyId/members",
  authenticate,
  restrictTo(["Teacher"]),
  addMembers
);
router.delete(
  "/:societyId/members",
  authenticate,
  restrictTo(["Teacher"]),
  addMembers
);
