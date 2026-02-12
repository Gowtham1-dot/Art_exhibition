import { geminiModel } from "../config/aiClient.js";

export const generateExhibitionTheme = async (artworks) => {
  const prompt = `
You are an expert AI art curator.

Based on the following artworks, generate:
1. A compelling exhibition title
2. A short curatorial description (2–3 sentences)
3. 3 relevant thematic tags

Artworks:
${artworks
  .map(
    (a, i) =>
      `${i + 1}. Title: ${a.title}
   Description: ${a.description}
   Artist: ${a.artistName}`
  )
  .join("\n\n")}
`;

  const result = await geminiModel.generateContent(prompt);
  const response = result.response.text();

  return response;
};
