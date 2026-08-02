import express from "express";
import dotenv from "dotenv";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import authRoutes from "./routes/auth.routes.js";
import connectPgSimple from "connect-pg-simple";
import session from "express-session";
import { Request, Response, NextFunction } from "express";
import postRoutes from "./routes/post.routes.js";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger.js";
import dbPool from "./db/pool.js";
import pool from "./db/pool.js";
import morgan from "morgan";

interface AppError extends Error {
  status?: number;
}

dotenv.config();

const SESSION_SECRET = process.env.SESSION_SECRET;
if (!SESSION_SECRET) throw new Error("SESSION_SECRET is not defined in .env");
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

const app = express();

const PgSession = connectPgSimple(session);

app.use(morgan("combined"));
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", "res.cloudinary.com"],
      },
    },
  }),
);
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  }),
);
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: "10kb" }));

const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  message: { error: "Too many requests" },
});

app.use(globalRateLimiter);

app.use(
  session({
    store: new PgSession({
      pool: dbPool,
      tableName: "sessions",
      createTableIfMissing: true,
    }),
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
  }),
);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use("/auth", authRoutes);
app.use("/posts", postRoutes);

// Telegram calls this when you tap a button
app.post("/telegram/webhook", async (req, res) => {
  const { callback_query } = req.body;
  if (!callback_query) return res.sendStatus(200);

  const { data } = callback_query;
  const [action, postId] = data.split("_");

  if (action === "approve") {
    await pool.query("UPDATE posts SET published = TRUE WHERE id = $1", [
      postId,
    ]);
    await answerCallback(callback_query.id, "✅ Post approved and published!");
  }

  if (action === "reject") {
    await pool.query("DELETE FROM posts WHERE id = $1", [postId]);
    await answerCallback(callback_query.id, "❌ Post rejected and deleted.");
  }

  res.sendStatus(200);
});

const answerCallback = async (callbackId: string, text: string) => {
  await fetch(
    `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ callback_query_id: callbackId, text }),
    },
  );
};

const PORT = process.env.PORT || 3000;

app.use((err: AppError, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  const status = err.status || 500;
  const message =
    process.env.NODE_ENV === "production"
      ? "Something went wrong"
      : err.message;
  res.status(status).json({ error: message });
});

app.listen(PORT, () => {
  console.log(`Server is listening at port ${PORT}`);
});
