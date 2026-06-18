import {
  createPost,
  getAllPosts,
  getPostBySlug,
  updatePost,
  deletePost,
} from "../db/queries/posts.js";
import { GeneratedPost, generatePost } from "../lib/anthropic.js";
import { PostPromptInput } from "../lib/buildPostPrompt.js";
import { generateCoverImage } from "../lib/generateImage.js";
import { translateToArmenian } from "../lib/translate.js";
import { CreatePostInput, Post } from "../types/index.js";

const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
};

export const createPostModel = async (
  authorId: string,
  { title, content, published }: Omit<CreatePostInput, "authorId" | "slug">,
): Promise<Post> => {
  const slug = generateSlug(title);
  return await createPost({ authorId, title, slug, content, published });
};

export const getAllPostsModel = async (
  publishedOnly: boolean = true,
): Promise<Post[]> => {
  return await getAllPosts({ publishedOnly });
};

export const getPostBySlugModel = async (slug: string): Promise<Post> => {
  const post = await getPostBySlug(slug);
  if (!post) throw new Error("Post not found");
  return post;
};

export const updatePostModel = async (
  id: string,
  authorId: string,
  fields: Partial<Pick<Post, "title" | "content" | "published">>,
): Promise<Post> => {
  if (fields.title) {
    (fields as any).slug = generateSlug(fields.title);
  }

  const post = await updatePost(id, authorId, fields);
  if (!post) throw new Error("Post not found or not authorized");
  return post;
};

export const deletePostModel = async (
  id: string,
  authorId: string,
): Promise<void> => {
  const deleted = await deletePost(id, authorId);
  if (!deleted) throw new Error("Post not found or not authorized");
};

export const generateAndSavePost = async (
  authorId: string,
  input: PostPromptInput,
  published: boolean = false,
): Promise<Post> => {
  const [generated, cover_image] = await Promise.all([
    generatePost(input),
    generateCoverImage(input.topic),
  ]);

  const translated = await translateToArmenian(
    generated.title,
    generated.content,
    generated.metaDescription,
  );

  return await createPost({
    authorId,
    title: generated.title,
    slug: generated.slug,
    content: generated.content,
    published,
    tags: generated.tags,
    title_hy: translated.title_hy,
    content_hy: translated.content_hy,
    meta_description: generated.metaDescription,
    meta_description_hy: translated.meta_description_hy,
    cover_image,
  });
};
