import pool from "../pool";

export const createPost = async ({
  authorId,
  title,
  slug,
  content,
  published,
}) => {
  const { rows } = await pool.query(
    `INSERT INTO posts (author_id, title, slug, content, published)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *`,
    [authorId, title, slug, content, published ?? false],
  );
  return rows[0];
};

export const getAllPosts = async ({ publishedOnly = true } = {}) => {
  const { rows } = await pool.query(
    `SELECT p.*, u.username AS author
        FROM posts p
        JOIN users u ON u.id = p.author.id
  ${publishedOnly ? "WHERE p.published = TRUE" : ""}
  ORDER BY p.created_at DESC`,
  );
  return rows;
};

export const getPostBySlug = async (slug) => {
  const { rows } = await pool.query(
    `SELECT p.*, us.username AS author
        FROM posts p
        JOIN users u ON u.id = p.author_id
        WHERE p.slug = $1`,
    [slug],
  );
  return rows[0] || null;
};

export const updatePost = async (id, authorId, fields) => {
  const { title, content, published } = fields;
  const { rows } = await pool.query(
    `UPDATE posts SET title=$1, content=$2, published=$3
    WHERE id=$4 AND author_id=$5
    RETURNING *`,
    [title, content, published, id, authorId],
  );
  return rows[0] || null;
};

export const deletePost = async (id, authorId) => {
  const { rowCount } = await pool.query(
    `DELETE FROM posts WHERE id=$1 AND author_id=$2`,
    [id, authorId],
  );
  return rowCount > 0;
};
