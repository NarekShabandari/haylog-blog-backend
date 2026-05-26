const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const authMiddleware = require("../middleware/auth");
const { validate, schemas } = require("../middleware/validate");
const { addToBlacklist } = require("../utils/tokenBlacklist");
const crypto = require("crypto");
const issueTokens = require("../utils/issueTokens");

const router = express.Router();

router.post("/register", validate(schemas.register), async (req, res) => {
  const { username, email, password } = req.body;
  const existing = await User.findOne({ $or: [{ email }, { username }] });
  if (existing) {
    return res.status(409).json({ error: "Email or username already taken" });
  }
  const user = await User.create({ username, email, password });


  const accessToken = await issueTokens(user, res);  


  res.status(201).json({ token, user: { id: user._id, username, email } });
});

router.post("/login", validate(schemas.login), async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select("+password");

  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const accessToken = await issueTokens(user, res); 

  res.json({ token, user: { id: user._id, username: user.username, email } });
});

router.post("/logout", authMiddleware, (req, res) => {
  const token = req.headers.authorization.split(" ")[1];
  addToBlacklist(token);
  await User.findByIdAndUpdate(req.user.id, { $unset: { refreshToken: 1 } });
  res.clearCookie('refreshToken');
  res.json({ message: "Logged out successfully" }); 
});

module.exports = router;
