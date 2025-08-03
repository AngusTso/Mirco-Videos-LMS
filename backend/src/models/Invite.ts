import mongoose, { Schema, Document } from "mongoose";

export interface IInvite extends Document {
  videoId: mongoose.Types.ObjectId;
  invitedUser: mongoose.Types.ObjectId;
  invitedBy: mongoose.Types.ObjectId;
  status: "pending" | "accepted" | "denied";
  createdAt: Date;
  UpdatedAt: Date;
}

const InviteSchema: Schema = new Schema(
  {
    videoId: { type: Schema.Types.ObjectId, ref: "Video", required: true },
    invitedUser: { type: Schema.Types.ObjectId, ref: "User", required: true },
    invitedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: ["pending", "accepted", "denied"],
      default: "pending",
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model<IInvite>("Invite", InviteSchema);
