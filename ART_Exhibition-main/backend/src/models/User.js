import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    passwordHash: { type: String, required: true },
    displayName: { type: String, default: "", trim: true, maxlength: 120 },
    role: { type: String, enum: ["user"], default: "user", index: true },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
