import express from "express";
import cors from "cors";

import artworkRoutes from "./routes/artwork.routes.js";
import exhibitionRoutes from "./routes/exhibition.routes.js";
import curatorRoutes from "./routes/curator.routes.js";
import aiRoutes from "./routes/ai.routes.js";
import authRoutes from "./routes/auth.routes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/artworks", artworkRoutes);
app.use("/api/exhibitions", exhibitionRoutes);
app.use("/api/curator", curatorRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/auth", authRoutes);

export default app;
