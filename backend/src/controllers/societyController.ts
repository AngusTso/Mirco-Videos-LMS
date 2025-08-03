import { Request, Response } from "express";
import Society from "../models/Society";
import User from "../models/User";

interface AuthenticatedRequest extends Request {
  user?: { id: string; role: string };
}

export const createSociety = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const { name, description } = req.body;
  const mentor = req.user?.id;

  if (!mentor)
    return res
      .status(401)
      .json({ code: 401, message: "Unauthorized: No user found" });

  try {
    //check if society exist , if yes -> error code 400
    const existingSociety = await Society.findOne({ name });
    if (existingSociety)
      return res
        .status(400)
        .json({ code: 400, message: "Society already exists" });

    const society = new Society({
      name,
      description,
      members: [],
      mentor,
    });

    await society.save();

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

export const addMembers = async (req: AuthenticatedRequest, res: Response) => {
  const { societyId } = req.params;
  const { userIds } = req.body;

  try {
    //check if society exist, if not -> error code 404
    const society = await Society.findById(societyId);
    if (!society)
      return res.status(404).json({ code: 404, message: "Society not found" });

    //check if all user exist, if not -> error code 404
    const users = await User.find({ _id: { $in: userIds } });
    if (users.length !== userIds.length)
      return res
        .status(404)
        .json({ code: 404, message: "some users not found" });

    //make sure no duplicate
    let nonDupsMembers = new Set([...society.members, ...userIds]);
    society.members = [...nonDupsMembers];

    await society.save();

    await User.updateMany(
      { _id: { $in: userIds } },
      { $addToSet: { societies: societyId } }
    );

    res.status(200).json(society);
  } catch (e) {
    res.status(500).json({ code: 500, message: "Server error" });
  }
};

export const removeMembers = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const { societyId } = req.params;
  const { userIds } = req.body;

  try {
    //check if society exist, if not -> error code 404
    const society = await Society.findById(societyId);
    if (!society)
      return res.status(404).json({ code: 404, message: "Society not found" });

    //remove members (remark: members[objectId])
    society.members = society.members.filter(
      (member) => !userIds.includes(member.toString())
    );
    await society.save();

    await User.updateMany(
      { _id: { $in: userIds } },
      { $pull: { societies: societyId } }
    );

    res.status(200).json(society);
  } catch (e) {
    res.status(500).json({ code: 500, message: "Server error" });
  }
};

export const getSocieties = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const user = req.user;
    if (!user)
      return res
        .status(401)
        .json({ code: 401, message: "Unauthorized: No user found" });

    let societies;
    //Admin can see all societies, student and teacher can see their own
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
