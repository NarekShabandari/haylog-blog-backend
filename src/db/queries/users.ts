import pool from "../pool.js";
import { CreateUserInput, User } from "../../types/index.js";

export const createUser = async ({
  email,
  username,
  hashedPassword,
}: CreateUserInput): Promise<User> => {
  const { rows } = await pool.query<User>(
    `INSERT INTO users (email, username, password)
        VALUES ($1, $2, $3)
        RETURNING id, email, username, created_at`,
    [email, username, hashedPassword],
  );
  return rows[0];
};

export const findUserByEmail = async (
  email: string,
): Promise<(User & { password: string }) | null> => {
  const { rows } = await pool.query<User & { password: string }>(
    `SELECT * FROM users WHERE email = $1`,
    [email],
  );
  return rows[0] || null;
};

export const findUserById = async (id: string): Promise<User | null> => {
  const { rows } = await pool.query<User>(
    `SELECT id, email, username, created_at FROM users WHERE id = $1`,
    [id],
  );
  return rows[0] || null;
};
