const jwt = require("jsonwebtoken");
const env = require("../config/env");
const User = require("../models/User");
const AppError = require("../utils/AppError");

// Requires a valid "Authorization: Bearer <token>" header and loads req.user.
const protect = async (req, res, next) => {
  const [scheme, token] = (req.headers.authorization || "").split(" ");
  if (scheme !== "Bearer" || !token) throw new AppError(401, "Not authorized, no token");

  let decoded;
  try {
    decoded = jwt.verify(token, env.JWT_SECRET);
  } catch {
    throw new AppError(401, "Not authorized, invalid or expired token");
  }

  const user = await User.findById(decoded.id).select("+passwordChangedAt");
  if (!user) throw new AppError(401, "Not authorized, account not found");
  if (user.passwordChangedAt && decoded.iat * 1000 < user.passwordChangedAt.getTime()) {
    throw new AppError(401, "Your password changed. Log in again.");
  }

  req.user = user;
  next();
};

const requireAdmin = (req, res, next) => {
  if (req.user?.role !== "admin") throw new AppError(403, "Admins only");
  next();
};

module.exports = { protect, requireAdmin };
