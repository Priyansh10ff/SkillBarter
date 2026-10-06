const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");
const mongoose = require("mongoose");
const env = require("./config/env");
const corsOrigins = require("./config/corsOrigins");
const { apiLimiter } = require("./middleware/rateLimit");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const app = express();

// Render and Vercel sit in front of the app; trust their X-Forwarded-For for rate limits
app.set("trust proxy", 1);

// ===== MIDDLEWARE =====
app.use(helmet());
app.use(compression());
if (env.NODE_ENV !== "test") app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(express.json({ limit: "100kb" }));
app.use(cors({ origin: corsOrigins, credentials: true }));

// ===== HEALTH =====
app.get("/health", (req, res) => {
  const ok = mongoose.connection.readyState === 1;
  res.status(ok ? 200 : 503).json({ status: ok ? "ok" : "degraded", db: ok ? "connected" : "disconnected" });
});

// ===== ROUTES =====
app.use("/api", apiLimiter);
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/listings", require("./routes/listingRoutes"));
app.use("/api/bookings", require("./routes/bookingRoutes"));
app.use("/api/wallet", require("./routes/walletRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));

// ===== VIDEO SIGNALLING =====
// PeerServer needs the HTTP server, so server.js attaches it to this mount point.
// (Mounting here keeps it ahead of the 404 handler.)
app.peerMount = express();
app.use("/peerjs", app.peerMount);

// ===== ERRORS =====
app.use(notFound);
app.use(errorHandler);

module.exports = app;
