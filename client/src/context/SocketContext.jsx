/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useEffect, useContext } from 'react';
import { io } from 'socket.io-client';
import { AuthContext } from './AuthContext';
import { useNotification } from './NotificationContext';

const SocketContext = createContext();

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { user, refreshUser } = useContext(AuthContext); 
  const { addNotification } = useNotification();

  // Define the server URL: Use the Env Variable if available, otherwise localhost
  // Use the live URL as the default fallback so it works immediately on deployment
  const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'https://skillbarter-yew1.onrender.com';

  useEffect(() => {
    // Only connect if user is authenticated
    if (user && user._id) {
      console.log("Connecting to socket at:", SERVER_URL); // Debugging log

      const newSocket = io(SERVER_URL, {
        query: { userId: user._id },
        transports: ['websocket'] // Optional: Forces websocket for better performance
      });

      newSocket.on("credit_update", (newCredits) => {
        refreshUser();
        addNotification(`Credits updated! Balance: ${newCredits} CR`, 'success');
      });

      setSocket(newSocket);

      return () => newSocket.close();
    } else {
      setSocket(null);
    }
  }, [user, SERVER_URL, refreshUser, addNotification]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};