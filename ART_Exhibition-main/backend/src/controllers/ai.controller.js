import { GEMINI_MODEL, GEMINI_MODEL_FALLBACKS } from "../config/aiClient.js";
import { generateContentWithFallback } from "../services/geminiWithFallback.service.js";

export async function getAIHealth(req, res) {
  const keyPresent = Boolean(
    (
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_GEMINI_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      ""
    )
      .toString()
      .trim()
  );

  const allowInProd =
    String(process.env.ALLOW_AI_HEALTH || "").toLowerCase() === "true";
  const isProd =
    String(process.env.NODE_ENV || "").toLowerCase() === "production";
  if (isProd && !allowInProd) {
    return res.status(404).json({ message: "Not found" });
  }

  const live = String(req.query.live || "false").toLowerCase() === "true";

  const base = {
    ok: true,
    configured: keyPresent,
    model: GEMINI_MODEL,
    modelFallbacks: GEMINI_MODEL_FALLBACKS,
    liveTestRan: live,
  };

  if (!live) return res.json(base);

  if (!keyPresent) {
    return res.status(503).json({
      ...base,
      ok: false,
      configured: false,
      error: "Missing GEMINI_API_KEY (or GOOGLE_API_KEY)",
    });
  }

  const test = await generateContentWithFallback("Reply with exactly: OK", {
    models: GEMINI_MODEL_FALLBACKS,
  });

  if (!test.ok) {
    return res.status(test.kind === "quota" ? 429 : 503).json({
      ...base,
      ok: false,
      kind: test.kind,
      message: test.error?.message || "Gemini request failed",
      status: test.error?.status,
      retryAfterSeconds: test.retryAfterSeconds,
    });
  }

  return res.json({
    ...base,
    ok: true,
    configured: true,
    liveModelUsed: test.model,
    sample: test.text?.trim()?.slice(0, 200) || "",
  });
}
