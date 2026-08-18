import { generateCoverImagePrompt } from "@narekshabandari/haylog-blog-prompts/dist/generateImage.js";

export const generateCoverImage = async (title: string): Promise<string> => {
  const prompt = await generateCoverImagePrompt(title);

  const encodedPrompt = encodeURIComponent(prompt);

  const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1200&height=630&nologo=true&seed=${Date.now()}`;

  return imageUrl;
};
