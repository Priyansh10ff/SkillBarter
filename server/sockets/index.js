const { Server } = require("socket.io");
const corsOrigins = require("../config/corsOrigins");
const { userFromToken } = require("../middleware/auth");
const { userRoom } = require("../services/realtime");
const { registerRoomHandlers } = require("./roomHandlers");

const initSockets = (httpServer) => {
  const io = new Server(httpServer, {
    cors: { origin: corsOrigins, methods: ["GET", "POST"] },
  });

  // Every connection must carry a valid token: io(url, { auth: { token } })
  io.use(async (socket, next) => {
    try {
      const user = await userFromToken(socket.handshake.auth?.token);
      socket.data.userId = String(user._id);
      next();
    } catch {
      next(new Error("unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    socket.join(userRoom(socket.data.userId));
    registerRoomHandlers(io, socket);
  });

  return io;
};

module.exports = initSockets;
