import { Router } from "express";
import {
  createSociety,
  addMembers,
  removeMembers,
  getSocieties,
  addMembersByUsername,
  deleteSociety,
  fetchMembers,
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
  removeMembers
);

router.post(
  "/:societyId/members/username",
  authenticate,
  restrictTo(["Teacher"]),
  addMembersByUsername
);

// Delete society (Teacher only)
router.delete(
  "/:societyId",
  authenticate,
  restrictTo(["Teacher"]),
  deleteSociety
);

router.get(
  "/:id/members",
  authenticate,
  restrictTo(["Student", "Teacher"]),
  fetchMembers
);

export default router;
