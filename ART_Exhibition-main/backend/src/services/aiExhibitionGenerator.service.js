import Artwork from "../models/Artwork.js";
import AISuggestion from "../models/AISuggestion.js";
import { parseStrictJson } from "../utils/parseStrictJson.js";
import { generateContentWithFallback } from "./geminiWithFallback.service.js";

function normalizeScore(value) {
  const n = typeof value === "number" ? value : Number(value);
  if (Number.isFinite(n)) return Math.max(0, Math.min(1, n));
  return 0.5;
}

function normalizeIdArray(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((v) => (typeof v === "string" ? v.trim() : ""))
    .filter(Boolean);
}

function validateSuggestion(s, allowedIds) {
  if (!s || typeof s !== "object")
    return { ok: false, error: "Suggestion not an object" };
  const themeTitle =
    typeof s.themeTitle === "string" ? s.themeTitle.trim() : "";
  const curatorialStatement =
    typeof s.curatorialStatement === "string"
      ? s.curatorialStatement.trim()
      : "";
  const reasoning = typeof s.reasoning === "string" ? s.reasoning.trim() : "";
  const confidenceScore = normalizeScore(s.confidenceScore);
  const artworkIds = normalizeIdArray(s.artworkIds).filter((id) =>
    allowedIds.has(id)
  );

  if (!themeTitle || !curatorialStatement || !reasoning) {
    return { ok: false, error: "Missing required text fields" };
  }
  if (artworkIds.length < 2) {
    return { ok: false, error: "Too few artworkIds" };
  }

  return {
    ok: true,
    value: {
      themeTitle,
      curatorialStatement,
      reasoning,
      confidenceScore,
      artworkIds,
    },
  };
}

function splitIntoBuckets(items, bucketCount) {
  const buckets = Array.from({ length: bucketCount }, () => []);
  for (let i = 0; i < items.length; i += 1) {
    buckets[i % bucketCount].push(items[i]);
  }
  return buckets;
}

function guessThemeForBucket(bucket) {
  const styles = bucket
    .map((a) => (typeof a.style === "string" ? a.style.trim() : ""))
    .filter(Boolean);
  const mediums = bucket
    .map((a) => (typeof a.medium === "string" ? a.medium.trim() : ""))
    .filter(Boolean);
  const tags = bucket
    .flatMap((a) => (Array.isArray(a.tags) ? a.tags : []))
    .map((t) => (typeof t === "string" ? t.trim() : ""))
    .filter(Boolean);

  const pick = (arr) => arr.sort((a, b) => b.count - a.count)[0]?.value;
  const countBy = (arr) => {
    const map = new Map();
    for (const v of arr) map.set(v, (map.get(v) || 0) + 1);
    return Array.from(map.entries()).map(([value, count]) => ({
      value,
      count,
    }));
  };

  const topStyle = pick(countBy(styles));
  const topMedium = pick(countBy(mediums));
  const topTag = pick(countBy(tags));

  const pieces = [topStyle, topMedium, topTag].filter(Boolean);
  if (pieces.length === 0) return "Curated Selection";
  return pieces.slice(0, 2).join(" · ");
}

async function generateHeuristicSuggestions(artworks) {
  const targetCount = artworks.length >= 10 ? 3 : 2;
  const sorted = [...artworks].sort((a, b) =>
    String(a._id).localeCompare(String(b._id))
  );
  const buckets = splitIntoBuckets(sorted, targetCount);

  const suggestions = buckets.map((bucket, idx) => {
    const themeTitle = `Fallback Exhibition ${idx + 1}: ${guessThemeForBucket(
      bucket
    )}`;
    const curatorialStatement =
      "AI generation is currently unavailable (quota exceeded). This is a temporary, heuristic grouping based on available metadata.";
    const reasoning =
      "This grouping was generated without AI due to quota limits. It clusters artworks evenly and labels the theme using the most common style/medium/tags found in the group.";
    const confidenceScore = 0.2;
    const artworkIds = bucket.map((a) => String(a._id));
    return {
      themeTitle,
      curatorialStatement,
      reasoning,
      confidenceScore,
      artworkIds,
    };
  });

  const created = await AISuggestion.insertMany(
    suggestions.map((s) => ({ ...s, approved: false, rejected: false }))
  );

  return { ok: true, value: created };
}

/**
 * Fetches approved artworks and asks the AI to group them into 2-3 exhibitions.
 * Saves results as AISuggestion documents (human-in-the-loop).
 */
export async function generateAISuggestions() {
  const artworks = await Artwork.find({
    status: "approved",
    isDeleted: { $ne: true },
  }).lean();
  if (artworks.length < 2) {
    return {
      ok: false,
      error: "Not enough approved artworks to generate exhibitions",
    };
  }

  const targetCount = artworks.length >= 10 ? 3 : 2;
  const allowedIds = new Set(artworks.map((a) => String(a._id)));

  const prompt = `You are an AI curator creating thematic exhibitions.

Return ONLY valid JSON (no markdown, no backticks, no prose).

Goal:
- Group artworks into ${targetCount} exhibitions.
- Each exhibition must include a coherent theme and explain WHY the artworks belong together.

Output JSON schema:
[
  {
    "themeTitle": string,
    "curatorialStatement": string,
    "reasoning": string,
    "confidenceScore": number,  // 0..1
    "artworkIds": string[]
  }
]

Rules:
- Create exactly ${targetCount} items.
- confidenceScore must be between 0 and 1.
- artworkIds must be chosen only from the provided list.
- Each artworkId should appear in at most one exhibition.
- Use explainable, curator-like language in reasoning.

Artworks (id + metadata):
${artworks
  .map((a) => {
    const themes = a?.aiAnalysis?.themes || [];
    return `- id: ${a._id}
  title: ${a.title}
  artistName: ${a.artistName}
  style: ${a.style || ""}
  medium: ${a.medium || ""}
  tags: ${(a.tags || []).slice(0, 10).join(", ")}
  colors: ${(a.colors || []).slice(0, 10).join(", ")}
  aiThemes: ${Array.isArray(themes) ? themes.slice(0, 8).join(", ") : ""}`;
  })
  .join("\n\n")}
`;

  const ai = await generateContentWithFallback(prompt);
  if (!ai.ok) {
    if (ai.kind === "quota" || ai.error?.status === 429) {
      const allowHeuristicFallback =
        String(process.env.AI_FALLBACK_MODE || "").toLowerCase() ===
        "heuristic";
      if (allowHeuristicFallback) {
        return generateHeuristicSuggestions(artworks);
      }

      return {
        ok: false,
        error: "AI quota exceeded",
        retryAfterSeconds: ai.retryAfterSeconds,
      };
    }

    if (ai.kind === "auth") {
      return { ok: false, error: "AI authentication/config failed" };
    }

    return { ok: false, error: "AI request failed" };
  }
  const rawText = ai.text;

  const parsed = parseStrictJson(rawText);
  if (!parsed.ok || !Array.isArray(parsed.data)) {
    return { ok: false, error: "AI returned invalid JSON" };
  }

  const used = new Set();
  const validatedSuggestions = [];

  for (const s of parsed.data) {
    const validated = validateSuggestion(s, allowedIds);
    if (!validated.ok) {
      return { ok: false, error: validated.error };
    }

    // Enforce uniqueness of artworks across suggestions.
    for (const id of validated.value.artworkIds) {
      if (used.has(id)) {
        return { ok: false, error: "Artwork appears in multiple exhibitions" };
      }
    }
    validated.value.artworkIds.forEach((id) => used.add(id));

    validatedSuggestions.push(validated.value);
  }

  // Save suggestions (do not auto-approve).
  const created = await AISuggestion.insertMany(
    validatedSuggestions.map((s) => ({
      ...s,
      approved: false,
      rejected: false,
    }))
  );

  return { ok: true, value: created };
}
