import mongoose from "mongoose";

const aiSuggestionSchema = new mongoose.Schema(
  {
    themeTitle: { type: String, required: true, trim: true, maxlength: 140 },
    curatorialStatement: {
      type: String,
      required: true,
      trim: true,
      maxlength: 8000,
    },

    reasoning: { type: String, required: true, trim: true, maxlength: 12000 },
    confidenceScore: { type: Number, required: true, min: 0, max: 1 },

    artworkIds: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Artwork", required: true },
    ],

    approved: { type: Boolean, default: false, index: true },
    rejected: { type: Boolean, default: false, index: true },

    exhibitionId: { type: mongoose.Schema.Types.ObjectId, ref: "Exhibition" },
  },
  { timestamps: true }
);

export default mongoose.model("AISuggestion", aiSuggestionSchema);
