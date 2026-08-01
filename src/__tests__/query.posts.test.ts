import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockPost } from "./helpers.js";

// ── Mock the DB pool before importing the query module ───────────────────────
vi.mock("../db/pool.js", () => ({
  default: { query: vi.fn() },
}));

import {
  createPost,
  getAllPosts,
  getPostBySlug,
  updatePost,
  deletePost,
} from "../db/queries/posts.js";
import pool from "../db/pool.js";

const poolQuery = vi.mocked(pool.query);

beforeEach(() => vi.clearAllMocks());

// ─────────────────────────────────────────────────────────────────────────────
describe("createPost", () => {
  it("inserts a post and returns the created row", async () => {
    poolQuery.mockResolvedValue({ rows: [mockPost] } as any);

    const result = await createPost({
      authorId: "user-uuid-1",
      title: "Test Post",
      slug: "test-post",
      content: "Test content body",
      published: true,
      tags: ["test"],
    });

    expect(poolQuery).toHaveBeenCalledOnce();
    const [sql, params] = poolQuery.mock.calls[0] as [string, unknown[]];
    expect(sql).toMatch(/INSERT INTO posts/i);
    expect(params[0]).toBe("user-uuid-1");
    expect(params[1]).toBe("Test Post");
    expect(params[2]).toBe("test-post");
    expect(result).toEqual(mockPost);
  });

  it("uses null defaults for optional fields", async () => {
    poolQuery.mockResolvedValue({ rows: [mockPost] } as any);

    await createPost({
      authorId: "user-uuid-1",
      title: "Minimal Post",
      slug: "minimal-post",
      content: "body",
    });

    const [, params] = poolQuery.mock.calls[0] as [string, unknown[]];
    // tags default is []
    expect(params[5]).toEqual([]);
    // optional nullable fields default to null
    expect(params[6]).toBeNull(); // title_hy
    expect(params[7]).toBeNull(); // content_hy
    expect(params[8]).toBeNull(); // meta_description
    expect(params[9]).toBeNull(); // meta_description_hy
    expect(params[10]).toBeNull(); // cover_image
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("getAllPosts", () => {
  it("includes a WHERE clause when publishedOnly is true (default)", async () => {
    poolQuery.mockResolvedValue({ rows: [mockPost] } as any);

    const result = await getAllPosts();

    const [sql] = poolQuery.mock.calls[0] as [string];
    expect(sql).toMatch(/WHERE p\.published = TRUE/i);
    expect(result).toEqual([mockPost]);
  });

  it("omits the WHERE clause when publishedOnly is false", async () => {
    poolQuery.mockResolvedValue({ rows: [mockPost] } as any);

    await getAllPosts({ publishedOnly: false });

    const [sql] = poolQuery.mock.calls[0] as [string];
    expect(sql).not.toMatch(/WHERE p\.published/i);
  });

  it("returns an empty array when there are no posts", async () => {
    poolQuery.mockResolvedValue({ rows: [] } as any);

    const result = await getAllPosts();

    expect(result).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("getPostBySlug", () => {
  it("returns the post when found", async () => {
    poolQuery.mockResolvedValue({ rows: [mockPost] } as any);

    const result = await getPostBySlug("test-post");

    const [sql, params] = poolQuery.mock.calls[0] as [string, unknown[]];
    expect(sql).toMatch(/WHERE p\.slug = \$1/i);
    expect(params).toEqual(["test-post"]);
    expect(result).toEqual(mockPost);
  });

  it("returns null when slug is not found", async () => {
    poolQuery.mockResolvedValue({ rows: [] } as any);

    const result = await getPostBySlug("missing-slug");

    expect(result).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("updatePost", () => {
  it("updates and returns the post", async () => {
    poolQuery.mockResolvedValue({ rows: [mockPost] } as any);

    const result = await updatePost("post-uuid-1", "user-uuid-1", {
      title: "Updated",
      content: "updated body",
      published: false,
    });

    const [sql, params] = poolQuery.mock.calls[0] as [string, unknown[]];
    expect(sql).toMatch(/UPDATE posts/i);
    expect(params).toEqual([
      "Updated",
      "updated body",
      false,
      "post-uuid-1",
      "user-uuid-1",
    ]);
    expect(result).toEqual(mockPost);
  });

  it("returns null when post is not found or not owned by author", async () => {
    poolQuery.mockResolvedValue({ rows: [] } as any);

    const result = await updatePost("bad-id", "user-uuid-1", {
      title: "x",
      content: "y",
      published: false,
    });

    expect(result).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("deletePost", () => {
  it("returns true when a row is deleted", async () => {
    poolQuery.mockResolvedValue({ rowCount: 1 } as any);

    const result = await deletePost("post-uuid-1", "user-uuid-1");

    const [sql, params] = poolQuery.mock.calls[0] as [string, unknown[]];
    expect(sql).toMatch(/DELETE FROM posts/i);
    expect(params).toEqual(["post-uuid-1", "user-uuid-1"]);
    expect(result).toBe(true);
  });

  it("returns false when no matching row is found", async () => {
    poolQuery.mockResolvedValue({ rowCount: 0 } as any);

    const result = await deletePost("bad-id", "user-uuid-1");

    expect(result).toBe(false);
  });

  it("handles null rowCount gracefully", async () => {
    poolQuery.mockResolvedValue({ rowCount: null } as any);

    const result = await deletePost("post-uuid-1", "user-uuid-1");

    expect(result).toBe(false);
  });
});
