import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ── Mock: external prompt generator ──────────────────────────────────────────
// Isolates image.ts from the blogPrompts package entirely so this test suite
// only exercises the Stability AI → Cloudinary pipeline.
vi.mock("@narekshabandari/haylog-blog-prompts/dist/generateImage", () => ({
  generateCoverImagePrompt: vi.fn(),
}));

// ── Mock: Cloudinary config module ────────────────────────────────────────────
// The config/cloudinary.ts module throws at import time when env vars are
// missing.  We replace the whole module with a pre-configured spy object so
// tests never need real credentials and never hit the network.
vi.mock("../config/cloudinary.js", () => ({
  default: {
    uploader: {
      upload: vi.fn(),
    },
  },
}));

import { generateCoverImage } from "../lib/image.js";
import * as generateImageModule from "@narekshabandari/haylog-blog-prompts/dist/generateImage";
import cloudinary from "../config/cloudinary.js";

const mockGenerateCoverImagePrompt = vi.mocked(
  generateImageModule.generateCoverImagePrompt,
);
const mockCloudinaryUpload = vi.mocked(cloudinary.uploader.upload);

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Builds a minimal Response-like object that mimics the global fetch response.
 * The `arrayBuffer` method returns a buffer of N zero-bytes, which is enough
 * for image.ts to construct a base64 string without decoding anything real.
 */
function buildStabilityResponse(
  ok: boolean,
  status = 200,
  statusText = "OK",
  bodyBytes = 4,
): Response {
  return {
    ok,
    status,
    statusText,
    arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(bodyBytes)),
    json: vi.fn().mockResolvedValue({ message: "error from stability" }),
  } as unknown as Response;
}

/** Minimal Cloudinary upload result containing only the field image.ts uses. */
const FAKE_SECURE_URL = "https://res.cloudinary.com/demo/image/upload/blog-covers/abc123.webp";

function buildCloudinaryResult(secureUrl = FAKE_SECURE_URL) {
  return { secure_url: secureUrl } as unknown as Awaited<
    ReturnType<typeof cloudinary.uploader.upload>
  >;
}

// ── Setup / Teardown ──────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  // Stub global fetch — no real HTTP requests are ever made.
  vi.stubGlobal("fetch", vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// ─────────────────────────────────────────────────────────────────────────────
describe("generateCoverImage", () => {
  // ── Happy path ──────────────────────────────────────────────────────────────

  describe("when everything succeeds", () => {
    it("returns the Cloudinary secure_url", async () => {
      mockGenerateCoverImagePrompt.mockResolvedValue("a nice prompt");
      vi.mocked(fetch).mockResolvedValue(buildStabilityResponse(true));
      mockCloudinaryUpload.mockResolvedValue(buildCloudinaryResult());

      const result = await generateCoverImage("My Blog Post");

      expect(result).toBe(FAKE_SECURE_URL);
    });

    it("passes the post title to generateCoverImagePrompt", async () => {
      mockGenerateCoverImagePrompt.mockResolvedValue("a nice prompt");
      vi.mocked(fetch).mockResolvedValue(buildStabilityResponse(true));
      mockCloudinaryUpload.mockResolvedValue(buildCloudinaryResult());

      await generateCoverImage("Deep Learning Explained");

      expect(mockGenerateCoverImagePrompt).toHaveBeenCalledOnce();
      expect(mockGenerateCoverImagePrompt).toHaveBeenCalledWith(
        "Deep Learning Explained",
      );
    });

    it("calls the Stability AI endpoint exactly once", async () => {
      mockGenerateCoverImagePrompt.mockResolvedValue("a nice prompt");
      vi.mocked(fetch).mockResolvedValue(buildStabilityResponse(true));
      mockCloudinaryUpload.mockResolvedValue(buildCloudinaryResult());

      await generateCoverImage("Once Only");

      expect(fetch).toHaveBeenCalledOnce();
    });

    it("sends the request to the correct Stability AI v2beta endpoint", async () => {
      mockGenerateCoverImagePrompt.mockResolvedValue("a nice prompt");
      vi.mocked(fetch).mockResolvedValue(buildStabilityResponse(true));
      mockCloudinaryUpload.mockResolvedValue(buildCloudinaryResult());

      await generateCoverImage("Endpoint Check");

      const [url] = vi.mocked(fetch).mock.calls[0];
      expect(url).toBe(
        "https://api.stability.ai/v2beta/stable-image/generate/core",
      );
    });

    it("sends a POST request with the Bearer token in the Authorization header", async () => {
      mockGenerateCoverImagePrompt.mockResolvedValue("a nice prompt");
      vi.mocked(fetch).mockResolvedValue(buildStabilityResponse(true));
      mockCloudinaryUpload.mockResolvedValue(buildCloudinaryResult());

      await generateCoverImage("Auth Check");

      const [, options] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
      expect(options.method).toBe("POST");
      expect((options.headers as Record<string, string>)["Authorization"]).toBe(
        "Bearer test-stability-key",
      );
    });

    it("requests image/* in the Accept header so Stability returns raw bytes", async () => {
      mockGenerateCoverImagePrompt.mockResolvedValue("a nice prompt");
      vi.mocked(fetch).mockResolvedValue(buildStabilityResponse(true));
      mockCloudinaryUpload.mockResolvedValue(buildCloudinaryResult());

      await generateCoverImage("Accept Header Check");

      const [, options] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
      expect((options.headers as Record<string, string>)["Accept"]).toBe("image/*");
    });

    it("uploads to Cloudinary under the blog-covers folder", async () => {
      mockGenerateCoverImagePrompt.mockResolvedValue("a nice prompt");
      vi.mocked(fetch).mockResolvedValue(buildStabilityResponse(true));
      mockCloudinaryUpload.mockResolvedValue(buildCloudinaryResult());

      await generateCoverImage("Folder Check");

      const [, options] = mockCloudinaryUpload.mock.calls[0];
      expect(options?.folder).toBe("blog-covers");
    });

    it("uploads a base64-encoded webp data URI to Cloudinary", async () => {
      mockGenerateCoverImagePrompt.mockResolvedValue("a nice prompt");
      vi.mocked(fetch).mockResolvedValue(buildStabilityResponse(true));
      mockCloudinaryUpload.mockResolvedValue(buildCloudinaryResult());

      await generateCoverImage("Base64 Check");

      const [dataUri] = mockCloudinaryUpload.mock.calls[0];
      expect(dataUri).toMatch(/^data:image\/webp;base64,/);
    });

    it("applies the correct Cloudinary transformation (1200x675 fill, auto quality, auto format)", async () => {
      mockGenerateCoverImagePrompt.mockResolvedValue("a nice prompt");
      vi.mocked(fetch).mockResolvedValue(buildStabilityResponse(true));
      mockCloudinaryUpload.mockResolvedValue(buildCloudinaryResult());

      await generateCoverImage("Transformation Check");

      const [, options] = mockCloudinaryUpload.mock.calls[0];
      expect(options?.transformation).toEqual([
        { width: 1200, height: 675, crop: "fill" },
        { quality: "auto" },
        { fetch_format: "auto" },
      ]);
    });

    it("calls Cloudinary upload exactly once per invocation", async () => {
      mockGenerateCoverImagePrompt.mockResolvedValue("a nice prompt");
      vi.mocked(fetch).mockResolvedValue(buildStabilityResponse(true));
      mockCloudinaryUpload.mockResolvedValue(buildCloudinaryResult());

      await generateCoverImage("Upload Count");

      expect(mockCloudinaryUpload).toHaveBeenCalledOnce();
    });
  });

  // ── Stability AI error handling ─────────────────────────────────────────────

  describe("when Stability AI returns a non-ok HTTP response", () => {
    it("throws with the Stability error payload serialised as JSON", async () => {
      mockGenerateCoverImagePrompt.mockResolvedValue("a nice prompt");

      const errorResponse = {
        ok: false,
        status: 400,
        statusText: "Bad Request",
        json: vi.fn().mockResolvedValue({ message: "invalid prompt" }),
        arrayBuffer: vi.fn(),
      } as unknown as Response;
      vi.mocked(fetch).mockResolvedValue(errorResponse);

      await expect(generateCoverImage("Bad Prompt")).rejects.toThrow(
        "Stability AI error:",
      );
    });

    it("includes the serialised error body in the thrown message", async () => {
      mockGenerateCoverImagePrompt.mockResolvedValue("a nice prompt");

      const errorBody = { message: "content policy violation" };
      const errorResponse = {
        ok: false,
        status: 403,
        statusText: "Forbidden",
        json: vi.fn().mockResolvedValue(errorBody),
        arrayBuffer: vi.fn(),
      } as unknown as Response;
      vi.mocked(fetch).mockResolvedValue(errorResponse);

      await expect(generateCoverImage("Policy Violation")).rejects.toThrow(
        JSON.stringify(errorBody),
      );
    });

    it("does NOT call Cloudinary upload when Stability AI fails", async () => {
      mockGenerateCoverImagePrompt.mockResolvedValue("a nice prompt");

      const errorResponse = {
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        json: vi.fn().mockResolvedValue({ error: "crash" }),
        arrayBuffer: vi.fn(),
      } as unknown as Response;
      vi.mocked(fetch).mockResolvedValue(errorResponse);

      await expect(generateCoverImage("Stability Down")).rejects.toThrow();
      expect(mockCloudinaryUpload).not.toHaveBeenCalled();
    });
  });

  // ── Network / upstream failure ──────────────────────────────────────────────

  describe("when the network call itself fails", () => {
    it("propagates a DNS failure from fetch", async () => {
      mockGenerateCoverImagePrompt.mockResolvedValue("a nice prompt");
      vi.mocked(fetch).mockRejectedValue(new Error("fetch failed"));

      await expect(generateCoverImage("Network Down")).rejects.toThrow(
        "fetch failed",
      );
    });

    it("propagates a timeout error from fetch", async () => {
      mockGenerateCoverImagePrompt.mockResolvedValue("a nice prompt");
      vi.mocked(fetch).mockRejectedValue(new Error("The operation timed out"));

      await expect(generateCoverImage("Timeout Title")).rejects.toThrow(
        "The operation timed out",
      );
    });

    it("does NOT call Cloudinary upload when fetch throws", async () => {
      mockGenerateCoverImagePrompt.mockResolvedValue("a nice prompt");
      vi.mocked(fetch).mockRejectedValue(new Error("network unreachable"));

      await expect(generateCoverImage("No Network")).rejects.toThrow();
      expect(mockCloudinaryUpload).not.toHaveBeenCalled();
    });
  });

  // ── Cloudinary failure ──────────────────────────────────────────────────────

  describe("when the Cloudinary upload fails", () => {
    it("propagates the Cloudinary error", async () => {
      mockGenerateCoverImagePrompt.mockResolvedValue("a nice prompt");
      vi.mocked(fetch).mockResolvedValue(buildStabilityResponse(true));
      mockCloudinaryUpload.mockRejectedValue(
        new Error("Cloudinary upload failed: invalid signature"),
      );

      await expect(generateCoverImage("Upload Fails")).rejects.toThrow(
        "Cloudinary upload failed",
      );
    });

    it("still calls Stability AI before the Cloudinary failure", async () => {
      mockGenerateCoverImagePrompt.mockResolvedValue("a nice prompt");
      vi.mocked(fetch).mockResolvedValue(buildStabilityResponse(true));
      mockCloudinaryUpload.mockRejectedValue(new Error("upload error"));

      await expect(generateCoverImage("Order Check")).rejects.toThrow();
      expect(fetch).toHaveBeenCalledOnce();
    });
  });

  // ── Prompt generation failure ───────────────────────────────────────────────

  describe("when generateCoverImagePrompt itself rejects", () => {
    it("propagates the error before fetch is even called", async () => {
      mockGenerateCoverImagePrompt.mockRejectedValue(
        new Error("Prompt generation failed"),
      );

      await expect(generateCoverImage("Broken Title")).rejects.toThrow(
        "Prompt generation failed",
      );
      expect(fetch).not.toHaveBeenCalled();
    });

    it("does NOT call Cloudinary upload when prompt generation fails", async () => {
      mockGenerateCoverImagePrompt.mockRejectedValue(
        new Error("Prompt generation failed"),
      );

      await expect(generateCoverImage("Broken Title")).rejects.toThrow();
      expect(mockCloudinaryUpload).not.toHaveBeenCalled();
    });
  });
});
