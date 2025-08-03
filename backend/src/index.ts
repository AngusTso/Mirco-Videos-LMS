import express, { Request, Response, Application } from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5050;
const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/micro-video-lms";

//Middleware Section
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

app.get("/", (req: Request, res: Response) =>
  res.send("This is Micro-LMS Backend")
);

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB");

    //Start server
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((e) => console.error("Failed to connect to MongoDB", e));
