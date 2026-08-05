import { vi } from "vitest";
import type { User, Post } from "../types/index.js";

// ─── Shared mock data ────────────────────────────────────────────────────────

export const mockUser: User = {
  id: "b2c3d4e5-f6a7-4890-bcde-f12345678901",
  email: "test@example.com",
  username: "testuser",
  created_at: new Date("2024-01-01T00:00:00Z"),
};

export const mockUserWithPassword = {
  ...mockUser,
  password: "$2a$12$hashedpassword",
};

export const mockPost: Post = {
  id: "a1b2c3d4-e5f6-4789-abcd-ef1234567890",
  author_id: "b2c3d4e5-f6a7-4890-bcde-f12345678901",
  title: "Test Post",
  title_hy: null,
  slug: "test-post",
  content: "Test content body",
  content_hy: null,
  meta_description: null,
  meta_description_hy: null,
  published: true,
  tags: ["test"],
  created_at: new Date("2024-01-01T00:00:00Z"),
  updated_at: new Date("2024-01-01T00:00:00Z"),
  author: "testuser",
};

// ─── Express mock helpers ────────────────────────────────────────────────────

/** Build a minimal mock Express Request */
export function buildReq(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    body: {},
    params: {},
    query: {},
    session: {},
    ...overrides,
  };
}

/** Build a minimal mock Express Response with vi spies */
export function buildRes() {
  const res: Record<string, unknown> = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  res.setHeader = vi.fn().mockReturnValue(res);
  res.clearCookie = vi.fn().mockReturnValue(res);
  return res as unknown as import("express").Response & {
    status: ReturnType<typeof vi.fn>;
    json: ReturnType<typeof vi.fn>;
    setHeader: ReturnType<typeof vi.fn>;
    clearCookie: ReturnType<typeof vi.fn>;
  };
}

/** Build a simple next() spy */
export function buildNext() {
  return vi.fn() as unknown as import("express").NextFunction & ReturnType<typeof vi.fn>;
}
