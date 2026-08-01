import { describe, it, expect, vi, beforeEach } from "vitest";
import { buildReq, buildRes, buildNext, mockUser } from "./helpers.js";

// ── Mock the auth model ───────────────────────────────────────────────────────
vi.mock("../models/auth.model.js", () => ({
  registerUser: vi.fn(),
  loginUser: vi.fn(),
}));

import { register, login, logout } from "../controllers/auth.controller.js";
import * as authModel from "../models/auth.model.js";

const registerUser = vi.mocked(authModel.registerUser);
const loginUser = vi.mocked(authModel.loginUser);

beforeEach(() => vi.clearAllMocks());

// ─────────────────────────────────────────────────────────────────────────────
describe("register controller", () => {
  it("returns 400 when any required field is missing", async () => {
    const req = buildReq({ body: { email: "a@b.com", username: "u" } }); // no password
    const res = buildRes();
    const next = buildNext();

    await register(req as any, res as any, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "All fields are required" });
    expect(registerUser).not.toHaveBeenCalled();
  });

  it("returns 400 when password is shorter than 8 characters", async () => {
    const req = buildReq({
      body: { email: "a@b.com", username: "u", password: "short" },
    });
    const res = buildRes();
    const next = buildNext();

    await register(req as any, res as any, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: "Password must be at least 8 characters",
    });
  });

  it("saves user to session and returns 201 on success", async () => {
    registerUser.mockResolvedValue(mockUser);
    const session: Record<string, unknown> = {};
    const req = buildReq({
      body: {
        email: "test@example.com",
        username: "testuser",
        password: "password123",
      },
      session,
    });
    const res = buildRes();
    const next = buildNext();

    await register(req as any, res as any, next);

    expect(registerUser).toHaveBeenCalledWith({
      email: "test@example.com",
      username: "testuser",
      password: "password123",
    });
    expect(session.user).toEqual(mockUser);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      message: "User registered successfully",
      user: mockUser,
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("calls next(error) when registerUser throws", async () => {
    const error = new Error("Email already taken");
    registerUser.mockRejectedValue(error);
    const req = buildReq({
      body: {
        email: "dup@example.com",
        username: "u",
        password: "password123",
      },
    });
    const res = buildRes();
    const next = buildNext();

    await register(req as any, res as any, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("login controller", () => {
  it("returns 400 when fields are missing", async () => {
    const req = buildReq({ body: { email: "a@b.com" } }); // no password
    const res = buildRes();
    const next = buildNext();

    await login(req as any, res as any, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "All fields are required" });
  });

  it("saves user to session and returns 200 on success", async () => {
    loginUser.mockResolvedValue(mockUser);
    const session: Record<string, unknown> = {};
    const req = buildReq({
      body: { email: "test@example.com", password: "password123" },
      session,
    });
    const res = buildRes();
    const next = buildNext();

    await login(req as any, res as any, next);

    expect(session.user).toEqual(mockUser);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: "Login successfull",
      user: mockUser,
    });
  });

  it("calls next(error) when loginUser throws", async () => {
    const error = new Error("Invalid credentials");
    loginUser.mockRejectedValue(error);
    const req = buildReq({
      body: { email: "a@b.com", password: "wrongpassword" },
    });
    const res = buildRes();
    const next = buildNext();

    await login(req as any, res as any, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("logout controller", () => {
  it("destroys the session, clears the cookie and returns a message", async () => {
    // session.destroy calls its callback synchronously in this mock
    const session = {
      destroy: vi.fn((cb: (err?: Error) => void) => cb()),
    };
    const req = buildReq({ session });
    const res = buildRes();
    const next = buildNext();

    await logout(req as any, res as any, next);

    expect(session.destroy).toHaveBeenCalledOnce();
    expect(res.clearCookie).toHaveBeenCalledWith("connect.sid");
    expect(res.json).toHaveBeenCalledWith({
      message: "Logged out successfully",
    });
  });

  it("calls next(err) when session.destroy fails", async () => {
    const destroyError = new Error("destroy failed");
    const session = {
      destroy: vi.fn((cb: (err?: Error) => void) => cb(destroyError)),
    };
    const req = buildReq({ session });
    const res = buildRes();
    const next = buildNext();

    await logout(req as any, res as any, next);

    expect(next).toHaveBeenCalledWith(destroyError);
    expect(res.json).not.toHaveBeenCalled();
  });
});
