import { generateCoverImagePrompt } from "@narekshabandari/haylog-blog-prompts/dist/generateImage";

export const generateCoverImage = async (
  title: string,
  width = 1200,
  height = 630,
): Promise<string> => {
  const prompt = await generateCoverImagePrompt(title);
  const encoded = encodeURIComponent(prompt);
  const url = `https://image.pollinations.ai/prompt/${encoded}?width=${width}&height=${height}&nologo=true`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `Image generation failed: ${response.status} ${response.statusText}`,
    );
  }

  return url;
};
