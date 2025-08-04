import mongoose, { Schema, Document } from "mongoose";

export interface ISociety extends Document {
  name: string;
  description: string;
  members: mongoose.Types.ObjectId[];
  mentor: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const SocietySchema: Schema = new Schema(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String },
    members: [{ type: Schema.Types.ObjectId, ref: "User", default: [] }],
    mentor: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export default mongoose.model<ISociety>("Society", SocietySchema);
