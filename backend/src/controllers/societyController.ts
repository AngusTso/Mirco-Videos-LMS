import { Request, Response } from "express";
import Society from "../models/Society";
import User from "../models/User";
import { AuthenticatedRequest } from "../middleware/authenticate";

// Create new society
export const createSociety = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const { name, description } = req.body;
  const mentor = req.user?.id;

  // Check login
  if (!mentor)
    return res
      .status(401)
      .json({ code: 401, message: "Unauthorized: No user found" });

  try {
    // Check if society name already exist
    const existingSociety = await Society.findOne({ name });
    if (existingSociety)
      return res
        .status(400)
        .json({ code: 400, message: "Society already exists" });

    // Create new society
    const society = new Society({
      name,
      description,
      members: [],
      mentor,
    });

    await society.save();

    // Send back society detail
    res.status(201).json({
      id: society._id,
      name,
      description,
      members: society.members,
      mentor,
    });
  } catch (e) {
    res.status(500).json({ code: 500, message: "Server error" });
  }
};

// Add members to society by user IDs
export const addMembers = async (req: AuthenticatedRequest, res: Response) => {
  const { societyId } = req.params;
  const { userIds } = req.body;
  console.log(userIds);
  try {
    // Check if society exist
    const society = await Society.findById(societyId);
    if (!society)
      return res.status(404).json({ code: 404, message: "Society not found" });

    // Check if all users exist
    const users = await User.find({ _id: { $in: userIds } });
    if (users.length !== userIds.length)
      return res
        .status(404)
        .json({ code: 404, message: "some users not found" });

    // Add users to society, no duplicate
    let nonDupsMembers = new Set([...society.members, ...userIds]);
    society.members = [...nonDupsMembers];

    await society.save();

    // Add society to users' societies list
    await User.updateMany(
      { _id: { $in: userIds } },
      { $addToSet: { societies: societyId } }
    );

    res.status(200).json(society);
  } catch (e) {
    res.status(500).json({ code: 500, message: "Server error" });
  }
};

// Remove members from society
export const removeMembers = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const { societyId } = req.params;
  const { userIds } = req.body;
  console.log(societyId, userIds);
  try {
    // Check if society exist
    const society = await Society.findById(societyId);
    if (!society)
      return res.status(404).json({ code: 404, message: "Society not found" });

    // Remove users from society members
    society.members = society.members.filter(
      (member) => !userIds.includes(member.toString())
    );
    await society.save();

    // Remove society from users' societies list
    await User.updateMany(
      { _id: { $in: userIds } },
      { $pull: { societies: societyId } }
    );

    res.status(200).json(society);
  } catch (e) {
    res.status(500).json({ code: 500, message: "Server error" });
  }
};

// Add members by username
export const addMembersByUsername = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const { societyId } = req.params;
  const { usernames } = req.body;

  try {
    // Check if society exist
    const society = await Society.findById(societyId);
    if (!society) {
      return res.status(404).json({ code: 404, message: "Society not found" });
    }

    // Find users by usernames
    const users = await User.find({ username: { $in: usernames } });
    if (users.length !== usernames.length) {
      return res
        .status(404)
        .json({ code: 404, message: "Some users not found" });
    }

    // Get user IDs
    const userIds = users.map((user) => user._id);

    // Add users to society, no duplicate
    const nonDupsMembers = new Set([...society.members, ...userIds]);
    society.members = Array.from(nonDupsMembers) as typeof society.members;

    await society.save();

    // Add society to users' societies list
    await User.updateMany(
      { _id: { $in: userIds } },
      { $addToSet: { societies: societyId } }
    );

    // Get updated society with member details
    const updatedSociety = await Society.findById(societyId)
      .populate("members", "username email")
      .populate("mentor", "username");

    res.status(200).json(updatedSociety);
  } catch (e) {
    res.status(500).json({ code: 500, message: "Server error" });
  }
};

// Get societies for user
export const getSocieties = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const user = req.user;
    // Check login
    if (!user)
      return res
        .status(401)
        .json({ code: 401, message: "Unauthorized: No user found" });

    let societies;
    // Admin see all, others only see their own
    if (user.role === "Admin") {
      societies = await Society.find()
        .populate("members", "username email")
        .populate("mentor", "username");
    } else {
      societies = await Society.find({
        $or: [{ mentor: user.id }, { members: user.id }],
      })
        .populate("members", "username email")
        .populate("mentor", "username");
    }

    res.status(200).json(societies);
  } catch (e) {
    res.status(500).json({ code: 500, message: "Server Error" });
  }
};

// Delete society
export const deleteSociety = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const { societyId } = req.params;

  try {
    // Find society
    const society = await Society.findById(societyId);
    if (!society)
      return res.status(404).json({ code: 404, message: "Society not found" });

    // Remove society from all users
    await User.updateMany(
      { $or: [{ _id: { $in: society.members } }, { _id: society.mentor }] },
      { $pull: { societies: societyId } }
    );

    // Delete society
    await Society.deleteOne({ _id: societyId });

    res.status(200).json({ message: "Society deleted successfully" });
  } catch (e) {
    console.error("deleteSociety error:", e);

    res.status(500).json({ code: 500, message: "Server error" });
  }
};

// Get society members
export const fetchMembers = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    // Find society and get member usernames
    const society = await Society.findById(req.params.id).populate(
      "members",
      "username"
    );
    console.log(req.params.id);
    if (!society) {
      return res.status(404).json({ code: 404, message: "Society not found" });
    }
    res.status(200).json(society.members);
  } catch (err) {
    res.status(500).json({ code: 500, message: "Server error" });
  }
};
