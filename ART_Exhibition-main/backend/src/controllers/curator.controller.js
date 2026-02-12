import AISuggestion from "../models/AISuggestion.js";
import Artwork from "../models/Artwork.js";
import Exhibition from "../models/Exhibition.js";
import {
  deleteArtworkFromCloudinary,
  uploadArtworkImageToCloudinary,
} from "../services/cloudinaryUpload.service.js";

export const listAISuggestions = async (req, res) => {
  const suggestions = await AISuggestion.find({ rejected: false })
    .sort({ createdAt: -1 })
    .populate({ path: "artworkIds", match: { isDeleted: { $ne: true } } });
  return res.json(suggestions);
};

export const approveAISuggestion = async (req, res) => {
  const suggestion = await AISuggestion.findById(req.params.id);
  if (!suggestion)
    return res.status(404).json({ message: "Suggestion not found" });
  if (suggestion.rejected) {
    return res.status(409).json({ message: "Suggestion already rejected" });
  }

  // Create an Exhibition draft on approval (human-in-the-loop).
  const exhibition = await Exhibition.create({
    themeTitle: suggestion.themeTitle,
    curatorialStatement: suggestion.curatorialStatement,
    artworkIds: suggestion.artworkIds,
    published: false,
  });

  suggestion.approved = true;
  suggestion.exhibitionId = exhibition._id;
  await suggestion.save();

  return res.status(201).json({ suggestion, exhibition });
};

export const rejectAISuggestion = async (req, res) => {
  const suggestion = await AISuggestion.findByIdAndUpdate(
    req.params.id,
    { rejected: true, approved: false },
    { new: true }
  );

  if (!suggestion)
    return res.status(404).json({ message: "Suggestion not found" });

  // Best-effort cleanup: if an Exhibition draft was created from this suggestion,
  // remove it when rejecting (as long as it isn't published).
  if (suggestion.exhibitionId) {
    const exhibition = await Exhibition.findById(suggestion.exhibitionId);
    if (exhibition?.published) {
      return res.status(409).json({
        message:
          "Cannot reject: linked exhibition is already published. Unpublish/delete the exhibition first.",
      });
    }
    if (exhibition) {
      await Exhibition.findByIdAndDelete(exhibition._id);
    }
    suggestion.exhibitionId = undefined;
    await suggestion.save();
  }

  return res.json(suggestion);
};

export const deleteAISuggestion = async (req, res) => {
  const suggestion = await AISuggestion.findById(req.params.id);
  if (!suggestion) {
    return res.status(404).json({ message: "Suggestion not found" });
  }

  if (suggestion.exhibitionId) {
    const exhibition = await Exhibition.findById(suggestion.exhibitionId);
    if (exhibition?.published) {
      return res.status(409).json({
        message:
          "Cannot remove: linked exhibition is published. Unpublish/delete the exhibition first.",
      });
    }
    if (exhibition) {
      await Exhibition.findByIdAndDelete(exhibition._id);
    }
  }

  await AISuggestion.findByIdAndDelete(suggestion._id);
  return res.json({ ok: true });
};

export const publishExhibition = async (req, res) => {
  const { exhibitionId } = req.body || {};
  if (!exhibitionId) {
    return res.status(400).json({ message: "exhibitionId is required" });
  }

  const exhibitionForCheck = await Exhibition.findById(exhibitionId);
  if (!exhibitionForCheck) {
    return res.status(404).json({ message: "Exhibition not found" });
  }

  const ids = Array.isArray(exhibitionForCheck.artworkIds)
    ? exhibitionForCheck.artworkIds.map((id) => String(id))
    : [];
  if (ids.length < 2) {
    return res
      .status(400)
      .json({ message: "Exhibition must contain at least 2 artworks" });
  }

  const availableCount = await Artwork.countDocuments({
    _id: { $in: ids },
    isDeleted: { $ne: true },
  });

  if (availableCount < 2) {
    return res.status(400).json({
      message:
        "Exhibition must contain at least 2 non-deleted artworks before publishing",
    });
  }

  const exhibition = await Exhibition.findByIdAndUpdate(
    exhibitionId,
    { published: true },
    { new: true }
  );

  if (!exhibition)
    return res.status(404).json({ message: "Exhibition not found" });
  return res.json(exhibition);
};

export const listArtworksForReview = async (req, res) => {
  const status = String(req.query.status || "pending").trim();
  const allowed = new Set(["pending", "approved", "rejected"]);
  if (!allowed.has(status)) {
    return res
      .status(400)
      .json({ message: "Invalid status. Use pending, approved, or rejected." });
  }

  const limit = Math.min(Math.max(Number(req.query.limit) || 60, 1), 200);

  const artworks = await Artwork.find({ status, isDeleted: { $ne: true } })
    .sort({ createdAt: -1 })
    .limit(limit);

  return res.json(artworks);
};

export const approveArtwork = async (req, res) => {
  const artwork = await Artwork.findByIdAndUpdate(
    req.params.id,
    { status: "approved" },
    { new: true }
  );

  if (!artwork) {
    return res.status(404).json({ message: "Artwork not found" });
  }

  return res.json(artwork);
};

export const rejectArtwork = async (req, res) => {
  const artwork = await Artwork.findByIdAndUpdate(
    req.params.id,
    { status: "rejected" },
    { new: true }
  );

  if (!artwork) {
    return res.status(404).json({ message: "Artwork not found" });
  }

  return res.json(artwork);
};

export const deleteArtwork = async (req, res) => {
  const artwork = await Artwork.findById(req.params.id);
  if (!artwork || artwork.isDeleted) {
    return res.status(404).json({ message: "Artwork not found" });
  }

  // Best-effort Cloudinary cleanup. DB deletion should proceed even if Cloudinary fails.
  if (artwork.cloudinaryPublicId) {
    deleteArtworkFromCloudinary(artwork.cloudinaryPublicId).catch((err) => {
      console.error("Cloudinary delete failed:", err?.message || err);
    });
  }

  artwork.isDeleted = true;
  await artwork.save();
  return res.json({ ok: true });
};

export const listExhibitionsForReview = async (req, res) => {
  const publishedRaw = String(req.query.published || "true").trim();
  const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 200);

  const filter = {};
  if (publishedRaw === "true") filter.published = true;
  if (publishedRaw === "false") filter.published = false;

  const exhibitions = await Exhibition.find(filter)
    .sort({ createdAt: -1 })
    .limit(limit);

  return res.json(exhibitions);
};

export const unpublishExhibition = async (req, res) => {
  const exhibition = await Exhibition.findByIdAndUpdate(
    req.params.id,
    { published: false },
    { new: true }
  );
  if (!exhibition) {
    return res.status(404).json({ message: "Exhibition not found" });
  }
  return res.json(exhibition);
};

export const deleteExhibition = async (req, res) => {
  const exhibition = await Exhibition.findById(req.params.id);
  if (!exhibition) {
    return res.status(404).json({ message: "Exhibition not found" });
  }

  if (exhibition.published) {
    return res.status(409).json({
      message:
        "Cannot delete: exhibition is published. Unpublish it first (or keep it as draft).",
    });
  }

  await Exhibition.findByIdAndDelete(exhibition._id);
  return res.json({ ok: true });
};

export const getExhibitionForReview = async (req, res) => {
  try {
    const exhibition = await Exhibition.findById(req.params.id).populate({
      path: "artworkIds",
      match: { isDeleted: { $ne: true } },
    });

    if (!exhibition) {
      return res.status(404).json({ message: "Exhibition not found" });
    }

    return res.json(exhibition);
  } catch (error) {
    return res.status(400).json({ message: "Invalid exhibition id" });
  }
};

export const updateExhibitionDraft = async (req, res) => {
  try {
    const exhibition = await Exhibition.findById(req.params.id);
    if (!exhibition) {
      return res.status(404).json({ message: "Exhibition not found" });
    }

    if (exhibition.published) {
      return res.status(409).json({
        message: "Cannot edit: exhibition is already published",
      });
    }

    const { themeTitle, curatorialStatement, artworkIds } = req.body || {};

    if (typeof themeTitle === "string") {
      exhibition.themeTitle = themeTitle.trim();
    }
    if (typeof curatorialStatement === "string") {
      exhibition.curatorialStatement = curatorialStatement.trim();
    }

    if (Array.isArray(artworkIds)) {
      const requested = artworkIds
        .map((id) => (typeof id === "string" ? id.trim() : String(id || "")))
        .filter(Boolean);

      const current = new Set(
        (exhibition.artworkIds || []).map((id) => String(id))
      );
      const seen = new Set();

      for (const id of requested) {
        if (seen.has(id)) {
          return res.status(400).json({ message: "Duplicate artworkIds" });
        }
        seen.add(id);
        if (!current.has(id)) {
          return res.status(400).json({
            message:
              "artworkIds can only be reordered/removed from the existing exhibition set",
          });
        }
      }

      if (requested.length < 2) {
        return res
          .status(400)
          .json({ message: "Exhibition must contain at least 2 artworks" });
      }

      exhibition.artworkIds = requested;
    }

    // Basic validation
    if (!exhibition.themeTitle) {
      return res.status(400).json({ message: "themeTitle cannot be empty" });
    }
    if (!exhibition.curatorialStatement) {
      return res
        .status(400)
        .json({ message: "curatorialStatement cannot be empty" });
    }

    await exhibition.save();
    return res.json(exhibition);
  } catch (error) {
    return res.status(400).json({ message: "Invalid request" });
  }
};

export const updateExhibitionArtworkImage = async (req, res) => {
  const { id: exhibitionId, artworkId } = req.params;

  const exhibition = await Exhibition.findById(exhibitionId);
  if (!exhibition) {
    return res.status(404).json({ message: "Exhibition not found" });
  }

  if (exhibition.published) {
    return res.status(409).json({
      message: "Cannot edit images: exhibition is already published",
    });
  }

  const artworkIdStr = String(artworkId);
  const belongsToExhibition = (exhibition.artworkIds || []).some(
    (aId) => String(aId) === artworkIdStr
  );

  if (!belongsToExhibition) {
    return res.status(400).json({
      message: "Artwork does not belong to this exhibition",
    });
  }

  const artwork = await Artwork.findById(artworkId);
  if (!artwork || artwork.isDeleted) {
    return res.status(404).json({ message: "Artwork not found" });
  }

  try {
    const previousPublicId = artwork.cloudinaryPublicId;

    const { imageUrl, thumbnailUrl, publicId } =
      await uploadArtworkImageToCloudinary(req.file, { folder: "artworks" });

    artwork.imageUrl = imageUrl;
    artwork.thumbnailUrl = thumbnailUrl;
    artwork.cloudinaryPublicId = publicId;
    await artwork.save();

    if (previousPublicId) {
      deleteArtworkFromCloudinary(previousPublicId).catch((err) => {
        console.error("Cloudinary delete failed:", err?.message || err);
      });
    }

    return res.json(artwork);
  } catch (error) {
    console.error(error);
    const status = error?.statusCode || 500;
    return res
      .status(status)
      .json({ message: error?.message || "Failed to update artwork image" });
  }
};
