import { Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import Video from "../models/Video";
import Comment from "../models/Comment";
import Rating from "../models/Rating";
import { AuthenticatedRequest } from "../middleware/authenticate";
import Invite from "../models/Invite";
import { v4 as uuidv4 } from "uuid";
import jwt from "jsonwebtoken";

// Configure Multer for local storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "../../Uploads/videos");
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const fileExtension = path.extname(file.originalname);
    const sanitizedFilename = `${Date.now()}-${uuidv4()}${fileExtension}`;
    cb(null, sanitizedFilename); // Use sanitized filename directly
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /\.(mp4|mov|avi|webm)$/i; // Support more video formats
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = file.mimetype.startsWith("video/"); // Check MIME type
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error("Only video files (mp4, mov, avi, webm) are allowed"));
  },
  limits: { fileSize: 1024 * 1024 * 1024 }, // 1GB limit
}).single("video"); // Ensure field name matches frontend form

export const uploadVideo = async (req: AuthenticatedRequest, res: Response) => {
  // Call Multer middleware explicitly to handle errors
  upload(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      console.error("Multer Error:", err.message);
      return res
        .status(400)
        .json({ code: 400, message: `Multer Error: ${err.message}` });
    } else if (err) {
      console.error("File Upload Error:", err.message);
      return res.status(400).json({ code: 400, message: err.message });
    }

    const userId = req.user?.id;
    console.log("User ID:", userId);
    console.log("File:", req.file);
    console.log("Body:", req.body);

    if (!req.file || !userId) {
      return res.status(400).json({
        code: 400,
        message: "No file uploaded or user not authenticated",
      });
    }

    const { title, description } = req.body;

    // Validate required fields
    if (!title || !description) {
      return res.status(400).json({
        code: 400,
        message: "Title and description are required",
      });
    }

    try {
      // File is already saved with sanitized filename by Multer
      const filePath = req.file.path;

      // Verify file exists
      if (!fs.existsSync(filePath)) {
        return res.status(500).json({
          code: 500,
          message: "Uploaded file not found on server",
        });
      }

      const video = new Video({
        title,
        description,
        filePath,
        uploadedBy: userId,
      });
      await video.save();

      res.status(201).json({
        code: 201,
        message: "Video uploaded successfully",
        video: {
          _id: video._id,
          title: video.title,
          description: video.description,
          filePath: video.filePath,
        },
      });
    } catch (e: any) {
      console.error("Database Error:", e.message);
      res
        .status(500)
        .json({ code: 500, message: `Server Error: ${e.message}` });
    }
  });
};

export const createVideo = async (req: AuthenticatedRequest, res: Response) => {
  const { title, description } = req.body;
  const file = req.file;
  const uploadedBy = req.user?.id;

  if (!uploadedBy)
    return res
      .status(401)
      .json({ code: 401, message: "Unauthorized: No user authenticated" });

  if (!file)
    return res
      .status(400)
      .json({ code: 400, message: "No video file uploaded" });

  try {
    const video = new Video({
      title,
      description,
      filePath: file.path,
      uploadedBy,
    });

    await video.save();

    res.status(201).json({
      id: video._id,
      title,
      description,
      filePath: video.filePath,
      uploadedBy,
    });
  } catch (e) {
    res.status(500).json({ code: 500, message: "Server error" });
  }
};

export const updateVideo = async (req: AuthenticatedRequest, res: Response) => {
  const { videoId } = req.params;
  const { title, description } = req.body;
  const userId = req.user?.id;

  if (!userId)
    return res
      .status(401)
      .json({ code: 401, message: "Unauthorized: No user authenticated" });

  try {
    const updateVideo = await Video.findById(videoId);
    if (!updateVideo)
      return res.status(404).json({ code: 404, message: "Video not found" });

    if (updateVideo.uploadedBy.toString() !== userId)
      return res
        .status(403)
        .json({ code: 403, message: "Not authorized to update" });

    if (title) updateVideo.title = title;
    if (description) updateVideo.description = description;

    await updateVideo.save();

    res.status(200).json({
      id: updateVideo._id,
      title: updateVideo.title,
      description: updateVideo.description,
      filePath: updateVideo.filePath,
      uploadedBy: updateVideo.uploadedBy,
    });
  } catch (e) {
    res.status(500).json({ code: 500, message: "Server Error" });
  }
};

export const deleteVideo = async (req: AuthenticatedRequest, res: Response) => {
  const { videoId } = req.params;
  const userId = req.user?.id;

  if (!userId) {
    return res
      .status(401)
      .json({ code: 401, message: "Unauthorized: No user authenticated" });
  }

  try {
    const video = await Video.findById(videoId);
    if (!video) {
      return res.status(404).json({ code: 404, message: "Video not found" });
    }

    // Ensure video.uploadedBy is a string for comparison
    if (video.uploadedBy.toString() !== userId) {
      return res
        .status(403)
        .json({ code: 403, message: "Not authorized to delete the video" });
    }

    // Delete associated invites
    await Invite.deleteMany({ videoId: videoId });

    // Delete the video file
    if (fs.existsSync(video.filePath)) {
      fs.unlinkSync(video.filePath);
    } else {
      console.warn(`deleteVideo - File not found at path: ${video.filePath}`);
    }

    await video.deleteOne();
    res.status(204).send();
  } catch (e: any) {
    console.error(`deleteVideo - Server Error: ${e.message}`, e.stack);
    res.status(500).json({ code: 500, message: `Server Error: ${e.message}` });
  }
};

// backend/src/controllers/videoController.ts
export const getVideoById = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const { videoId } = req.params;
  const userId = req.user?.id;

  console.log(`getVideoById - Video ID: ${videoId}`);
  console.log(`getVideoById - User ID: ${userId}`);

  if (!userId) {
    console.error(`getVideoById - Unauthorized: No user authenticated`);
    return res
      .status(401)
      .json({ code: 401, message: "Unauthorized: No user authenticated" });
  }

  try {
    const video = await Video.findById(videoId).populate(
      "uploadedBy",
      "username"
    );
    if (!video) {
      console.error(`getVideoById - Video not found for ID: ${videoId}`);
      return res.status(404).json({ code: 404, message: "Video not found" });
    }

    const invite = await Invite.findOne({
      videoId,
      invitedUser: userId,
      status: "accepted",
    });
    const isUploader = video.uploadedBy._id.toString() === userId;
    const isInvited = !!invite;
    const isAdmin = req.user?.role === "Admin";

    console.log(
      `getVideoById - Is Uploader: ${isUploader}, Is Invited: ${isInvited}, Is Admin: ${isAdmin}`
    );

    if (!isUploader && !isInvited && !isAdmin) {
      console.error(`getVideoById - Not authorized for user: ${userId}`);
      return res.status(403).json({ code: 403, message: "Not authorized" });
    }

    const streamUrl = `http://localhost:3000/api/videos/${videoId}/stream?accessToken=${jwt.sign(
      { videoId, userId, role: req.user?.role },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "1h" }
    )}`;

    res.status(200).json({ ...video.toJSON(), streamUrl });
  } catch (e: any) {
    console.error(`getVideoById - Server Error: ${e.message}`, e.stack);
    res.status(500).json({ code: 500, message: `Server Error: ${e.message}` });
  }
};

//get self uploaded vids
export const getOwnVideo = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  console.log(userId);
  if (!userId)
    return res
      .status(401)
      .json({ code: 401, message: "Not authorized to access" });

  try {
    const videos = await Video.find({ uploadedBy: userId }).populate(
      "uploadedBy",
      "username"
    );
    res.status(200).json(videos);
  } catch (e) {
    res.status(500).json({ code: 500, message: "Server Error" });
  }
};

//get all invited vids
export const getInvitationVideo = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const userId = req.user?.id;

  if (!userId) {
    return res
      .status(401)
      .json({ code: 401, message: "Unauthorized: No user authenticated" });
  }

  try {
    const invites = await Invite.find({
      invitedUser: userId,
      status: "accepted",
    }).select("videoId");

    //invite transform obj from above to array of id (suggested by ai)
    const invitedVideosIds = invites.map((invite) => invite.videoId);

    const videos = await Video.find({
      _id: { $in: invitedVideosIds },
    }).populate("uploadedBy", "username");

    res.status(200).json(videos);
  } catch (e) {
    res.status(500).json({ code: 500, message: "Server Error" });
  }
};

//Not planned to implement on frontend for now , implement if enough time (sample generated by ai)
export const getAllVideos = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  if (!req.user) {
    return res
      .status(401)
      .json({ code: 401, message: "Unauthorized: No user authenticated" });
  }

  try {
    const videos = await Video.find().populate("uploadedBy", "username");
    res.status(200).json(videos);
  } catch (error) {
    res.status(500).json({ code: 500, message: "Server error" });
  }
};

//(generated by ai)
export const serveVideo = async (req: AuthenticatedRequest, res: Response) => {
  const { videoId } = req.params;
  const { accessToken } = req.query;

  console.log(`serveVideo - Video ID: ${videoId}`);
  console.log(
    `serveVideo - Access Token: ${accessToken ? "Present" : "Missing"}`
  );

  if (!accessToken) {
    console.error("serveVideo - Unauthorized: No access token provided");
    return res
      .status(401)
      .json({ code: 401, message: "Unauthorized: No access token provided" });
  }

  try {
    const decoded = jwt.verify(
      accessToken as string,
      process.env.JWT_SECRET || "your-secret-key"
    );
    if (
      typeof decoded !== "object" ||
      !("videoId" in decoded) ||
      (decoded as jwt.JwtPayload).videoId !== videoId
    ) {
      console.error("serveVideo - Invalid access token");
      return res
        .status(403)
        .json({ code: 403, message: "Invalid access token" });
    }

    const userId = decoded.userId;
    const role = decoded.role;
    console.log(`serveVideo - User ID: ${userId}`);

    const video = await Video.findById(videoId);
    if (!video) {
      console.error(`serveVideo - Video not found for ID: ${videoId}`);
      return res.status(404).json({ code: 404, message: "Video not found" });
    }

    const invite = await Invite.findOne({
      videoId,
      invitedUser: userId,
      status: "accepted",
    });
    const isUploader = video.uploadedBy.toString() === userId;
    const isInvited = !!invite;
    const isAdmin = role === "Admin";

    console.log(
      `serveVideo - Is Uploader: ${isUploader}, Is Invited: ${isInvited}, Is Admin: ${isAdmin}`
    );
    console.log(`serveVideo - Video File Path: ${video.filePath}`);

    if (!isUploader && !isInvited && !isAdmin) {
      console.error(`serveVideo - Not authorized for user: ${userId}`);
      return res
        .status(403)
        .json({ code: 403, message: "Not authorized to view this video" });
    }

    const videoPath = path.normalize(video.filePath);
    console.log(`serveVideo - Normalized Video Path: ${videoPath}`);

    if (!fs.existsSync(videoPath)) {
      console.error(`serveVideo - File not found at path: ${videoPath}`);
      return res
        .status(404)
        .json({ code: 404, message: "Video file not found" });
    }

    const stat = fs.statSync(videoPath);
    const fileSize = stat.size;
    const range = req.headers.range;

    console.log(`serveVideo - File Size: ${fileSize} bytes`);
    console.log(`serveVideo - Range Header: ${range || "None"}`);

    const ext = path.extname(videoPath).toLowerCase();
    const contentType =
      {
        ".mp4": "video/mp4",
        ".mov": "video/quicktime",
        ".avi": "video/x-msvideo",
        ".webm": "video/webm",
      }[ext] || "video/mp4";

    console.log(`serveVideo - Content-Type: ${contentType}`);

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0] ?? "0", 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = end - start + 1;

      if (start >= fileSize || end >= fileSize) {
        console.error(
          `serveVideo - Invalid range: ${start}-${end}/${fileSize}`
        );
        return res
          .status(416)
          .json({ code: 416, message: "Requested range not satisfiable" });
      }

      const headers = {
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": chunkSize,
        "Content-Type": contentType,
        "Access-Control-Expose-Headers":
          "Content-Range,Accept-Ranges,Content-Length,Content-Type",
      };

      console.log(
        `serveVideo - Sending partial content with headers:`,
        headers
      );
      res.writeHead(206, headers);

      const videoStream = fs.createReadStream(videoPath, { start, end });
      videoStream.on("error", (err) => {
        console.error(`serveVideo - Stream Error: ${err.message}`);
        res
          .status(500)
          .json({ code: 500, message: `Stream Error: ${err.message}` });
      });
      videoStream.pipe(res);
    } else {
      const headers = {
        "Content-Length": fileSize,
        "Content-Type": contentType,
        "Accept-Ranges": "bytes",
        "Access-Control-Expose-Headers":
          "Content-Range,Accept-Ranges,Content-Length,Content-Type",
      };

      console.log(`serveVideo - Sending full content with headers:`, headers);
      res.writeHead(200, headers);
      const videoStream = fs.createReadStream(videoPath);
      videoStream.on("error", (err) => {
        console.error(`serveVideo - Stream Error: ${err.message}`);
        res
          .status(500)
          .json({ code: 500, message: `Stream Error: ${err.message}` });
      });
      videoStream.pipe(res);
    }
  } catch (e: any) {
    console.error(`serveVideo - Server Error: ${e.message}`, e.stack);
    res.status(500).json({ code: 500, message: `Server Error: ${e.message}` });
  }
};

export const getComments = async (req: AuthenticatedRequest, res: Response) => {
  const { videoId } = req.params;
  const userId = req.user?.id;
  console.log(videoId);
  if (!userId)
    return res
      .status(401)
      .json({ code: 401, message: "Unauthorized: No user authenticated" });

  try {
    const comments = await Comment.find({ videoId }).populate(
      "userId",
      "username"
    );
    res.status(200).json(comments);
  } catch (e) {
    res.status(500).json({ code: 500, message: "Server Error" });
  }
};

export const postComment = async (req: AuthenticatedRequest, res: Response) => {
  const { videoId } = req.params;
  const { content, timestamp } = req.body;
  const userId = req.user?.id;

  if (!userId)
    return res
      .status(401)
      .json({ code: 401, message: "Unauthorized: No user authenticated" });

  if (!content)
    return res
      .status(400)
      .json({ code: 400, message: "Comment content is required" });

  try {
    const video = await Video.findById(videoId);
    if (!video)
      return res.status(404).json({ code: 404, message: "Video not found" });

    // Check access (uploader, invited, or admin)
    const invite = await Invite.findOne({
      videoId,
      invitedUser: userId,
      status: "accepted",
    });
    if (
      video.uploadedBy.toString() !== userId &&
      !invite &&
      req.user?.role !== "Admin"
    ) {
      return res.status(403).json({
        code: 403,
        message: "Not authorized to comment on this video",
      });
    }

    const comment = new Comment({
      videoId,
      userId,
      content,
      timestamp,
    });
    await comment.save();
    res.status(201).json(comment);
  } catch (e) {
    res.status(500).json({ code: 500, message: "Server Error" });
  }
};

export const getRatings = async (req: AuthenticatedRequest, res: Response) => {
  const { videoId } = req.params;
  const userId = req.user?.id;

  if (!userId)
    return res
      .status(401)
      .json({ code: 401, message: "Unauthorized: No user authenticated" });

  try {
    const ratings = await Rating.find({ videoId });
    const userRating = ratings.find(
      (r) => r.userId.toString() === userId
    )?.rating;
    const averageRating =
      ratings.length > 0
        ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
        : null;

    res.status(200).json({ userRating, averageRating });
  } catch (e) {
    res.status(500).json({ code: 500, message: "Server Error" });
  }
};

export const postRating = async (req: AuthenticatedRequest, res: Response) => {
  const { videoId } = req.params;
  const { rating } = req.body;
  const userId = req.user?.id;

  if (!userId)
    return res
      .status(401)
      .json({ code: 401, message: "Unauthorized: No user authenticated" });

  if (!rating || rating < 1 || rating > 5)
    return res
      .status(400)
      .json({ code: 400, message: "Rating must be between 1 and 5" });

  try {
    const video = await Video.findById(videoId);
    if (!video)
      return res.status(404).json({ code: 404, message: "Video not found" });

    // Check access (uploader, invited, or admin)
    const invite = await Invite.findOne({
      videoId,
      invitedUser: userId,
      status: "accepted",
    });
    if (
      video.uploadedBy.toString() !== userId &&
      !invite &&
      req.user?.role !== "Admin"
    ) {
      return res
        .status(403)
        .json({ code: 403, message: "Not authorized to rate this video" });
    }

    // Update or create rating
    const existingRating = await Rating.findOne({ videoId, userId });
    if (existingRating) {
      existingRating.rating = rating;
      await existingRating.save();
      res.status(200).json(existingRating);
    } else {
      const newRating = new Rating({ videoId, userId, rating });
      await newRating.save();
      res.status(201).json(newRating);
    }
  } catch (e) {
    res.status(500).json({ code: 500, message: "Server Error" });
  }
};
