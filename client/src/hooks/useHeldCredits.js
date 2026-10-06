import { useCallback, useContext, useEffect, useState } from "react";
import api from "../api/client";
import AuthContext from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";

// Credits the user has paid into open bookings. Refreshes when bookings change.
export const useHeldCredits = () => {
  const { user } = useContext(AuthContext);
  const { socket } = useSocket();
  const [held, setHeld] = useState(0);
  const userId = user?._id;
  const balance = user?.timeCredits;

  const load = useCallback(async () => {
    if (!userId) return;
    try {
      const { data } = await api.get("/api/wallet", { params: { limit: 1 } });
      setHeld(data.held);
    } catch {
      // non-critical: the nav just won't show held credits
    }
  }, [userId]);

  // refetch whenever the balance changes; load() sets state after the request resolves
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load, balance]);

  useEffect(() => {
    if (!socket) return;
    socket.on("booking:update", load);
    return () => socket.off("booking:update", load);
  }, [socket, load]);

  return userId ? held : 0;
};
