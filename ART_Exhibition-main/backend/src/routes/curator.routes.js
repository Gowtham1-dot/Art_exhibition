import express from "express";
import { loginWithPin } from "../controllers/curatorAuth.controller.js";
import {
  approveArtwork,
  approveAISuggestion,
  deleteArtwork,
  deleteAISuggestion,
  deleteExhibition,
  getExhibitionForReview,
  listArtworksForReview,
  listAISuggestions,
  listExhibitionsForReview,
  publishExhibition,
  rejectArtwork,
  rejectAISuggestion,
  unpublishExhibition,
  updateExhibitionArtworkImage,
  updateExhibitionDraft,
} from "../controllers/curator.controller.js";
import { requireCuratorAuth } from "../middleware/curatorAuth.middleware.js";
import { upload } from "../middleware/upload.middleware.js";

const router = express.Router();

// PIN login -> returns JWT
router.post("/auth/pin", loginWithPin);

router.get("/ai-suggestions", requireCuratorAuth, listAISuggestions);
router.delete("/ai-suggestions/:id", requireCuratorAuth, deleteAISuggestion);

router.get("/artworks", requireCuratorAuth, listArtworksForReview);
router.post("/artworks/:id/approve", requireCuratorAuth, approveArtwork);
router.post("/artworks/:id/reject", requireCuratorAuth, rejectArtwork);
router.delete("/artworks/:id", requireCuratorAuth, deleteArtwork);

router.get("/exhibitions", requireCuratorAuth, listExhibitionsForReview);
router.get("/exhibitions/:id", requireCuratorAuth, getExhibitionForReview);
router.put("/exhibitions/:id", requireCuratorAuth, updateExhibitionDraft);
router.post(
  "/exhibitions/:id/artworks/:artworkId/image",
  requireCuratorAuth,
  upload.single("image"),
  updateExhibitionArtworkImage
);
router.post(
  "/exhibitions/:id/unpublish",
  requireCuratorAuth,
  unpublishExhibition
);
router.delete("/exhibitions/:id", requireCuratorAuth, deleteExhibition);

router.post(
  "/ai-suggestions/:id/approve",
  requireCuratorAuth,
  approveAISuggestion
);
router.post(
  "/ai-suggestions/:id/reject",
  requireCuratorAuth,
  rejectAISuggestion
);
router.post("/exhibitions/publish", requireCuratorAuth, publishExhibition);

export default router;
