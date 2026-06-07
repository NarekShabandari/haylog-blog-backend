import { registerUser } from "../models/auth.model";

export const register = async (req, res, next) => {
  try {
    const { email, username, password } = req.body;

    if (!email || !username || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    if (password.length < 8) {
      return res
        .status(400)
        .json({ error: "Password must be at least 8 characters" });
    }

    const user = await registerUser({ email, username, password });

    res.status(201).json({
      message: "User registered successfully",
      user,
    });
  } catch (error) {
    next(err);
  }
};
