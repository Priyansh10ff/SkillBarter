const { Server } = require("socket.io");
const corsOrigins = require("../config/corsOrigins");

const initSockets = (httpServer) => {
  const io = new Server(httpServer, {
    cors: { origin: corsOrigins, methods: ["GET", "POST"] },
  });

  io.on("connection", (socket) => {
    // Personal room so the server can push updates to one user
    const { userId } = socket.handshake.query;
    if (userId) socket.join(userId);

    // Session room (whiteboard + call signalling)
    socket.on("join_room", (roomId) => {
      socket.join(roomId);
    });

    socket.on("draw", ({ roomId, data }) => {
      socket.to(roomId).emit("draw", data);
    });

    socket.on("call_user", ({ roomId, ...payload } = {}) => {
      if (roomId) socket.to(roomId).emit("call_user", payload);
    });
  });

  return io;
};

module.exports = initSockets;
