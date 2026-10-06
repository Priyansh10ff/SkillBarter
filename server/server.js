require("dotenv").config();
const env = require("./config/env");

const http = require("http");
const connectDB = require("./config/db");
const app = require("./app");
const initSockets = require("./sockets");
const attachPeerServer = require("./config/peerServer");
const { setIO } = require("./services/realtime");
const { startAutoReleaseJob } = require("./jobs/autoRelease");

const start = async () => {
  await connectDB();

  const server = http.createServer(app);
  setIO(initSockets(server));
  attachPeerServer(app, server);

  server.listen(env.PORT, () => {
    console.log(`Server running on port ${env.PORT} (${env.NODE_ENV})`);
  });

  startAutoReleaseJob();
};

start();
