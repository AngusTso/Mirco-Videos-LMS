import { Router } from "express";
import {
  uploadVideo,
  createVideo,
  updateVideo,
  deleteVideo,
  getOwnVideo,
  getInvitationVideo,
} from "../controllers/videoController";
import { authenticate } from "../middleware/authenticate";
import { restrictTo } from "../middleware/restrictTo";

const router = Router();

router.get(
  "/invited",
  authenticate,
  restrictTo(["Student", "Teacher"]),
  getInvitationVideo
);

router.get(
  "/own",
  authenticate,
  restrictTo(["Student", "Teacher"]),
  getOwnVideo
);

router.post(
  "/",
  authenticate,
  restrictTo(["Student"]),
  uploadVideo,
  createVideo
);

router.put("/", authenticate, restrictTo(["Student"]), updateVideo);

router.delete(
  "/:videoId",
  authenticate,
  restrictTo(["Student", "Admin"]),
  deleteVideo
);

export default router;
