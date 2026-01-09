import { createContext, useEffect, useRef, useContext } from "react";
import { io } from "socket.io-client";
import AuthContext from "./AuthContext";

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const socket = useRef();

  useEffect(() => {
    if (user) {
      socket.current = io("https://skillbarter-hl6x.onrender.com/");
      socket.current.emit("join_user", user._id);
    }
  }, [user]);

  return (
    <SocketContext.Provider value={socket.current}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext;