import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockUser, mockUserWithPassword } from "./helpers.js";

// ── Mock the DB query layer and bcrypt before importing the model ─────────────
vi.mock("../db/queries/users.js", () => ({
  findUserByEmail: vi.fn(),
  createUser: vi.fn(),
}));

vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn(),
    compare: vi.fn(),
  },
}));

import { registerUser, loginUser } from "../models/auth.model.js";
import * as usersQueries from "../db/queries/users.js";
import bcrypt from "bcryptjs";

const findUserByEmail = vi.mocked(usersQueries.findUserByEmail);
const createUser = vi.mocked(usersQueries.createUser);
const bcryptHash = vi.mocked(bcrypt.hash);
const bcryptCompare = vi.mocked(bcrypt.compare);

beforeEach(() => {
  vi.clearAllMocks();
});

// ─────────────────────────────────────────────────────────────────────────────
describe("registerUser", () => {
  it("hashes password and creates a user when email is free", async () => {
    findUserByEmail.mockResolvedValue(null);
    bcryptHash.mockResolvedValue("hashed_pw" as never);
    createUser.mockResolvedValue(mockUser);

    const result = await registerUser({
      email: "test@example.com",
      username: "testuser",
      password: "password123",
    });

    expect(findUserByEmail).toHaveBeenCalledWith("test@example.com");
    expect(bcryptHash).toHaveBeenCalledWith("password123", 12);
    expect(createUser).toHaveBeenCalledWith({
      email: "test@example.com",
      username: "testuser",
      hashedPassword: "hashed_pw",
    });
    expect(result).toEqual(mockUser);
  });

  it("throws 'Email already taken' when email exists", async () => {
    findUserByEmail.mockResolvedValue(mockUserWithPassword);

    await expect(
      registerUser({ email: "test@example.com", username: "x", password: "pw" }),
    ).rejects.toThrow("Email already taken");

    expect(createUser).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("loginUser", () => {
  it("returns user when credentials are valid", async () => {
    findUserByEmail.mockResolvedValue(mockUserWithPassword);
    bcryptCompare.mockResolvedValue(true as never);

    const result = await loginUser({
      email: "test@example.com",
      password: "password123",
    });

    expect(bcryptCompare).toHaveBeenCalledWith(
      "password123",
      mockUserWithPassword.password,
    );
    expect(result).toEqual({
      id: mockUser.id,
      email: mockUser.email,
      username: mockUser.username,
    });
  });

  it("throws 'Invalid credentials' when user is not found", async () => {
    findUserByEmail.mockResolvedValue(null);

    await expect(
      loginUser({ email: "nobody@example.com", password: "pw" }),
    ).rejects.toThrow("Invalid credentials");

    expect(bcryptCompare).not.toHaveBeenCalled();
  });

  it("throws 'Invalid credentials' when password does not match", async () => {
    findUserByEmail.mockResolvedValue(mockUserWithPassword);
    bcryptCompare.mockResolvedValue(false as never);

    await expect(
      loginUser({ email: "test@example.com", password: "wrongpw" }),
    ).rejects.toThrow("Invalid credentials");
  });
});
