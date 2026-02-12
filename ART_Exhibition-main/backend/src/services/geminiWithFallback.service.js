import { GEMINI_MODEL_FALLBACKS, getGeminiModel } from "../config/aiClient.js";

function isAuthOrConfigError(error) {
  const msg = String(error?.message || "");
  return (
    error?.status === 401 ||
    error?.status === 403 ||
    msg.toLowerCase().includes("api key") ||
    msg.toLowerCase().includes("permission") ||
    msg.toLowerCase().includes("not configured")
  );
}

function isModelNotFoundError(error) {
  const msg = String(error?.message || "");
  return (
    error?.status === 404 ||
    msg.includes("is not found") ||
    msg.includes("not supported") ||
    msg.includes("Call ListModels")
  );
}

function getRetryAfterSeconds(error) {
  const details = error?.errorDetails;
  const retryInfo = Array.isArray(details)
    ? details.find((d) => d?.["@type"]?.includes("RetryInfo"))
    : null;
  const delay = String(retryInfo?.retryDelay || "");
  const match = delay.match(/(\d+)s/);
  return match ? Number(match[1]) : undefined;
}

function isQuotaError(error) {
  const msg = String(error?.message || "");
  return (
    error?.status === 429 ||
    msg.includes("quota") ||
    msg.includes("Too Many Requests")
  );
}

/**
 * Calls Gemini generateContent with model fallbacks.
 * Returns { ok: true, text } or { ok: false, error }.
 */
export async function generateContentWithFallback(prompt, { models } = {}) {
  const candidates =
    Array.isArray(models) && models.length ? models : GEMINI_MODEL_FALLBACKS;

  let lastError;
  let lastQuotaError;
  let lastRetryAfterSeconds;
  for (const modelName of candidates) {
    try {
      const model = getGeminiModel(modelName);
      const result = await model.generateContent(prompt);
      const text = result?.response?.text?.() || "";
      return { ok: true, text, model: modelName };
    } catch (error) {
      lastError = error;

      // Missing/invalid API key or permissions won't be fixed by trying other models.
      if (isAuthOrConfigError(error)) {
        return { ok: false, error, kind: "auth" };
      }

      // Quota/429 means all models will fail; do not continue fallbacks.
      if (isQuotaError(error)) {
        // Quotas can be model-specific, so keep trying fallbacks.
        lastQuotaError = error;
        const retryAfterSeconds = getRetryAfterSeconds(error);
        if (typeof retryAfterSeconds === "number") {
          lastRetryAfterSeconds = retryAfterSeconds;
        }
        continue;
      }

      if (!isModelNotFoundError(error)) {
        break;
      }
    }
  }

  if (lastQuotaError) {
    return {
      ok: false,
      error: lastQuotaError,
      kind: "quota",
      retryAfterSeconds: lastRetryAfterSeconds,
    };
  }

  return { ok: false, error: lastError, kind: "other" };
}
