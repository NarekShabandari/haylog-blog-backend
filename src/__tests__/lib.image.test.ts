import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock: external prompt generator ──────────────────────────────────────────
vi.mock("@narekshabandari/haylog-blog-prompts/dist/generateImage", () => ({
  generateCoverImagePrompt: vi.fn(),
}));

import { generateCoverImage } from "../lib/image.js";
import * as generateImageModule from "@narekshabandari/haylog-blog-prompts/dist/generateImage";

const mockGenerateCoverImagePrompt = vi.mocked(
  generateImageModule.generateCoverImagePrompt,
);

beforeEach(() => {
  vi.clearAllMocks();
});

// ─────────────────────────────────────────────────────────────────────────────
describe("generateCoverImage", () => {
  // ── Happy path ──────────────────────────────────────────────────────────────

  describe("when everything succeeds", () => {
    it("returns a Pollinations URL string", async () => {
      mockGenerateCoverImagePrompt.mockResolvedValue("a nice AI art prompt");

      const result = await generateCoverImage("My Blog Post");

      expect(typeof result).toBe("string");
      expect(result).toMatch(/^https:\/\/image\.pollinations\.ai\/prompt\//);
    });

    it("passes the post title to generateCoverImagePrompt", async () => {
      mockGenerateCoverImagePrompt.mockResolvedValue("a nice AI art prompt");

      await generateCoverImage("Deep Learning Explained");

      expect(mockGenerateCoverImagePrompt).toHaveBeenCalledOnce();
      expect(mockGenerateCoverImagePrompt).toHaveBeenCalledWith(
        "Deep Learning Explained",
      );
    });

    it("URL-encodes the prompt returned by generateCoverImagePrompt", async () => {
      const rawPrompt = "a prompt with spaces & special chars!";
      mockGenerateCoverImagePrompt.mockResolvedValue(rawPrompt);

      const result = await generateCoverImage("Special Chars");

      expect(result).toContain(encodeURIComponent(rawPrompt));
    });

    it("includes width=1200 in the query string", async () => {
      mockGenerateCoverImagePrompt.mockResolvedValue("some prompt");

      const result = await generateCoverImage("Width Check");

      expect(result).toContain("width=1200");
    });

    it("includes height=630 in the query string", async () => {
      mockGenerateCoverImagePrompt.mockResolvedValue("some prompt");

      const result = await generateCoverImage("Height Check");

      expect(result).toContain("height=630");
    });

    it("includes nologo=true in the query string", async () => {
      mockGenerateCoverImagePrompt.mockResolvedValue("some prompt");

      const result = await generateCoverImage("No Logo Check");

      expect(result).toContain("nologo=true");
    });

    it("includes a numeric seed in the query string", async () => {
      mockGenerateCoverImagePrompt.mockResolvedValue("some prompt");

      const result = await generateCoverImage("Seed Check");

      expect(result).toMatch(/seed=\d+/);
    });

    it("calls generateCoverImagePrompt exactly once per invocation", async () => {
      mockGenerateCoverImagePrompt.mockResolvedValue("prompt");

      await generateCoverImage("Once Only");

      expect(mockGenerateCoverImagePrompt).toHaveBeenCalledOnce();
    });

    it("does not make any network requests (no fetch calls)", async () => {
      const fetchSpy = vi.spyOn(global, "fetch");
      mockGenerateCoverImagePrompt.mockResolvedValue("some prompt");

      await generateCoverImage("No Network");

      expect(fetchSpy).not.toHaveBeenCalled();
      fetchSpy.mockRestore();
    });

    it("returns different URLs on successive calls due to seed", async () => {
      mockGenerateCoverImagePrompt.mockResolvedValue("same prompt");

      // Advance time between calls so Date.now() differs
      const dateSpy = vi
        .spyOn(Date, "now")
        .mockReturnValueOnce(1000)
        .mockReturnValueOnce(2000);

      const url1 = await generateCoverImage("Title A");
      const url2 = await generateCoverImage("Title A");

      expect(url1).not.toBe(url2);
      dateSpy.mockRestore();
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
