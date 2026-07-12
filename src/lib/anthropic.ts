import Anthropic from "@anthropic-ai/sdk";
import {
  buildPostPrompt,
  PostPromptInput,
} from "@narekshabandari/haylog-blog-prompts/dist/buildPostPrompt";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface GeneratedPost {
  title: string;
  metaDescription: string;
  slug: string;
  content: string;
  tags: string[];
}

export const generatePost = async (
  input: PostPromptInput,
): Promise<GeneratedPost> => {
  const prompt = buildPostPrompt(input);

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const raw = response.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("");

  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  try {
    const parsed: GeneratedPost = JSON.parse(cleaned);
    return parsed;
  } catch {
    throw new Error(`Failed to parse AI response as JSON: ${cleaned}`);
  }
};
