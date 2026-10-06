const env = require("./env");

// Origins allowed to call the API and open a socket.
const corsOrigins = [...new Set([env.CLIENT_URL, "http://localhost:5173", "http://localhost:3000"])];

module.exports = corsOrigins;
