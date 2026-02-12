import express from "express";
import { getAIHealth } from "../controllers/ai.controller.js";

const router = express.Router();

router.get("/health", getAIHealth);

export default router;
