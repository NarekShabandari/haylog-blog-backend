import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ── Mock the external prompt generator ────────────────────────────────────────
// We isolate `generateCoverImage` from the blogPrompts package entirely.
// This ensures the test only validates image.ts logic, not the prompt builder.
vi.mock("@narekshabandari/haylog-blog-prompts/dist/generateImage", () => ({
  generateCoverImagePrompt: vi.fn(),
}));

import { generateCoverImage } from "../lib/image.js";
import * as generateImageModule from "@narekshabandari/haylog-blog-prompts/dist/generateImage";

const generateCoverImagePrompt = vi.mocked(generateImageModule.generateCoverImagePrompt);

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Build a minimal Response-like object that fetch returns. */
function buildFetchResponse(ok: boolean, status = 200, statusText = "OK"): Response {
  return {
    ok,
    status,
    statusText,
  } as unknown as Response;
}

// ── Setup / Teardown ──────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  // Stub global fetch so no real HTTP requests are ever made.
  vi.stubGlobal("fetch", vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// ─────────────────────────────────────────────────────────────────────────────
describe("generateCoverImage", () => {
  // ── Happy path ──────────────────────────────────────────────────────────────

  describe("when everything succeeds", () => {
    it("returns the correct pollinations.ai URL for a given title", async () => {
      const prompt = "minimalist tech blog cover for AI article";
      generateCoverImagePrompt.mockResolvedValue(prompt);
      vi.mocked(fetch).mockResolvedValue(buildFetchResponse(true));

      const result = await generateCoverImage("AI and the Future");

      const encoded = encodeURIComponent(prompt);
      expect(result).toBe(
        `https://image.pollinations.ai/prompt/${encoded}?width=1200&height=630&nologo=true`,
      );
    });

    it("uses the default width (1200) and height (630) when no dimensions are provided", async () => {
      const prompt = "some prompt";
      generateCoverImagePrompt.mockResolvedValue(prompt);
      vi.mocked(fetch).mockResolvedValue(buildFetchResponse(true));

      const result = await generateCoverImage("My Title");

      expect(result).toContain("width=1200");
      expect(result).toContain("height=630");
    });

    it("respects custom width and height overrides", async () => {
      const prompt = "some prompt";
      generateCoverImagePrompt.mockResolvedValue(prompt);
      vi.mocked(fetch).mockResolvedValue(buildFetchResponse(true));

      const result = await generateCoverImage("My Title", 800, 400);

      expect(result).toContain("width=800");
      expect(result).toContain("height=400");
    });

    it("always appends nologo=true to suppress the watermark", async () => {
      generateCoverImagePrompt.mockResolvedValue("a prompt");
      vi.mocked(fetch).mockResolvedValue(buildFetchResponse(true));

      const result = await generateCoverImage("No Logo Test");

      expect(result).toContain("nologo=true");
    });

    it("URL-encodes the prompt so special characters are safe in the URL", async () => {
      // A prompt with spaces, commas, and ampersands would break a raw URL.
      const prompt = "dark & moody, high contrast image/photo";
      generateCoverImagePrompt.mockResolvedValue(prompt);
      vi.mocked(fetch).mockResolvedValue(buildFetchResponse(true));

      const result = await generateCoverImage("Some Title");

      expect(result).toContain(encodeURIComponent(prompt));
      // The raw characters must NOT appear un-encoded in the URL path segment.
      expect(result).not.toContain(" ");
      expect(result).not.toContain("&moody"); // '&' before 'moody' would break query parsing
    });

    it("passes the post title to generateCoverImagePrompt", async () => {
      generateCoverImagePrompt.mockResolvedValue("prompt");
      vi.mocked(fetch).mockResolvedValue(buildFetchResponse(true));

      await generateCoverImage("Deep Learning Explained");

      expect(generateCoverImagePrompt).toHaveBeenCalledOnce();
      expect(generateCoverImagePrompt).toHaveBeenCalledWith("Deep Learning Explained");
    });

    it("calls fetch exactly once with the constructed URL", async () => {
      const prompt = "my prompt";
      generateCoverImagePrompt.mockResolvedValue(prompt);
      vi.mocked(fetch).mockResolvedValue(buildFetchResponse(true));

      await generateCoverImage("Once Only");

      expect(fetch).toHaveBeenCalledOnce();
      const calledUrl = vi.mocked(fetch).mock.calls[0][0] as string;
      expect(calledUrl).toContain("https://image.pollinations.ai/prompt/");
    });
  });

  // ── HTTP error handling ─────────────────────────────────────────────────────

  describe("when the image provider returns a non-ok HTTP response", () => {
    it("throws an error that includes the HTTP status code", async () => {
      generateCoverImagePrompt.mockResolvedValue("prompt");
      vi.mocked(fetch).mockResolvedValue(buildFetchResponse(false, 503, "Service Unavailable"));

      await expect(generateCoverImage("Bad Gateway Title")).rejects.toThrow("503");
    });

    it("throws an error that includes the HTTP status text", async () => {
      generateCoverImagePrompt.mockResolvedValue("prompt");
      vi.mocked(fetch).mockResolvedValue(buildFetchResponse(false, 503, "Service Unavailable"));

      await expect(generateCoverImage("Bad Gateway Title")).rejects.toThrow(
        "Service Unavailable",
      );
    });

    it("throws with the expected error message prefix", async () => {
      generateCoverImagePrompt.mockResolvedValue("prompt");
      vi.mocked(fetch).mockResolvedValue(buildFetchResponse(false, 429, "Too Many Requests"));

      await expect(generateCoverImage("Rate Limited Title")).rejects.toThrow(
        "Image generation failed",
      );
    });

    it("throws for a 404 Not Found response", async () => {
      generateCoverImagePrompt.mockResolvedValue("prompt");
      vi.mocked(fetch).mockResolvedValue(buildFetchResponse(false, 404, "Not Found"));

      await expect(generateCoverImage("Missing Endpoint")).rejects.toThrow(
        "Image generation failed: 404 Not Found",
      );
    });

    it("throws for a 500 Internal Server Error response", async () => {
      generateCoverImagePrompt.mockResolvedValue("prompt");
      vi.mocked(fetch).mockResolvedValue(buildFetchResponse(false, 500, "Internal Server Error"));

      await expect(generateCoverImage("Server Error Title")).rejects.toThrow(
        "Image generation failed: 500 Internal Server Error",
      );
    });
  });

  // ── Network / upstream failure ──────────────────────────────────────────────

  describe("when the network call itself fails", () => {
    it("propagates the fetch rejection (e.g. DNS failure)", async () => {
      generateCoverImagePrompt.mockResolvedValue("prompt");
      vi.mocked(fetch).mockRejectedValue(new Error("fetch failed"));

      await expect(generateCoverImage("Network Down")).rejects.toThrow("fetch failed");
    });

    it("propagates a timeout error from fetch", async () => {
      generateCoverImagePrompt.mockResolvedValue("prompt");
      vi.mocked(fetch).mockRejectedValue(new Error("The operation timed out"));

      await expect(generateCoverImage("Timeout Title")).rejects.toThrow(
        "The operation timed out",
      );
    });
  });

  // ── Prompt generation failure ───────────────────────────────────────────────

  describe("when generateCoverImagePrompt itself rejects", () => {
    it("propagates the error before fetch is even called", async () => {
      generateCoverImagePrompt.mockRejectedValue(new Error("Prompt generation failed"));

      await expect(generateCoverImage("Broken Title")).rejects.toThrow(
        "Prompt generation failed",
      );
      expect(fetch).not.toHaveBeenCalled();
    });
  });
});
