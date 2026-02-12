/**
 * Attempts to parse strict JSON returned by an LLM.
 * - Strips common Markdown fences
 * - Extracts the first JSON object/array if the model included extra text
 */
export function parseStrictJson(text) {
  if (!text || typeof text !== "string") {
    return { ok: false, error: "Empty AI response" };
  }

  const cleaned = text
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();

  // If the model returned extra prose, try to extract the first JSON block.
  const firstBrace = cleaned.indexOf("{");
  const firstBracket = cleaned.indexOf("[");
  const start =
    firstBrace === -1
      ? firstBracket
      : firstBracket === -1
      ? firstBrace
      : Math.min(firstBrace, firstBracket);

  if (start === -1) {
    return { ok: false, error: "No JSON found in AI response" };
  }

  const candidate = cleaned.slice(start);

  try {
    const data = JSON.parse(candidate);
    return { ok: true, data };
  } catch {
    // Last resort: try to find a balanced JSON object/array by trimming the end.
    for (let i = candidate.length; i > 0; i -= 1) {
      const slice = candidate.slice(0, i);
      try {
        const data = JSON.parse(slice);
        return { ok: true, data };
      } catch {
        // keep trimming
      }
    }

    return { ok: false, error: "Malformed JSON" };
  }
}
