/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../api/client";
import { AuthContext } from "./AuthContext";
import { useSocket } from "./SocketContext";

const NotificationContext = createContext(null);

export const useNotification = () => useContext(NotificationContext);

// Notifications live on the server; new ones arrive over the socket.
export const NotificationProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const { socket } = useSocket();
  const [state, setState] = useState({ items: [], unread: 0 });
  const userId = user?._id;

  useEffect(() => {
    if (!userId) return;
    let alive = true;
    api
      .get("/api/notifications")
      .then(({ data }) => alive && setState(data))
      .catch(() => {});
    return () => {
      alive = false;
      setState({ items: [], unread: 0 });
    };
  }, [userId]);

  useEffect(() => {
    if (!socket) return;
    const onNotification = (n) => {
      setState((s) => ({ items: [n, ...s.items].slice(0, 30), unread: s.unread + 1 }));
      toast(n.message, { duration: 5000 });
    };
    socket.on("notification", onNotification);
    return () => socket.off("notification", onNotification);
  }, [socket]);

  const markRead = useCallback(async (id) => {
    setState((s) => ({
      items: s.items.map((n) => (n._id === id ? { ...n, read: true } : n)),
      unread: Math.max(0, s.unread - (s.items.find((n) => n._id === id && !n.read) ? 1 : 0)),
    }));
    await api.put(`/api/notifications/${id}/read`).catch(() => {});
  }, []);

  const markAllRead = useCallback(async () => {
    setState((s) => ({ items: s.items.map((n) => ({ ...n, read: true })), unread: 0 }));
    await api.put("/api/notifications/read-all").catch(() => {});
  }, []);

  return (
    <NotificationContext.Provider value={{ notifications: state.items, unreadCount: state.unread, markRead, markAllRead }}>
      {children}
    </NotificationContext.Provider>
  );
};
