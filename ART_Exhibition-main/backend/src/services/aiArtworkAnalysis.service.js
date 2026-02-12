import Artwork from "../models/Artwork.js";
import { parseStrictJson } from "../utils/parseStrictJson.js";
import { generateContentWithFallback } from "./geminiWithFallback.service.js";

function normalizeStringArray(value) {
  if (Array.isArray(value)) {
    return value
      .map((v) => (typeof v === "string" ? v.trim() : ""))
      .filter(Boolean)
      .slice(0, 20);
  }
  return [];
}

function validateAnalysis(data) {
  if (!data || typeof data !== "object")
    return { ok: false, error: "Not an object" };

  const mood = typeof data.mood === "string" ? data.mood.trim() : "";
  const symbolism =
    typeof data.symbolism === "string" ? data.symbolism.trim() : "";
  const dominantThemes = normalizeStringArray(data.dominantThemes);
  const exhibitionTags = normalizeStringArray(data.exhibitionTags);

  if (!mood || !symbolism || dominantThemes.length === 0) {
    return { ok: false, error: "Missing required keys" };
  }

  return {
    ok: true,
    value: {
      mood,
      symbolism,
      dominantThemes,
      exhibitionTags,
    },
  };
}

/**
 * Analyzes an artwork's metadata using Gemini and stores results in MongoDB.
 * AI output contract (STRICT JSON):
 * {
 *   mood,
 *   symbolism,
 *   dominantThemes,
 *   exhibitionTags
 * }
 */
export async function analyzeAndStoreArtwork({
  artworkId,
  title,
  description,
  tags,
  colors,
  style,
}) {
  const prompt = `You are an expert art critic and curator.

Return ONLY valid JSON (no markdown, no backticks, no commentary).

Schema:
{
  "mood": string,
  "symbolism": string,
  "dominantThemes": string[],
  "exhibitionTags": string[]
}

Rules:
- dominantThemes: 3-6 items
- exhibitionTags: 3-8 items
- Use concise, explainable language.

Artwork metadata:
Title: ${JSON.stringify(title || "")}
Description: ${JSON.stringify(description || "")}
Tags: ${JSON.stringify(tags || [])}
Colors: ${JSON.stringify(colors || [])}
Style: ${JSON.stringify(style || "")}
`;

  const ai = await generateContentWithFallback(prompt);
  if (!ai.ok) {
    // If AI is rate-limited / quota-limited, do not throw noisy errors.
    const isQuota = ai.kind === "quota" || ai.error?.status === 429;
    if (isQuota) {
      await Artwork.findByIdAndUpdate(
        artworkId,
        {
          $set: {
            aiAnalysis: {
              mood: "unavailable",
              symbolism:
                "AI analysis is temporarily unavailable (Gemini quota exceeded).",
              themes: [],
            },
          },
        },
        { new: false }
      );

      return {
        ok: false,
        error: "AI quota exceeded",
        retryAfterSeconds: ai.retryAfterSeconds,
      };
    }

    throw ai.error;
  }
  const rawText = ai.text;

  const parsed = parseStrictJson(rawText);
  if (!parsed.ok) {
    // Safe fallback that still keeps the human-in-the-loop workflow moving.
    await Artwork.findByIdAndUpdate(
      artworkId,
      {
        $set: {
          aiAnalysis: {
            mood: "unknown",
            symbolism: "AI response could not be parsed reliably.",
            themes: [],
          },
        },
      },
      { new: false }
    );
    return { ok: false, error: parsed.error };
  }

  const validated = validateAnalysis(parsed.data);
  if (!validated.ok) {
    await Artwork.findByIdAndUpdate(
      artworkId,
      {
        $set: {
          aiAnalysis: {
            mood: "unknown",
            symbolism: "AI returned incomplete structured output.",
            themes: [],
          },
        },
      },
      { new: false }
    );
    return { ok: false, error: validated.error };
  }

  // Map AI contract to prompt-required schema fields.
  await Artwork.findByIdAndUpdate(
    artworkId,
    {
      $set: {
        aiAnalysis: {
          mood: validated.value.mood,
          symbolism: validated.value.symbolism,
          themes: validated.value.dominantThemes,
        },
        tags: Array.from(
          new Set([...(tags || []), ...validated.value.exhibitionTags])
        ).slice(0, 30),
      },
    },
    { new: false }
  );

  return { ok: true, value: validated.value };
}
