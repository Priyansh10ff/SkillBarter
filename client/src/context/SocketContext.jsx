/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { AuthContext } from "./AuthContext";
import { TOKEN_KEY } from "../api/client";
import { SOCKET_URL } from "../lib/config";

const SocketContext = createContext({ socket: null });

export const useSocket = () => useContext(SocketContext);

// One authenticated socket per logged-in user. Reconnects only when the user changes.
export const SocketProvider = ({ children }) => {
  const { user, refreshUser } = useContext(AuthContext);
  const [socket, setSocket] = useState(null);
  const userId = user?._id;

  useEffect(() => {
    if (!userId) return;
    const s = io(SOCKET_URL, {
      auth: (cb) => cb({ token: localStorage.getItem(TOKEN_KEY) }), // read fresh on every (re)connect
      transports: ["websocket"],
    });
    s.on("credits:update", () => refreshUser());
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the socket is an external system
    setSocket(s);
    return () => {
      s.close();
      setSocket(null);
    };
  }, [userId, refreshUser]);

  return <SocketContext.Provider value={{ socket }}>{children}</SocketContext.Provider>;
};
