import { useCallback, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { useNotification } from "../../context/NotificationContext";
import { useDismiss } from "../../hooks/useDismiss";
import { fromNow } from "../../lib/format";
import { cx } from "../ui";

const TONE = { success: "bg-ok", error: "bg-bad", info: "bg-muted" };

export const NotificationBell = () => {
  const { notifications, unreadCount, markAllAsRead, clearNotifications } = useNotification();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(ref, open, close);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
        aria-expanded={open}
        className="relative flex h-9 w-9 items-center justify-center rounded text-muted hover:text-ink hover:bg-raised"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 min-w-4 h-4 px-1 rounded-sm bg-ink text-bg font-mono text-[10px] leading-4 text-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 w-80 max-w-[calc(100vw-2rem)] bg-surface border border-line rounded z-50">
          <div className="flex items-center justify-between border-b border-line px-3 h-10">
            <span className="label-mono">Notifications</span>
            <div className="flex gap-3 text-xs">
              <button type="button" onClick={markAllAsRead} className="text-muted hover:text-ink">
                Mark read
              </button>
              <button type="button" onClick={clearNotifications} className="text-muted hover:text-ink">
                Clear
              </button>
            </div>
          </div>
          <ul className="max-h-80 overflow-y-auto divide-y divide-line">
            {notifications.length === 0 ? (
              <li className="px-3 py-8 text-center text-sm text-muted">Nothing new.</li>
            ) : (
              notifications.map((n) => (
                <li key={n.id} className={cx("flex gap-3 px-3 py-3", !n.read && "bg-raised")}>
                  <span className={cx("mt-2 h-1.5 w-1.5 shrink-0 rounded-full", TONE[n.type] || TONE.info)} />
                  <div className="min-w-0">
                    <p className="text-sm text-ink leading-snug">{n.message}</p>
                    <p className="mt-1 font-mono text-2xs text-faint">{fromNow(n.timestamp)}</p>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
};
