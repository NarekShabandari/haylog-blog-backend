import pool from "../pool";

export const createUser = async ({ email, username, hashedPassword }) => {
  const { rows } = await pool.query(
    `INSERT INTO users (email, username, password)
        VALUES ($1, $2, $3)
        RETURNING id, email, username, created_at`,
    [email, username, hashedPassword],
  );
  return rows[0];
};

export const findUserByEmail = async (email) => {
  const { rows } = await pool.query(`SELECT * FROM users WHERE email = $1`, [
    email,
  ]);
  return rows[0] || null;
};

export const findUserById = async (id) => {
  const { rows } = await pool.query(
    `SELECT id, email, username, created_at FROM users WHERE id = $1`,
    [id],
  );
};
