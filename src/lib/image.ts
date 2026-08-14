import { generateCoverImagePrompt } from "@narekshabandari/haylog-blog-prompts/dist/generateImage.js";
import cloudinary from "../config/cloudinary.js";

const STABILITY_API_KEY = process.env.STABILITY_API_KEY;
if (!STABILITY_API_KEY) throw new Error("STABILITY_API_KEY is not defined");

export const generateCoverImage = async (title: string): Promise<string> => {
  const prompt = await generateCoverImagePrompt(title);

  const stabilityResponse = await fetch(
    "https://api.stability.ai/v2beta/stable-image/generate/core",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${STABILITY_API_KEY}`,
        Accept: "image/*",
      },
      body: (() => {
        const form = new FormData();
        form.append("prompt", prompt);
        form.append("output_format", "webp");
        form.append("aspect_ratio", "16:9");
        return form;
      })(),
    },
  );

  if (!stabilityResponse.ok) {
    const error = await stabilityResponse.json();
    throw new Error(`Stability AI error: ${JSON.stringify(error)}`);
  }

  const buffer = Buffer.from(await stabilityResponse.arrayBuffer());
  const base64Image = `data:image/webp;base64,${buffer.toString("base64")}`;

  const uploadResponse = await cloudinary.uploader.upload(base64Image, {
    folder: "blog-covers",
    transformation: [
      { width: 1200, height: 675, crop: "fill" },
      { quality: "auto" },
      { fetch_format: "auto" },
    ],
  });

  return uploadResponse.secure_url;
};
