const http = require("http");
const { ExpressPeerServer } = require("peer");

/**
 * WebRTC signalling for the session room, on the same port as the API.
 * Clients connect with { path: "/peerjs" }. Media itself goes browser to browser.
 *
 * PeerServer's WebSocket server answers 400 to every upgrade that isn't its own
 * path, which would kill Socket.IO connections on the same server. So it gets a
 * private (never listening) http.Server and we hand it only /peerjs upgrades.
 */
const attachPeerServer = (app, httpServer) => {
  const signalling = http.createServer();
  const peerServer = ExpressPeerServer(signalling, {
    path: "/",
    allow_discovery: false,
    proxied: true, // behind Render's proxy
  });
  app.peerMount.use(peerServer);

  httpServer.on("upgrade", (req, socket, head) => {
    if (req.url.startsWith("/peerjs")) signalling.emit("upgrade", req, socket, head);
  });
  return peerServer;
};

module.exports = attachPeerServer;
