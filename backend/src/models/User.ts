import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  role: "Admin" | "Teacher" | "Student";
  createdAt: Date;
  updatedAt: Date;
  societies: mongoose.Types.ObjectId[];
}
const UserSchema: Schema = new Schema(
  {
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["Admin", "Teacher", "Student"],
      required: true,
    },
    societies: [{ type: Schema.Types.ObjectId, ref: "Society", default: [] }],
  },
  { timestamps: true }
);

export default mongoose.model<IUser>("User", UserSchema);
