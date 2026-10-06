const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");
const mongoose = require("mongoose");
const corsOrigins = require("./config/corsOrigins");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const app = express();

// ===== MIDDLEWARE =====
app.use(helmet());
app.use(compression());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(express.json({ limit: "100kb" }));
app.use(cors({ origin: corsOrigins, credentials: true }));

// ===== HEALTH =====
app.get("/health", (req, res) => {
  const db = mongoose.connection.readyState === 1 ? "connected" : "disconnected";
  const ok = db === "connected";
  res.status(ok ? 200 : 503).json({ status: ok ? "ok" : "degraded", db });
});

// ===== ROUTES =====
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/listings", require("./routes/listingRoutes"));
app.use("/api/transactions", require("./routes/transactionRoutes"));

// ===== ERRORS =====
app.use(notFound);
app.use(errorHandler);

module.exports = app;
