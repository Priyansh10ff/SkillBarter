const { Server } = require("socket.io");
const mongoose = require("mongoose");
const corsOrigins = require("../config/corsOrigins");
const { userFromToken } = require("../middleware/auth");
const { userRoom } = require("../services/realtime");
const { BOOKING_STATUS } = require("../config/constants");

const sessionRoom = (bookingId) => `room:${bookingId}`;

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
    const { userId } = socket.data;
    socket.join(userRoom(userId));

    // Session room: only the learner or teacher of a scheduled booking may join
    socket.on("join_room", async (bookingId) => {
      if (!mongoose.isValidObjectId(bookingId)) return;
      const Booking = mongoose.model("Booking");
      const booking = await Booking.findById(bookingId).select("learner teacher status");
      const allowed =
        booking &&
        booking.status === BOOKING_STATUS.SCHEDULED &&
        [String(booking.learner), String(booking.teacher)].includes(userId);
      if (allowed) socket.join(sessionRoom(bookingId));
      else socket.emit("room:denied", { bookingId });
    });

    const inRoom = (roomId) => socket.rooms.has(sessionRoom(roomId));

    socket.on("draw", ({ roomId, data } = {}) => {
      if (inRoom(roomId)) socket.to(sessionRoom(roomId)).emit("draw", data);
    });

    socket.on("call_user", ({ roomId, ...payload } = {}) => {
      if (inRoom(roomId)) socket.to(sessionRoom(roomId)).emit("call_user", payload);
    });
  });

  return io;
};

module.exports = initSockets;
