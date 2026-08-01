import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockPost } from "./helpers.js";
import type { Post } from "../types/index.js";

// ── Mock DB query layer ───────────────────────────────────────────────────────
vi.mock("../db/queries/posts.js", () => ({
  createPost: vi.fn(),
  getAllPosts: vi.fn(),
  getPostBySlug: vi.fn(),
  updatePost: vi.fn(),
  deletePost: vi.fn(),
}));

import {
  createPostModel,
  getAllPostsModel,
  getPostBySlugModel,
  updatePostModel,
  deletePostModel,
} from "../models/post.model.js";
import * as postsQueries from "../db/queries/posts.js";

const createPost = vi.mocked(postsQueries.createPost);
const getAllPosts = vi.mocked(postsQueries.getAllPosts);
const getPostBySlug = vi.mocked(postsQueries.getPostBySlug);
const updatePost = vi.mocked(postsQueries.updatePost);
const deletePost = vi.mocked(postsQueries.deletePost);

beforeEach(() => vi.clearAllMocks());

// ─────────────────────────────────────────────────────────────────────────────
describe("createPostModel", () => {
  it("generates a slug from the title and calls createPost", async () => {
    createPost.mockResolvedValue(mockPost);

    const result = await createPostModel("user-uuid-1", {
      title: "Hello World",
      content: "body",
      published: true,
    });

    expect(createPost).toHaveBeenCalledWith(
      expect.objectContaining({
        authorId: "user-uuid-1",
        title: "Hello World",
        slug: "hello-world",
        content: "body",
        published: true,
      }),
    );
    expect(result).toEqual(mockPost);
  });

  it("strips special characters when generating a slug", async () => {
    createPost.mockResolvedValue(mockPost);

    await createPostModel("user-uuid-1", {
      title: "Hello, World! #1",
      content: "body",
    });

    expect(createPost).toHaveBeenCalledWith(
      expect.objectContaining({ slug: "hello-world-1" }),
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("getAllPostsModel", () => {
  it("fetches only published posts by default", async () => {
    getAllPosts.mockResolvedValue([mockPost]);

    const result = await getAllPostsModel();

    expect(getAllPosts).toHaveBeenCalledWith({ publishedOnly: true });
    expect(result).toEqual([mockPost]);
  });

  it("fetches all posts when publishedOnly is false", async () => {
    getAllPosts.mockResolvedValue([mockPost]);

    await getAllPostsModel(false);

    expect(getAllPosts).toHaveBeenCalledWith({ publishedOnly: false });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("getPostBySlugModel", () => {
  it("returns the post when found", async () => {
    getPostBySlug.mockResolvedValue(mockPost);

    const result = await getPostBySlugModel("test-post");

    expect(getPostBySlug).toHaveBeenCalledWith("test-post");
    expect(result).toEqual(mockPost);
  });

  it("throws 'Post not found' when slug does not exist", async () => {
    getPostBySlug.mockResolvedValue(null);

    await expect(getPostBySlugModel("missing-slug")).rejects.toThrow(
      "Post not found",
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("updatePostModel", () => {
  it("updates the post and returns it", async () => {
    updatePost.mockResolvedValue(mockPost);

    const result = await updatePostModel("post-uuid-1", "user-uuid-1", {
      title: "Updated Title",
      content: "updated body",
    });

    expect(updatePost).toHaveBeenCalledWith(
      "post-uuid-1",
      "user-uuid-1",
      expect.objectContaining({ title: "Updated Title" }),
    );
    expect(result).toEqual(mockPost);
  });

  it("regenerates slug when title is updated", async () => {
    updatePost.mockResolvedValue(mockPost);

    await updatePostModel("post-uuid-1", "user-uuid-1", {
      title: "New Title Here",
    });

    expect(updatePost).toHaveBeenCalledWith(
      "post-uuid-1",
      "user-uuid-1",
      expect.objectContaining({ slug: "new-title-here" }),
    );
  });

  it("throws 'Post not found or not authorized' when update returns null", async () => {
    updatePost.mockResolvedValue(null as unknown as Post);

    await expect(
      updatePostModel("bad-id", "user-uuid-1", { title: "x" }),
    ).rejects.toThrow("Post not found or not authorized");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("deletePostModel", () => {
  it("resolves without error when deletion succeeds", async () => {
    deletePost.mockResolvedValue(true);

    await expect(
      deletePostModel("post-uuid-1", "user-uuid-1"),
    ).resolves.toBeUndefined();
  });

  it("throws 'Post not found or not authorized' when deletion fails", async () => {
    deletePost.mockResolvedValue(false);

    await expect(
      deletePostModel("bad-id", "user-uuid-1"),
    ).rejects.toThrow("Post not found or not authorized");
  });
});
