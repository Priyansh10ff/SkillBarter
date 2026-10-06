const rateLimit = require("express-rate-limit");
const env = require("../config/env");

const skip = () => env.NODE_ENV === "test";
const common = { windowMs: 15 * 60 * 1000, standardHeaders: "draft-8", legacyHeaders: false, skip };

// Login, register and email-token routes
const authLimiter = rateLimit({
  ...common,
  limit: 20,
  message: { message: "Too many attempts. Try again in a few minutes." },
});

// Everything else under /api
const apiLimiter = rateLimit({
  ...common,
  limit: 300,
  message: { message: "Too many requests. Slow down a little." },
});

module.exports = { authLimiter, apiLimiter };
