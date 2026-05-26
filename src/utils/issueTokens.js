const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

module.exports = async function issueTokens(user, res) {
  // Short-lived access token
  const accessToken = jwt.sign(
    { id: user._id, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: "15m" },
  );

  // Opaque refresh token
  const refreshToken = crypto.randomBytes(64).toString("hex");
  const hashedRefresh = await bcrypt.hash(refreshToken, 10);

  user.refreshToken = hashedRefresh;
  await user.save({ validateBeforeSave: false });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return accessToken;
};
