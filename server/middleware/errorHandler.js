const env = require("../config/env");

// 404 for unknown routes
const notFound = (req, res) => {
  res.status(404).json({ message: `Not found: ${req.method} ${req.originalUrl}` });
};

// Every thrown error (sync or async, Express 5 catches both) ends up here.
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let status = err.statusCode || err.status || 500;
  let message = err.message || "Server error";
  const details = err.details;

  if (err.name === "CastError") {
    status = 400;
    message = "Invalid id";
  } else if (err.code === 11000) {
    status = 409;
    message = "That already exists";
  } else if (err.name === "ValidationError") {
    status = 400;
    message = Object.values(err.errors)[0]?.message || "Invalid data";
  } else if (err.type === "entity.parse.failed") {
    message = "Invalid JSON body";
  }

  if (status >= 500) {
    console.error(err);
    if (env.NODE_ENV === "production") message = "Server error";
  }

  // string error codes let the client react to specific errors
  const code = typeof err.code === "string" ? err.code : undefined;
  res.status(status).json({ message, ...(code ? { code } : {}), ...(details ? { details } : {}) });
};

module.exports = { notFound, errorHandler };
