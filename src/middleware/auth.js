export const authenticate = (req, res, next) => {
  if (!req.session.userId)
    return res.status(401).json({ error: "Not authenticated" });
  next();
};

export const authorizeAdmin = (req, res, next) => {
  if (req.session.role !== "ADMIN")
    return res.status(403).json({ error: "Forbidden" });
  next();
};
