import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockUser } from "./helpers.js";

// ── Mock the DB pool before importing the query module ───────────────────────
vi.mock("../db/pool.js", () => ({
  default: { query: vi.fn() },
}));

import { createUser, findUserByEmail, findUserById } from "../db/queries/users.js";
import pool from "../db/pool.js";

const poolQuery = vi.mocked(pool.query);

/** Cast mock.calls[0] safely through unknown */
function getCall(index = 0): [string, unknown[]] {
  return poolQuery.mock.calls[index] as unknown as [string, unknown[]];
}

beforeEach(() => vi.clearAllMocks());

// ─────────────────────────────────────────────────────────────────────────────
describe("createUser", () => {
  it("inserts a user and returns the row", async () => {
    poolQuery.mockResolvedValue({ rows: [mockUser] } as any);

    const result = await createUser({
      email: "test@example.com",
      username: "testuser",
      hashedPassword: "hashed_pw",
    });

    expect(poolQuery).toHaveBeenCalledOnce();
    const [sql, params] = getCall();
    expect(sql).toMatch(/INSERT INTO users/i);
    expect(params).toEqual(["test@example.com", "testuser", "hashed_pw"]);
    expect(result).toEqual(mockUser);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("findUserByEmail", () => {
  it("returns the user with password when found", async () => {
    const userWithPw = { ...mockUser, password: "hashed_pw" };
    poolQuery.mockResolvedValue({ rows: [userWithPw] } as any);

    const result = await findUserByEmail("test@example.com");

    const [sql, params] = getCall();
    expect(sql).toMatch(/SELECT \* FROM users WHERE email/i);
    expect(params).toEqual(["test@example.com"]);
    expect(result).toEqual(userWithPw);
  });

  it("returns null when no user is found", async () => {
    poolQuery.mockResolvedValue({ rows: [] } as any);

    const result = await findUserByEmail("nobody@example.com");

    expect(result).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("findUserById", () => {
  it("returns the user when found", async () => {
    poolQuery.mockResolvedValue({ rows: [mockUser] } as any);

    const result = await findUserById("user-uuid-1");

    const [sql, params] = getCall();
    expect(sql).toMatch(/SELECT .* FROM users WHERE id/i);
    expect(params).toEqual(["user-uuid-1"]);
    expect(result).toEqual(mockUser);
  });

  it("returns null when no user is found", async () => {
    poolQuery.mockResolvedValue({ rows: [] } as any);

    const result = await findUserById("missing-id");

    expect(result).toBeNull();
  });
});
