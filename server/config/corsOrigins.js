// Origins allowed to call the API and open a socket.
const corsOrigins = [
  process.env.CLIENT_URL,
  "http://localhost:5173",
  "http://localhost:3000",
].filter(Boolean);

module.exports = corsOrigins;
