/**
 * Minimal Express app for integration tests.
 *
 * Mirrors server.ts but replaces:
 *   - connect-pg-simple session store → in-memory MemoryStore (no DB needed)
 *   - rate-limiter disabled (avoids 429 in rapid test runs)
 */
import express, { Request, Response, NextFunction } from "express";
import session from "express-session";
import authRoutes from "../../routes/auth.routes.js";
import postRoutes from "../../routes/post.routes.js";

interface AppError extends Error {
  status?: number;
}

export function buildApp() {
  const app = express();

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // In-memory session store – no PostgreSQL required
  app.use(
    session({
      secret: "test-secret",
      resave: false,
      saveUninitialized: false,
      cookie: { secure: false },
    }),
  );

  app.use("/auth", authRoutes);
  app.use("/posts", postRoutes);

  // Central error handler (mirrors server.ts)
  app.use((err: AppError, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || 500;
    res.status(status).json({ error: err.message });
  });

  return app;
}
