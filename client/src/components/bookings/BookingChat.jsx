import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import api from "../../api/client";
import { useSocket } from "../../context/SocketContext";
import { apiError, fromNow } from "../../lib/format";
import { Button, Input, cx } from "../ui";

// Messages between learner and teacher on one booking, live over the socket
// fill: stretch to the parent's height (session room side panel)
export const BookingChat = ({ bookingId, userId, fill = false }) => {
  const { socket } = useSocket();
  const [messages, setMessages] = useState(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef(null);

  useEffect(() => {
    let alive = true;
    api
      .get(`/api/bookings/${bookingId}/messages`)
      .then(({ data }) => alive && setMessages(data))
      .catch(() => alive && setMessages([]));
    return () => {
      alive = false;
    };
  }, [bookingId]);

  useEffect(() => {
    if (!socket) return;
    const onMessage = (m) => {
      if (m.booking !== bookingId) return;
      setMessages((prev) => (prev && !prev.some((x) => x._id === m._id) ? [...prev, m] : prev));
    };
    socket.on("message:new", onMessage);
    return () => socket.off("message:new", onMessage);
  }, [socket, bookingId]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages]);

  const send = async (e) => {
    e.preventDefault();
    const body = draft.trim();
    if (!body) return;
    setSending(true);
    try {
      const { data } = await api.post(`/api/bookings/${bookingId}/messages`, { body });
      setMessages((prev) => (prev.some((x) => x._id === data._id) ? prev : [...prev, data]));
      setDraft("");
    } catch (error) {
      toast.error(apiError(error, "Message not sent"));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={cx("border border-line rounded bg-bg", fill && "flex h-full flex-col")}>
      <div ref={listRef} className={cx("overflow-y-auto p-3 space-y-3", fill ? "min-h-0 flex-1" : "max-h-64")} aria-live="polite">
        {messages === null ? (
          <p className="text-sm text-faint">Loading…</p>
        ) : messages.length === 0 ? (
          <p className="text-sm text-muted">No messages yet. Use this to agree on details before the session.</p>
        ) : (
          messages.map((m) => {
            const mine = m.sender?._id === userId;
            return (
              <div key={m._id} className={cx("max-w-[85%]", mine && "ml-auto text-right")}>
                <p className="font-mono text-2xs text-faint">
                  {mine ? "You" : m.sender?.name} · {fromNow(m.createdAt)}
                </p>
                <p className={cx("mt-0.5 inline-block text-left text-sm rounded px-2.5 py-1.5 whitespace-pre-line", mine ? "bg-raised text-ink" : "border border-line text-ink")}>
                  {m.body}
                </p>
              </div>
            );
          })
        )}
      </div>
      <form onSubmit={send} className="flex gap-2 border-t border-line p-2">
        <Input aria-label="Message" maxLength={1000} value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Write a message" className="h-8 text-sm" />
        <Button size="sm" type="submit" loading={sending} disabled={!draft.trim()}>
          Send
        </Button>
      </form>
    </div>
  );
};
