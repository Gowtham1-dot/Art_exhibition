import express from "express";
import {
  getApprovedArtworkById,
  listApprovedArtworks,
  listMyArtworks,
  uploadArtwork,
} from "../controllers/artwork.controller.js";
import { upload } from "../middleware/upload.middleware.js";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";

const router = express.Router();

// Public browsing (approved only)
router.get("/", listApprovedArtworks);
// Logged-in user: view own uploads + statuses
router.get("/mine", requireAuth, requireRole("user"), listMyArtworks);

// Public: approved artwork details
router.get("/:id", getApprovedArtworkById);

// Upload requires login (user or curator). If user, artwork is linked to the user.
router.post("/", requireAuth, upload.single("image"), uploadArtwork);

export default router;
