import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Hoisted mocks (must be declared before vi.mock factories) ─────────────────
const { mockTextToImage, mockUpload, mockGenerateCoverImagePrompt } =
  vi.hoisted(() => ({
    mockTextToImage: vi.fn(),
    mockUpload: vi.fn(),
    mockGenerateCoverImagePrompt: vi.fn(),
  }));

// ── Mock: external prompt generator ──────────────────────────────────────────
vi.mock("@narekshabandari/haylog-blog-prompts/dist/generateImage", () => ({
  generateCoverImagePrompt: mockGenerateCoverImagePrompt,
}));

// ── Mock: HuggingFace inference ───────────────────────────────────────────────
vi.mock("@huggingface/inference", () => ({
  HfInference: function () {
    return { textToImage: mockTextToImage };
  },
}));

// ── Mock: Cloudinary ──────────────────────────────────────────────────────────
vi.mock("../config/cloudinary", () => ({
  default: {
    uploader: {
      upload: mockUpload,
    },
  },
}));

import { generateCoverImage } from "../lib/image.js";

// A minimal Blob-like object whose arrayBuffer() returns an empty buffer
const makeFakeBlob = () => ({
  arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(0)),
});

const FAKE_SECURE_URL =
  "https://res.cloudinary.com/demo/image/upload/blog-covers/test.jpg";

beforeEach(() => {
  vi.clearAllMocks();
  // Default happy-path stubs
  mockTextToImage.mockResolvedValue(makeFakeBlob());
  mockUpload.mockResolvedValue({ secure_url: FAKE_SECURE_URL });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("generateCoverImage", () => {
  // ── Happy path ──────────────────────────────────────────────────────────────

  describe("when everything succeeds", () => {
    it("returns the Cloudinary secure_url", async () => {
      mockGenerateCoverImagePrompt.mockResolvedValue("a nice AI art prompt");

      const result = await generateCoverImage("My Blog Post");

      expect(typeof result).toBe("string");
      expect(result).toBe(FAKE_SECURE_URL);
    });

    it("passes the post title to generateCoverImagePrompt", async () => {
      mockGenerateCoverImagePrompt.mockResolvedValue("a nice AI art prompt");

      await generateCoverImage("Deep Learning Explained");

      expect(mockGenerateCoverImagePrompt).toHaveBeenCalledOnce();
      expect(mockGenerateCoverImagePrompt).toHaveBeenCalledWith(
        "Deep Learning Explained",
      );
    });

    it("passes the prompt returned by generateCoverImagePrompt to textToImage", async () => {
      mockGenerateCoverImagePrompt.mockResolvedValue("a custom art prompt");

      await generateCoverImage("Some Title");

      expect(mockTextToImage).toHaveBeenCalledOnce();
      expect(mockTextToImage).toHaveBeenCalledWith(
        expect.objectContaining({ inputs: "a custom art prompt" }),
      );
    });

    it("uses the correct Stable Diffusion model", async () => {
      mockGenerateCoverImagePrompt.mockResolvedValue("some prompt");

      await generateCoverImage("Model Check");

      expect(mockTextToImage).toHaveBeenCalledWith(
        expect.objectContaining({
          model: "stabilityai/stable-diffusion-xl-base-1.0",
        }),
      );
    });

    it("uploads to Cloudinary with width=1200 and height=630", async () => {
      mockGenerateCoverImagePrompt.mockResolvedValue("some prompt");

      await generateCoverImage("Dimension Check");

      expect(mockUpload).toHaveBeenCalledOnce();
      expect(mockUpload).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          transformation: expect.arrayContaining([
            expect.objectContaining({ width: 1200, height: 630 }),
          ]),
        }),
      );
    });

    it("uploads to the blog-covers folder in Cloudinary", async () => {
      mockGenerateCoverImagePrompt.mockResolvedValue("some prompt");

      await generateCoverImage("Folder Check");

      expect(mockUpload).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ folder: "blog-covers" }),
      );
    });

    it("uploads a base64 data URI to Cloudinary", async () => {
      mockGenerateCoverImagePrompt.mockResolvedValue("some prompt");

      await generateCoverImage("Base64 Check");

      const [uploadArg] = mockUpload.mock.calls[0];
      expect(uploadArg).toMatch(/^data:image\/png;base64,/);
    });

    it("calls generateCoverImagePrompt exactly once per invocation", async () => {
      mockGenerateCoverImagePrompt.mockResolvedValue("prompt");

      await generateCoverImage("Once Only");

      expect(mockGenerateCoverImagePrompt).toHaveBeenCalledOnce();
    });

    it("calls textToImage exactly once per invocation", async () => {
      mockGenerateCoverImagePrompt.mockResolvedValue("prompt");

      await generateCoverImage("HF Once Only");

      expect(mockTextToImage).toHaveBeenCalledOnce();
    });

    it("calls cloudinary upload exactly once per invocation", async () => {
      mockGenerateCoverImagePrompt.mockResolvedValue("prompt");

      await generateCoverImage("Cloudinary Once Only");

      expect(mockUpload).toHaveBeenCalledOnce();
    });
  });

  // ── Prompt generation failure ───────────────────────────────────────────────

  describe("when generateCoverImagePrompt rejects", () => {
    it("propagates the error without returning a URL", async () => {
      mockGenerateCoverImagePrompt.mockRejectedValue(
        new Error("Prompt generation failed"),
      );

      await expect(generateCoverImage("Broken Title")).rejects.toThrow(
        "Prompt generation failed",
      );
    });

    it("does not return any value when prompt generation fails", async () => {
      mockGenerateCoverImagePrompt.mockRejectedValue(new Error("LLM error"));

      const result = generateCoverImage("Error Title");

      await expect(result).rejects.toThrow();
    });
  });
});
