import { describe, it, expect, vi } from "vitest";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { buildReq, buildRes, buildNext, mockUser } from "./helpers.js";

describe("requireAuth middleware", () => {
  it("calls next() when session.user is present", () => {
    const req = buildReq({ session: { user: mockUser } });
    const res = buildRes();
    const next = buildNext();

    requireAuth(req as any, res as any, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("returns 401 when session.user is missing", () => {
    const req = buildReq({ session: {} });
    const res = buildRes();
    const next = buildNext();

    requireAuth(req as any, res as any, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Not authenticated" });
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 when session.user is null", () => {
    // Express always provides a session object; user may be explicitly null
    const req = buildReq({ session: { user: null } });
    const res = buildRes();
    const next = buildNext();

    requireAuth(req as any, res as any, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Not authenticated" });
    expect(next).not.toHaveBeenCalled();
  });
});
