import { useContext, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { ArrowLeftRight, Menu, Plus, X } from "lucide-react";
import AuthContext from "../../context/AuthContext";
import { useHeldCredits } from "../../hooks/useHeldCredits";
import { formatHours } from "../../lib/format";
import { Button, Hours, cx } from "../ui";
import { NotificationBell } from "./NotificationBell";
import { UserMenu } from "./UserMenu";

const LINKS = [
  { to: "/", label: "Browse", end: true },
  { to: "/bookings", label: "Bookings", auth: true },
  { to: "/leaderboard", label: "Leaderboard" },
];

const Wordmark = () => (
  <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight text-ink shrink-0">
    <span className="flex h-6 w-6 items-center justify-center rounded-sm bg-accent text-accent-ink">
      <ArrowLeftRight size={14} strokeWidth={2.5} />
    </span>
    Skill Barter
  </Link>
);

// Balance shown as time, with credits held in open bookings underneath
const Balance = ({ className }) => {
  const { user } = useContext(AuthContext);
  const held = useHeldCredits();
  return (
    <Link to="/profile" title="Your balance" className={cx("flex flex-col items-end leading-none px-2 py-1 rounded hover:bg-raised", className)}>
      <Hours value={user.timeCredits} className="text-sm" />
      {held > 0 && <span className="mt-1 font-mono text-2xs text-faint">{formatHours(held)} held</span>}
    </Link>
  );
};

const Navbar = () => {
  const { user } = useContext(AuthContext);
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [lastPath, setLastPath] = useState(location.pathname);

  // close the mobile menu on navigation
  if (lastPath !== location.pathname) {
    setLastPath(location.pathname);
    setMobileOpen(false);
  }

  const links = LINKS.filter((l) => !l.auth || user);

  return (
    <header className="fixed inset-x-0 top-0 z-40 h-14 border-b border-line bg-bg">
      <div className="mx-auto flex h-full max-w-page items-center gap-6 px-4 md:px-6">
        <Wordmark />

        <nav aria-label="Main" className="hidden md:flex h-full items-stretch">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                cx(
                  "flex items-center px-3 text-sm border-b-2 -mb-px transition-colors",
                  isActive ? "border-accent text-ink" : "border-transparent text-muted hover:text-ink"
                )
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1.5">
          {user ? (
            <>
              <Balance className="hidden sm:flex" />
              <NotificationBell />
              <Button size="sm" to="/create-listing" className="hidden md:inline-flex ml-1">
                <Plus size={14} /> Post a skill
              </Button>
              <div className="hidden md:block ml-1">
                <UserMenu />
              </div>
            </>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Button variant="ghost" size="sm" to="/login">
                Log in
              </Button>
              <Button variant="primary" size="sm" to="/register">
                Sign up
              </Button>
            </div>
          )}
          <button
            type="button"
            className="md:hidden flex h-9 w-9 items-center justify-center rounded text-muted hover:text-ink hover:bg-raised"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav aria-label="Mobile" className="md:hidden border-b border-line bg-bg px-4 pb-4">
          {user && (
            <div className="flex items-center justify-between py-3 border-b border-line">
              <span className="label-mono">Balance</span>
              <Balance />
            </div>
          )}
          <ul className="py-2">
            {[...links, ...(user ? [{ to: "/create-listing", label: "Post a skill" }, { to: "/profile", label: "Profile" }, { to: "/settings", label: "Settings" }] : [])].map((l) => (
              <li key={l.to}>
                <NavLink
                  to={l.to}
                  end={l.end}
                  className={({ isActive }) => cx("block py-2.5 text-[15px]", isActive ? "text-ink" : "text-muted")}
                >
                  {l.label}
                </NavLink>
              </li>
            ))}
          </ul>
          {!user && (
            <div className="grid grid-cols-2 gap-2">
              <Button to="/login">Log in</Button>
              <Button variant="primary" to="/register">
                Sign up
              </Button>
            </div>
          )}
        </nav>
      )}
    </header>
  );
};

export default Navbar;
