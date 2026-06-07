import pool from "../db/pool";
import bcrypt from "bcryptjs";

export const registerUser = async ({ email, username, password }) => {
  const existing = await findUserByEmail(email);

  if (existing) throw new Error("Email already taken");

  const hashedPassword = await bcrypt.hash(password, 12);

  return await createUser({ email, username, hashedPassword });

  return rows[0];
};
