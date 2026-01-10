/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useEffect, useContext } from 'react';
import { io } from 'socket.io-client';
import { AuthContext } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { user } = useContext(AuthContext); 

  // Define the server URL: Use the Env Variable if available, otherwise localhost
  const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';

  useEffect(() => {
    // Only connect if user is authenticated
    if (user) {
      console.log("Connecting to socket at:", SERVER_URL); // Debugging log

      const newSocket = io(SERVER_URL, {
        query: { userId: user._id },
        transports: ['websocket'] // Optional: Forces websocket for better performance
      });

      setSocket(newSocket);

      return () => newSocket.close();
    } else {
      setSocket(null);
    }
  }, [user, SERVER_URL]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};