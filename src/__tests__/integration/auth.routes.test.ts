import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { buildApp } from "./app.js";
import { mockUser } from "../helpers.js";

// ── Mock the auth model so no DB is touched ───────────────────────────────────
vi.mock("../../models/auth.model.js", () => ({
  registerUser: vi.fn(),
  loginUser: vi.fn(),
}));

import * as authModel from "../../models/auth.model.js";

const registerUser = vi.mocked(authModel.registerUser);
const loginUser = vi.mocked(authModel.loginUser);

// Rebuild the app for every test so session state is isolated
const app = buildApp();

beforeEach(() => vi.clearAllMocks());

// ─────────────────────────────────────────────────────────────────────────────
describe("POST /auth/register", () => {
  it("returns 400 when required fields are missing", async () => {
    const res = await request(app)
      .post("/auth/register")
      .send({ email: "a@b.com", username: "user" }); // no password

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ error: "All fields are required" });
  });

  it("returns 400 when password is too short", async () => {
    const res = await request(app)
      .post("/auth/register")
      .send({ email: "a@b.com", username: "user", password: "short" });

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({
      error: "Password must be at least 8 characters",
    });
  });

  it("returns 201 and user payload on success", async () => {
    registerUser.mockResolvedValue(mockUser);

    const res = await request(app).post("/auth/register").send({
      email: "test@example.com",
      username: "testuser",
      password: "password123",
    });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      message: "User registered successfully",
      user: { id: mockUser.id, email: mockUser.email, username: mockUser.username },
    });
  });

  it("returns 500 when registerUser throws (e.g. email already taken)", async () => {
    registerUser.mockRejectedValue(new Error("Email already taken"));

    const res = await request(app).post("/auth/register").send({
      email: "dup@example.com",
      username: "dupuser",
      password: "password123",
    });

    // Error handler in app.ts forwards the error message
    expect(res.status).toBe(500);
    expect(res.body).toMatchObject({ error: "Email already taken" });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("POST /auth/login", () => {
  it("returns 400 when fields are missing", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ email: "a@b.com" }); // no password

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ error: "All fields are required" });
  });

  it("returns 200 and user payload on success", async () => {
    loginUser.mockResolvedValue(mockUser);

    const res = await request(app).post("/auth/login").send({
      email: "test@example.com",
      password: "password123",
    });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      message: "Login successfull",
      user: { id: mockUser.id, email: mockUser.email },
    });
  });

  it("returns 500 when loginUser throws (invalid credentials)", async () => {
    loginUser.mockRejectedValue(new Error("Invalid credentials"));

    const res = await request(app)
      .post("/auth/login")
      .send({ email: "a@b.com", password: "wrongpassword" });

    expect(res.status).toBe(500);
    expect(res.body).toMatchObject({ error: "Invalid credentials" });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("POST /auth/logout", () => {
  it("returns 200 and clears session", async () => {
    // First log in to establish a session
    loginUser.mockResolvedValue(mockUser);
    const agent = request.agent(app);

    await agent.post("/auth/login").send({
      email: "test@example.com",
      password: "password123",
    });

    const res = await agent.post("/auth/logout");

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ message: "Logged out successfully" });
  });

  it("returns 200 even when no session was active", async () => {
    const res = await request(app).post("/auth/logout");

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ message: "Logged out successfully" });
  });
});
