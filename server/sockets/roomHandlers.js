// Session room events: presence and the shared whiteboard.
// Video itself goes peer to peer through PeerJS; chat uses the booking messages API.
const mongoose = require("mongoose");
const { checkAccess } = require("../services/roomService");

const roomKey = (bookingId) => `room:${bookingId}`;

// Whiteboard strokes kept in memory so someone joining late sees the board.
// Lost on restart, which is fine for a live session.
const boards = new Map(); // bookingId -> strokes[]
const MAX_STROKES = 3000;
const COLORS = new Set(["#ECEAE3", "#E0604A", "#5FB37A", "#6EA8FE", "#D6A84C"]);

const validStroke = (s) =>
  s &&
  COLORS.has(s.color) &&
  Number.isFinite(s.width) &&
  s.width >= 1 &&
  s.width <= 16 &&
  Array.isArray(s.points) &&
  s.points.length >= 1 &&
  s.points.length <= 500 &&
  s.points.every((p) => Array.isArray(p) && p.length === 2 && p.every((n) => Number.isFinite(n) && n >= 0 && n <= 1));

const registerRoomHandlers = (io, socket) => {
  const { userId } = socket.data;
  const joined = new Set(); // bookingIds this socket is in

  const presentUsers = async (bookingId) => {
    const sockets = await io.in(roomKey(bookingId)).fetchSockets();
    return [...new Set(sockets.map((s) => s.data.userId))];
  };

  // ack({ ok, others, strokes } | { ok: false, message })
  socket.on("room:join", async ({ bookingId } = {}, ack = () => {}) => {
    try {
      if (!mongoose.isValidObjectId(bookingId)) throw new Error("Invalid room");
      await checkAccess(bookingId, userId);
      const others = (await presentUsers(bookingId)).filter((id) => id !== userId);
      socket.join(roomKey(bookingId));
      joined.add(bookingId);
      socket.to(roomKey(bookingId)).emit("room:peer-joined", { userId });
      ack({ ok: true, others, strokes: boards.get(bookingId) || [] });
    } catch (error) {
      ack({ ok: false, message: error.message });
    }
  });

  const leave = (bookingId) => {
    if (!joined.has(bookingId)) return;
    joined.delete(bookingId);
    socket.leave(roomKey(bookingId));
    socket.to(roomKey(bookingId)).emit("room:peer-left", { userId });
  };

  socket.on("room:leave", ({ bookingId } = {}) => leave(bookingId));
  socket.on("disconnect", () => [...joined].forEach(leave));

  socket.on("wb:stroke", ({ bookingId, stroke } = {}) => {
    if (!joined.has(bookingId) || !validStroke(stroke)) return;
    const strokes = boards.get(bookingId) || [];
    strokes.push(stroke);
    if (strokes.length > MAX_STROKES) strokes.splice(0, strokes.length - MAX_STROKES);
    boards.set(bookingId, strokes);
    socket.to(roomKey(bookingId)).emit("wb:stroke", stroke);
  });

  socket.on("wb:clear", ({ bookingId } = {}) => {
    if (!joined.has(bookingId)) return;
    boards.delete(bookingId);
    socket.to(roomKey(bookingId)).emit("wb:clear");
  });
};

module.exports = { registerRoomHandlers, COLORS };
