// Thin wrapper around Socket.IO so services can push events without
// knowing about Express or the HTTP server.
let io = null;

const setIO = (instance) => {
  io = instance;
};

// Every authenticated socket joins user:<id> on connect
const userRoom = (userId) => `user:${userId}`;

const emitToUser = (userId, event, payload) => {
  if (io && userId) io.to(userRoom(String(userId?._id ?? userId))).emit(event, payload);
};

module.exports = { setIO, emitToUser, userRoom };
