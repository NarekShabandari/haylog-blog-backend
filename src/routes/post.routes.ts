import { Router } from "express";
import {
  getAllPostsController,
  getMyPostsController,
  getPostBySlugController,
  createPostController,
  updatePostController,
  deletePostController,
  generatePostController,
} from "../controllers/post.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import rateLimit from "express-rate-limit";

const postCreationRateLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  limit: 1,
  message: { error: "Too many generation requests" },
});

const router = Router();

/**
 * @swagger
 * /posts:
 *   get:
 *     summary: Get all published posts
 *     tags: [Posts]
 *     responses:
 *       200:
 *         description: List of published posts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 posts:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Post'
 */
router.get("/", getAllPostsController);

/**
 * @swagger
 * /posts/my:
 *   get:
 *     summary: Get all posts by logged in user including drafts
 *     tags: [Posts]
 *     responses:
 *       200:
 *         description: List of user posts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 posts:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Post'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/my", requireAuth, getMyPostsController);

/**
 * @swagger
 * /posts/generate:
 *   post:
 *     summary: AI generate and save a post
 *     tags: [Posts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [topic, targetKeyword]
 *             properties:
 *               topic:
 *                 type: string
 *                 example: Why TypeScript matters for backends
 *               targetKeyword:
 *                 type: string
 *                 example: typescript nodejs backend
 *               audience:
 *                 type: string
 *                 example: backend developers
 *               tone:
 *                 type: string
 *                 example: technical but approachable
 *               published:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       201:
 *         description: Post generated and saved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 post:
 *                   $ref: '#/components/schemas/Post'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  "/generate",
  requireAuth,
  postCreationRateLimiter,
  generatePostController,
);

/**
 * @swagger
 * /posts/{slug}:
 *   get:
 *     summary: Get a single post by slug
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         example: why-typescript-matters
 *     responses:
 *       200:
 *         description: Single post
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 post:
 *                   $ref: '#/components/schemas/Post'
 *       500:
 *         description: Post not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/:slug", getPostBySlugController);

/**
 * @swagger
 * /posts:
 *   post:
 *     summary: Create a post manually
 *     tags: [Posts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, content]
 *             properties:
 *               title:
 *                 type: string
 *                 example: My First Post
 *               content:
 *                 type: string
 *                 example: Markdown content here
 *               published:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       201:
 *         description: Post created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 post:
 *                   $ref: '#/components/schemas/Post'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/", requireAuth, postCreationRateLimiter, createPostController);

/**
 * @swagger
 * /posts/{id}:
 *   patch:
 *     summary: Update a post
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               published:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Post updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 post:
 *                   $ref: '#/components/schemas/Post'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   delete:
 *     summary: Delete a post
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Post deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.patch(
  "/:id",
  requireAuth,
  postCreationRateLimiter,
  updatePostController,
);
router.delete("/:id", requireAuth, deletePostController);

export default router;
