import { Router } from "express";
import {
  createPostController,
  deletePostController,
  generatePostController,
  getAllPostsController,
  getMyPostsController,
  getPostBySlugController,
  updatePostController,
} from "../controllers/post.controller";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();
router.get("/", getAllPostsController);
router.get("/:tlug", getPostBySlugController);

router.get("/my", authenticate, getMyPostsController);
router.post("/", authenticate, createPostController);
router.patch("/:id", authenticate, updatePostController);
router.delete("/:id", authenticate, deletePostController);

router.post("/generate", authenticate, generatePostController);

export default router;
