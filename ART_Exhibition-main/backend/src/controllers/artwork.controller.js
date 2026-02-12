import Artwork from "../models/Artwork.js";
import { uploadArtworkImageToCloudinary } from "../services/cloudinaryUpload.service.js";
import { analyzeAndStoreArtwork } from "../services/aiArtworkAnalysis.service.js";

function parseCommaSeparated(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return String(value)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export const uploadArtwork = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image uploaded" });
    }

    const title = String(req.body.title || "").trim();
    const artistName = String(req.body.artistName || "").trim();
    const description = String(req.body.description || "").trim();

    if (!title) {
      return res.status(400).json({ message: "Title is required" });
    }
    if (!artistName) {
      return res.status(400).json({ message: "Artist name is required" });
    }

    const { imageUrl, thumbnailUrl, publicId } =
      await uploadArtworkImageToCloudinary(req.file, {
        folder: "artworks",
      });

    const tags = parseCommaSeparated(req.body.tags);
    const colors = parseCommaSeparated(req.body.colors);

    const uploadedBy = req.auth?.role === "user" ? req.auth.userId : null;

    const artwork = await Artwork.create({
      title,
      artistName,
      description,
      tags,
      style: req.body.style,
      medium: req.body.medium,
      colors,
      imageUrl,
      thumbnailUrl,
      cloudinaryPublicId: publicId,
      isDeleted: false,
      status: "pending",
      uploadedBy,
    });

    // Best-effort AI analysis. Failures should not block upload.
    analyzeAndStoreArtwork({
      artworkId: artwork._id,
      title: artwork.title,
      description: artwork.description,
      tags: artwork.tags,
      colors: artwork.colors,
      style: artwork.style,
    }).catch((error) => {
      console.error("AI analysis failed:", error);
    });

    res.status(201).json(artwork);
  } catch (error) {
    console.error("Upload failed:", error);

    const status =
      Number(error?.statusCode) ||
      (error?.name === "ValidationError" ? 400 : 500);

    const response = { message: "Upload failed" };

    if (process.env.NODE_ENV !== "production") {
      response.details = String(error?.message || error);
      if (error?.name) response.errorName = error.name;
    }

    res.status(status).json(response);
  }
};

export const listMyArtworks = async (req, res) => {
  try {
    if (req.auth?.role !== "user" || !req.auth?.userId) {
      return res.status(403).json({ message: "User access required" });
    }

    const limit = Math.min(Math.max(Number(req.query.limit) || 120, 1), 300);

    const artworks = await Artwork.find({
      uploadedBy: req.auth.userId,
      isDeleted: { $ne: true },
    })
      .sort({ createdAt: -1 })
      .limit(limit);

    return res.json(artworks);
  } catch (error) {
    console.error("List my artworks failed:", error);
    return res.status(500).json({ message: "Failed to fetch artworks" });
  }
};

export const listApprovedArtworks = async (req, res) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 60, 1), 200);
    const artworks = await Artwork.find({
      status: "approved",
      isDeleted: { $ne: true },
    })
      .sort({ createdAt: -1 })
      .limit(limit);
    return res.json(artworks);
  } catch (error) {
    console.error("List artworks failed:", error);
    return res.status(500).json({ message: "Failed to fetch artworks" });
  }
};

export const getApprovedArtworkById = async (req, res) => {
  try {
    const artwork = await Artwork.findOne({
      _id: req.params.id,
      status: "approved",
      isDeleted: { $ne: true },
    });

    if (!artwork) {
      return res.status(404).json({ message: "Artwork not found" });
    }

    return res.json(artwork);
  } catch (error) {
    return res.status(400).json({ message: "Invalid artwork id" });
  }
};
