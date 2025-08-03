import { Router } from "express";
import {
  createSociety,
  addMembers,
  removeMembers,
  getSocieties,
} from "../controllers/societyController";
import { autheticate } from "../middleware/authenticate";
import { restrictTo } from "../middleware/restrictTo";

const router = Router();

router.get(
  "/",
  autheticate,
  restrictTo(["Admin", "Teacher", "Student"]),
  getSocieties
);
router.post("/", autheticate, restrictTo(["Teacher"]), createSociety);
router.post(
  "/:societyId/members",
  autheticate,
  restrictTo(["Teacher"]),
  addMembers
);
router.delete(
  "/:societyId/members",
  autheticate,
  restrictTo(["Teacher"]),
  addMembers
);
