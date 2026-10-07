// Where the API server lives. One setting for REST, Socket.IO and PeerJS.
//   development: http://localhost:5000 (REST still goes through the Vite proxy)
//   production:  your Render URL, set as VITE_SERVER_URL in the Vercel dashboard
const SERVER_URL = (import.meta.env.VITE_SERVER_URL || "").replace(/\/+$/, "");

if (import.meta.env.PROD && !SERVER_URL) {
  console.error("VITE_SERVER_URL is not set. Set it to the API server's URL in your hosting dashboard and redeploy.");
}

export const API_URL = import.meta.env.DEV ? "" : SERVER_URL;
export const SOCKET_URL = SERVER_URL || "http://localhost:5000";
