// Thin wrapper around Socket.IO so services can push events without
// knowing about Express or the HTTP server.
let io = null;

const setIO = (instance) => {
  io = instance;
};

const emitToUser = (userId, event, payload) => {
  if (io && userId) io.to(String(userId)).emit(event, payload);
};

module.exports = { setIO, emitToUser };
