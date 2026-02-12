import { GoogleGenerativeAI } from "@google/generative-ai";

function getGeminiApiKey() {
  // Support common env var names to reduce setup friction.
  return (
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    ""
  ).trim();
}

let genAI;
function getGenAI() {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error(
      "Gemini is not configured: missing GEMINI_API_KEY (or GOOGLE_API_KEY). Add it to backend/.env"
    );
  }
  if (!genAI) genAI = new GoogleGenerativeAI(apiKey);
  return genAI;
}

export const GEMINI_MODEL = (process.env.GEMINI_MODEL || "gemini-2.5-flash")
  .toString()
  .trim();

// Ordered fallback list for accounts/regions where specific models differ.
// Include both "-latest" and non-latest model ids to maximize compatibility.
export const GEMINI_MODEL_FALLBACKS = Array.from(
  new Set(
    [
      GEMINI_MODEL,
      // Prefer currently-supported models first.
      "gemini-2.5-flash",
      "gemini-2.5-flash-lite",
      "gemini-3-flash",
      "gemini-1.5-flash-latest",
      "gemini-1.5-flash",
      "gemini-1.5-pro-latest",
      "gemini-1.5-pro",
      // Older model ids (may be unavailable or have separate quotas).
      "gemini-2.0-flash",
      "gemini-2.0-flash-lite",
      "gemini-1.0-pro",
    ]
      .map((m) => String(m || "").trim())
      .filter(Boolean)
  )
);

export function getGeminiModel(modelName) {
  return getGenAI().getGenerativeModel({ model: modelName });
}

// Back-compat default export used in older code paths.
export const geminiModel = getGeminiModel(GEMINI_MODEL);
