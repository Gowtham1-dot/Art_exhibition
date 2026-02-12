import { generateAISuggestions } from "../services/aiExhibitionGenerator.service.js";

export const createAIExhibition = async (req, res) => {
  try {
    const generated = await generateAISuggestions();
    if (!generated.ok) {
      const status = generated.error === "AI quota exceeded" ? 503 : 400;
      return res.status(status).json({
        message: generated.error,
        retryAfterSeconds: generated.retryAfterSeconds,
      });
    }

    return res.status(201).json(generated.value);
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Failed to generate AI suggestions" });
  }
};
