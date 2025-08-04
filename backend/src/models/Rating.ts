// models/Rating.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IRating extends Document {
  videoId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  rating: number;
  createdAt: Date;
  updatedAt: Date;
}

const RatingSchema: Schema = new Schema(
  {
    videoId: { type: Schema.Types.ObjectId, ref: "Video", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
  },
  { timestamps: true }
);

export default mongoose.model<IRating>("Rating", RatingSchema);
