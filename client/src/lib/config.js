// Base URL for REST calls. Empty means same origin:
// the Vite dev proxy (local) or the Vercel rewrite (production) forwards /api to the server.
export const API_URL = import.meta.env.VITE_API_URL || "";

// Socket.IO and PeerJS connect directly to the server.
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";
