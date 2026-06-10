import pool from "../db/pool.js";
import bcrypt from "bcryptjs";
import { findUserByEmail, createUser } from "../db/queries/users.js";

export const registerUser = async ({ email, username, password }) => {
  const existing = await findUserByEmail(email);

  if (existing) throw new Error("Email already taken");

  const hashedPassword = await bcrypt.hash(password, 12);

  return await createUser({ email, username, hashedPassword });

  return rows[0];
};

export const loginUser = async ({ email, password }) => {
  const user = await findUserByEmail(email);
  if (!user) throw new Error("Invalid credentials");

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new Error("Invalid credentials");

  return {
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
    },
  };
};
