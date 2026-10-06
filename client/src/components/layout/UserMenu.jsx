import { useCallback, useContext, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthContext from "../../context/AuthContext";
import { useDismiss } from "../../hooks/useDismiss";
import { Avatar } from "../ui";

export const UserMenu = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(ref, open, close);

  const handleLogout = () => {
    close();
    logout();
    navigate("/login");
  };

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-label="Account menu" aria-expanded={open} className="flex rounded">
        <Avatar name={user.name} size="sm" />
      </button>
      {open && (
        <div className="absolute right-0 top-11 w-56 bg-surface border border-line rounded z-50 py-1">
          <div className="px-3 py-2 border-b border-line mb-1">
            <p className="text-sm text-ink truncate">{user.name}</p>
            <p className="text-xs text-muted truncate">{user.email}</p>
          </div>
          <Link to="/profile" onClick={close} className="block px-3 py-2 text-sm text-muted hover:text-ink hover:bg-raised">
            Profile
          </Link>
          <Link to="/bookings" onClick={close} className="block px-3 py-2 text-sm text-muted hover:text-ink hover:bg-raised">
            Bookings
          </Link>
          <button type="button" onClick={handleLogout} className="block w-full text-left px-3 py-2 text-sm text-muted hover:text-ink hover:bg-raised">
            Log out
          </button>
        </div>
      )}
    </div>
  );
};
