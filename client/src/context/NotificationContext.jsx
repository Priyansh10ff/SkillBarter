import React, { createContext, useState, useContext, useCallback } from 'react';
import toast from 'react-hot-toast';

// eslint-disable-next-line react-refresh/only-export-components
const NotificationContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  const addNotification = useCallback((message, type = 'success') => {
    // trigger toast
    if (type === 'error') {
      toast.error(message);
    } else if (type === 'success') {
      toast.success(message);
    } else {
      toast(message);
    }

    // add to history
    const newNotification = {
      id: Date.now() + Math.random().toString(36).substr(2, 9),
      message,
      type,
      timestamp: new Date(),
      read: false,
    };

    setNotifications((prev) => [newNotification, ...prev]);
  }, []);

  const markAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const toggleNotificationCenter = () => setIsOpen(!isOpen);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearNotifications,
        unreadCount,
        isOpen,
        toggleNotificationCenter,
        setIsOpen
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
