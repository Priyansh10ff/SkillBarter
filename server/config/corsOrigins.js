const env = require("./env");

// Origins allowed to call the API and open a socket.
// Production accepts only the real client; local dev also allows Vite's ports.
const corsOrigins =
  env.NODE_ENV === "production" ? [env.CLIENT_URL] : [...new Set([env.CLIENT_URL, "http://localhost:5173", "http://localhost:3000"])];

module.exports = corsOrigins;
