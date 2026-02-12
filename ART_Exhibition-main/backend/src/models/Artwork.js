import mongoose from "mongoose";

const aiAnalysisSchema = new mongoose.Schema(
  {
    mood: { type: String, default: "" },
    symbolism: { type: String, default: "" },
    themes: { type: [String], default: [] },
  },
  { _id: false }
);

const artworkSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    artistName: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, default: "", trim: true, maxlength: 4000 },

    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    tags: { type: [String], default: [], index: true },
    style: { type: String, default: "", trim: true, index: true },
    medium: { type: String, default: "", trim: true },
    colors: { type: [String], default: [] },

    imageUrl: { type: String, required: true, trim: true },
    thumbnailUrl: { type: String, required: true, trim: true },

    cloudinaryPublicId: { type: String, default: "", trim: true },

    isDeleted: { type: Boolean, default: false, index: true },

    aiAnalysis: { type: aiAnalysisSchema, default: () => ({}) },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Artwork", artworkSchema);
