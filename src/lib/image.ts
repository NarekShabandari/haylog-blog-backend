import { HfInference } from "@huggingface/inference";
import cloudinary from "../config/cloudinary.js";
import { generateCoverImagePrompt } from "@narekshabandari/haylog-blog-prompts/dist/generateImage.js";

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

export const generateCoverImage = async (title: string): Promise<string> => {
  const prompt = await generateCoverImagePrompt(title);

  const blob = await hf.textToImage({
    model: "stabilityai/stable-diffusion-xl-base-1.0",
    inputs: prompt,
  });

  // convert to buffer and upload to Cloudinary
  // @ts-ignore
  const buffer = Buffer.from(await blob.arrayBuffer());
  const base64 = `data:image/png;base64,${buffer.toString("base64")}`;

  const uploaded = await cloudinary.uploader.upload(base64, {
    folder: "blog-covers",
    transformation: [
      { width: 1200, height: 630, crop: "fill" },
      { quality: "auto" },
    ],
  });

  return uploaded.secure_url;
};
