const express = require("express");
const Post = require("../models/Post");
const authMiddleware = require("../middleware/auth");
const { validate, schemas } = require("../middleware/validate");

const router = express.Router();

router.post("/", authMiddleware, validate(schemas.post), async (req, res) => {
  const post = await Post.create({
    title: req.body.title,
    content: req.body.content,
    author: req.user.id, // taken from the verified JWT, not from req.body!
  });
  res.status(201).json(post);
});

router.get("/:id", async (req, res) => {
  const post = await Post.findById(req.params.id).populate(
    "author",
    "username",
  );
  if (!post) return res.status(404).json({ error: "Post not found" });
  res.json(post);
});

router.put("/:id", authMiddleware, validate(schemas.post), async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ error: "Post not found" });

  if (post.author.toString() !== req.user.id) {
    return res.status(403).json({ error: "Not authorized to edit this post" });
  }

  post.title = req.body.title;
  post.content = req.body.content;
  await post.save();

  res.json(post);
});

router.delete("/:id", authMiddleware, async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ error: "Post not found" });

  if (post.author.toString() !== req.user.id) {
    return res
      .status(403)
      .json({ error: "Not authorized to delete this post" });
  }

  await post.deleteOne();
  res.json({ message: "Post deleted" });
});

module.exports = router;
