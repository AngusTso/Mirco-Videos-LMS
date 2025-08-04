import { Router } from "express";
import {
  sendInvite,
  respondToInvite,
  getInvites,
  getAcceptedInvites,
  getPendingInvites,
} from "../controllers/inviteController";
import { authenticate } from "../middleware/authenticate";
import { restrictTo } from "../middleware/restrictTo";

const router = Router();

router.get("/", authenticate, restrictTo(["Teacher", "Student"]), getInvites);
router.post(
  "/:videoId/invite",
  authenticate,
  restrictTo(["Student"]),
  sendInvite
);
router.post(
  "/:inviteId/respond",
  authenticate,
  restrictTo(["Teacher", "Student"]),
  respondToInvite
);
router.get(
  "/getAcceptedInvites",
  authenticate,
  restrictTo(["Teacher", "Student"]),
  getAcceptedInvites
);
router.get(
  "/getPendingInvites",
  authenticate,
  restrictTo(["Teacher", "Student"]),
  getPendingInvites
);

export default router;
