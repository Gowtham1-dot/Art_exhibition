import mongoose from "mongoose";

const exhibitionSchema = new mongoose.Schema(
  {
    themeTitle: { type: String, required: true, trim: true, maxlength: 140 },
    curatorialStatement: {
      type: String,
      required: true,
      trim: true,
      maxlength: 8000,
    },
    artworkIds: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Artwork", required: true },
    ],

    published: { type: Boolean, default: false, index: true },
    createdAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

export default mongoose.model("Exhibition", exhibitionSchema);
