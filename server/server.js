require("dotenv").config();
const env = require("./config/env");

const http = require("http");
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const app = require("./app");
const initSockets = require("./sockets");
const attachPeerServer = require("./config/peerServer");
const { setIO } = require("./services/realtime");
const { startAutoReleaseJob } = require("./jobs/autoRelease");

process.on("unhandledRejection", (reason) => console.error("Unhandled promise rejection:", reason));

const start = async () => {
  await connectDB();

  const server = http.createServer(app);
  const io = initSockets(server);
  setIO(io);
  attachPeerServer(app, server);

  server.listen(env.PORT, () => {
    console.log(`Server running on port ${env.PORT} (${env.NODE_ENV})`);
  });

  const job = startAutoReleaseJob();

  // Render sends SIGTERM on deploys and restarts: finish in-flight work, then exit
  let stopping = false;
  const shutdown = async (signal) => {
    if (stopping) return;
    stopping = true;
    console.log(`${signal} received, shutting down`);
    job.stop();
    const force = setTimeout(() => process.exit(1), 10_000).unref();
    io.close(); // disconnects sockets and closes the http server
    server.closeIdleConnections?.();
    await new Promise((resolve) => server.close(() => resolve()));
    await mongoose.disconnect();
    clearTimeout(force);
    process.exit(0);
  };
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
};

start();
