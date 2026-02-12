import express from "express";
import { createAIExhibition } from "../controllers/exhibition.controller.js";
import Exhibition from "../models/Exhibition.js";

const router = express.Router();

// GET published exhibitions
router.get("/", async (req, res) => {
  const exhibitions = await Exhibition.find({ published: true })
    .sort({ createdAt: -1 })
    .populate({
      path: "artworkIds",
      select: "imageUrl thumbnailUrl title artistName",
      match: { isDeleted: { $ne: true } },
      perDocumentLimit: 3,
    });
  res.json(exhibitions);
});

// Helpful message when users hit this in the browser as GET
router.get("/generate", (req, res) => {
  res.status(405).set("Allow", "POST").json({
    message: "Use POST /api/exhibitions/generate to generate AI suggestions.",
  });
});

// GET a single exhibition (used by frontend detail page)
router.get("/:id", async (req, res) => {
  try {
    const exhibition = await Exhibition.findOne({
      _id: req.params.id,
      published: true,
    }).populate({
      path: "artworkIds",
      match: { isDeleted: { $ne: true } },
    });

    if (!exhibition) {
      return res.status(404).json({ message: "Exhibition not found" });
    }

    res.json(exhibition);
  } catch (error) {
    res.status(400).json({ message: "Invalid exhibition id" });
  }
});

router.post("/generate", createAIExhibition);

export default router;
