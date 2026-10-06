/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useEffect, useContext } from 'react';
import { io } from 'socket.io-client';
import { AuthContext } from './AuthContext';
import { useNotification } from './NotificationContext';
import { SOCKET_URL } from '../lib/config';
import { formatHours } from '../lib/format';

const SocketContext = createContext();

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { user, refreshUser } = useContext(AuthContext); 
  const { addNotification } = useNotification();


  useEffect(() => {
    // Only connect if user is authenticated
    if (user && user._id) {
      const newSocket = io(SOCKET_URL, {
        query: { userId: user._id },
        transports: ['websocket'] // Optional: Forces websocket for better performance
      });

      newSocket.on("credit_update", (newCredits) => {
        refreshUser();
        addNotification(`Balance updated: ${formatHours(newCredits)}`, 'success');
      });

      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSocket(newSocket);

      return () => newSocket.close();
    } else {
      setSocket(null);
    }
  }, [user, refreshUser, addNotification]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};