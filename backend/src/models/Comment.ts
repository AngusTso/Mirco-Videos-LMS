import mongoose, { Schema, Document } from "mongoose";

export interface IComment extends Document {
  videoId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  content: string;
  timestamp?: number;
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema: Schema = new Schema(
  {
    videoId: { type: Schema.Types.ObjectId, ref: "Video", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true },
    timestamp: { type: Number, required: false },
  },
  { timestamps: true }
);

export default mongoose.model<IComment>("Comment", CommentSchema);
