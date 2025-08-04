import { Request, Response } from "express";
import Invite from "../models/Invite";
import Video from "../models/Video";
import User from "../models/User";
import { AuthenticatedRequest } from "../middleware/authenticate";

// This function for send invite to user for video
export const sendInvite = async (req: AuthenticatedRequest, res: Response) => {
  const { videoId } = req.params;
  const { username } = req.body;
  console.log(videoId, username);
  const invitedBy = req.user?.id;

  // Check if user login, no login then error
  if (!invitedBy)
    return res
      .status(401)
      .json({ code: 401, message: "Unauthorized: No user authenticated" });

  try {
    // Find video exist or not
    const shareVideo = await Video.findById(videoId);
    if (!shareVideo)
      return res.status(404).json({ code: 404, message: "Video not found" });

    // Check if this user own the video, not own then cannot share
    if (shareVideo.uploadedBy.toString() !== invitedBy)
      return res
        .status(403)
        .json({ code: 403, message: "Not authorized to access the video" });

    // Find the user to invite by username
    const sharedToUser = await User.findOne({ username: username });
    if (!sharedToUser)
      return res.status(404).json({ code: 404, message: "User not found" });

    // Make sure sharedToUser is User type
    const sharedUser = sharedToUser as typeof User.prototype;

    // Cannot invite yourself, make error if try
    if (sharedUser._id.toString() === invitedBy) {
      return res
        .status(400)
        .json({ code: 400, message: "Cannot invite yourself" });
    }

    // Check if already invite this user for this video
    const isInviteExist = await Invite.findOne({
      videoId,
      invitedUser: sharedToUser._id,
      invitedBy,
    });
    if (isInviteExist) {
      return res
        .status(400)
        .json({ code: 400, message: "Invitation already sent" });
    }

    // Create new invite record
    const invite = new Invite({
      videoId,
      invitedUser: sharedToUser._id,
      invitedBy,
      status: "pending",
    });
    await invite.save();

    console.log(sharedToUser);
    // Send back invite detail
    res.status(201).json({
      id: invite._id,
      videoId,
      invitedUser: sharedToUser._id, // Return username for frontend display
      invitedBy,
    });
  } catch (e) {
    // Something wrong, server error
    return res.status(500).json({ code: 500, message: "Server Error" });
  }
};

// This function for user to accept or reject invite
export const respondToInvite = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const { inviteId } = req.params;
  const { status } = req.body;
  const userId = req.user?.id;

  // Check if user login
  if (!userId)
    return res
      .status(401)
      .json({ code: 401, message: "Unauthorized: No user authenticated" });

  try {
    // Find invite by ID
    const invite = await Invite.findById(inviteId);
    console.log(invite);
    if (!invite)
      return res
        .status(404)
        .json({ code: 404, message: "Invitation not found" });

    // Check if invite is for this user
    if (invite.invitedUser.toString() !== userId)
      return res.status(403).json({
        code: 403,
        message: "Not authorized to respond to this invitation",
      });

    // Check if invite already responded
    if (invite.status !== "pending")
      return res
        .status(400)
        .json({ code: 400, message: "Invitation already responded" });

    // Status must be accepted or rejected only
    if (!["accepted", "rejected"].includes(status))
      return res.status(400).json({
        code: 400,
        message: "Status must either be accepted or rejected",
      });

    // Update invite status
    invite.status = status;
    await invite.save();

    // Send back updated invite detail
    res.status(200).json({
      id: invite._id,
      videoId: invite.videoId,
      invitedUser: invite.invitedUser,
      invitedBy: invite.invitedBy,
      status: invite.status,
    });
  } catch (e) {
    res.status(500).json({ code: 500, message: "Server error" });
  }
};

// Get all invites for login user
export const getInvites = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId)
    return res
      .status(401)
      .json({ code: 401, message: "Unauthorized: No user authenticated" });

  try {
    // Find all invites for this user, include video and uploader info
    const invites = await Invite.find({ invitedUser: userId })
      .populate("videoId", "title description visibility fileUrl createdAt")
      .populate("invitedBy", "username");
    res.status(200).json(invites);
  } catch (e) {
    // Server error
    res.status(500).json({ code: 500, message: "Server error" });
  }
};

// Get all accepted invites for login user
export const getAcceptedInvites = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const userId = req.user?.id;
  console.log(userId);
  if (!userId) {
    return res
      .status(401)
      .json({ code: 401, message: "Unauthorized: No user authenticated" });
  }

  try {
    // Find accepted invites, include video and uploader info
    const invites = await Invite.find({
      invitedUser: userId,
      status: "accepted",
    })
      .populate("videoId", "title description visibility fileUrl createdAt")
      .populate("invitedBy", "username");

    // Format the response to make frontend easier
    const formattedInvites = invites.map((invite) => {
      const video = invite.videoId as typeof Video.prototype;
      const invitedByUser = invite.invitedBy as typeof User.prototype;
      return {
        id: video._id,
        title: video.title,
        description: video.description,
        visibility: video.visibility,
        fileUrl: video.fileUrl,
        createdAt: video.createdAt,
        invitedBy: invitedByUser.username,
        inviteStatus: invite.status,
      };
    });
    res.status(200).json(formattedInvites);
  } catch (e) {
    console.error(e);
    // Server error
    res.status(500).json({ code: 500, message: "Server error" });
  }
};

// Get all pending invites for login user
export const getPendingInvites = async (
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
    // Find pending invites, include video and uploader info
    const invites = await Invite.find({
      invitedUser: userId,
      status: "pending",
    })
      .populate("videoId", "title description visibility fileUrl createdAt")
      .populate("invitedBy", "username")
      .lean();

    // Format response for frontend
    const formattedInvites = invites.map((invite) => {
      const video = invite.videoId as typeof Video.prototype;
      const invitedByUser = invite.invitedBy as typeof User.prototype;
      return {
        id: invite._id, // Invite ID for accept/reject actions
        videoId: video._id,
        title: video.title,
        description: video.description,
        visibility: video.visibility,
        fileUrl: video.fileUrl,
        createdAt: video.createdAt,
        invitedBy: invitedByUser.username,
        inviteStatus: invite.status,
      };
    });
    res.status(200).json(formattedInvites);
  } catch (e) {
    console.error(e);
    // Server error
    res.status(500).json({ code: 500, message: "Server error" });
  }
};
