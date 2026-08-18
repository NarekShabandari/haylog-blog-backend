import { generateCoverImagePrompt } from "@narekshabandari/haylog-blog-prompts/dist/generateImage.js";

export const generateCoverImage = async (title: string): Promise<string> => {
  const prompt = await generateCoverImagePrompt(title);

  const encodedPrompt = encodeURIComponent(prompt);

  const seed = Math.floor(Math.random() * 2147483647);

  const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1200&height=630&nologo=true&seed=${seed}`;

  return imageUrl;
};
