import pool from "../db/pool";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

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

  const token = jwt.sign(
    {
      id: user.id,
      email: user.email,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" },
  );

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
    },
  };
};
