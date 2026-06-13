import pool from "../pool.js";
import { CreatePostInput, Post } from "../../types/index.js";

export const createPost = async ({
  authorId,
  title,
  slug,
  content,
  published,
  tags = [],
}: CreatePostInput): Promise<Post> => {
  const { rows } = await pool.query<Post>(
    `INSERT INTO posts (author_id, title, slug, content, published, tags)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *`,
    [authorId, title, slug, content, published ?? false, tags],
  );
  return rows[0];
};

export const getAllPosts = async ({ publishedOnly = true } = {}): Promise<
  Post[]
> => {
  const { rows } = await pool.query<Post>(
    `SELECT p.*, u.username AS author
        FROM posts p
        JOIN users u ON u.id = p.author.id
  ${publishedOnly ? "WHERE p.published = TRUE" : ""}
  ORDER BY p.created_at DESC`,
  );
  return rows;
};

export const getPostBySlug = async (slug: string): Promise<Post | null> => {
  const { rows } = await pool.query<Post>(
    `SELECT p.*, us.username AS author
        FROM posts p
        JOIN users u ON u.id = p.author_id
        WHERE p.slug = $1`,
    [slug],
  );
  return rows[0] || null;
};

export const updatePost = async (
  id: string,
  authorId: string,
  fields: Partial<Pick<Post, "title" | "content" | "published">>,
) => {
  const { title, content, published } = fields;
  const { rows } = await pool.query<Post>(
    `UPDATE posts SET title=$1, content=$2, published=$3
    WHERE id=$4 AND author_id=$5
    RETURNING *`,
    [title, content, published, id, authorId],
  );
  return rows[0] || null;
};

export const deletePost = async (
  id: string,
  authorId: string,
): Promise<boolean> => {
  const { rowCount } = await pool.query(
    `DELETE FROM posts WHERE id=$1 AND author_id=$2`,
    [id, authorId],
  );
  return (rowCount ?? 0) > 0;
};
