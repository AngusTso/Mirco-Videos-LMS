import { Router } from "express";
import {
  uploadVideo,
  createVideo,
  updateVideo,
  deleteVideo,
  getOwnVideo,
  getInvitationVideo,
  getAllVideos,
  getVideoById,
  serveVideo,
  getComments,
  postComment,
  getRatings,
  postRating,
} from "../controllers/videoController";
import { authenticate } from "../middleware/authenticate";
import { restrictTo } from "../middleware/restrictTo";

const router = Router();
router.get("/all", authenticate, restrictTo(["Admin"]), getAllVideos);
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

router.get(
  "/:videoId",
  authenticate,
  restrictTo(["Student", "Teacher", "Admin"]),
  getVideoById
);

router.get("/:videoId/stream", serveVideo);

router.get(
  "/:videoId/comments",
  authenticate,
  restrictTo(["Student", "Teacher"]),
  getComments
);

router.post(
  "/:videoId/comments",
  authenticate,
  restrictTo(["Student", "Teacher"]),
  postComment
);

router.get(
  "/:videoId/ratings",
  authenticate,
  restrictTo(["Student", "Teacher"]),
  getRatings
);
router.post(
  "/:videoId/ratings",
  authenticate,
  restrictTo(["Student", "Teacher"]),
  postRating
);

export default router;
