import { Request, Response, NextFunction } from "express";
import {
  createPostModel,
  deletePostModel,
  getAllPostsModel,
  getPostBySlugModel,
  updatePostModel,
  generateAndSavePost,
} from "../models/post.model";

export const getAllPostsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const posts = await getAllPostsModel();
    res.status(200).json({ posts });
  } catch (error) {
    next(error);
  }
};

export const getMyPostsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const posts = await getAllPostsModel(false);
    res.status(200).json({ posts });
  } catch (err) {
    next(err);
  }
};

export const getPostBySlugController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { slug } = req.params;
    const post = await getPostBySlugModel(slug as string);
    res.status(200).json({ post });
  } catch (err) {
    next(err);
  }
};

export const createPostController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { title, content, published } = req.body;
    const authorId = req.session.user!.id;
    if (!title || !content) {
      res.status(400).json({ error: "Title and content are required" });
      return;
    }
    const post = await createPostModel(authorId, { title, content, published });
    res.status(201).json({ message: "Post created successfully", post });
  } catch (error) {
    next(error);
  }
};

export const updatePostController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    const authorId = req.session.user!.id;
    const { title, content, published } = req.body;

    if (!title && !content && published === undefined) {
      res.status(400).json({ error: "Nothing to update" });
      return;
    }

    const post = await updatePostModel(id as string, authorId, {
      title,
      content,
      published,
    });
    res.status(200).json({ message: "Post updated successfully", post });
  } catch (err) {
    next(err);
  }
};

export const deletePostController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    const authorId = req.session.user!.id;

    await deletePostModel(id as string, authorId);
    res.status(200).json({ message: "Post deleted successfully" });
  } catch (err) {
    next(err);
  }
};

export const generatePostController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { topic, targetKeyword, audience, tone, published } = req.body;
    const authorId = req.session.user!.id;

    if (!topic || !targetKeyword) {
      res.status(400).json({ error: "topic and targetKeyword are required" });
      return;
    }

    res.setHeader("X-Status", "generating");

    const post = await generateAndSavePost(
      authorId,
      { topic, targetKeyword, audience, tone },
      published ?? false,
    );

    res.status(201).json({
      message: "Post generated and saved successfully",
      post,
    });
  } catch (err) {
    next(err);
  }
};
