import { useContext } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import { useNotification } from "../context/NotificationContext";
import { motion, AnimatePresence } from "framer-motion"; // eslint-disable-line no-unused-vars
import { LayoutGrid, Plus, LogOut, User, Zap, Bell, X, CheckCircle, AlertCircle, Info } from "lucide-react";
import moment from "moment";

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const { notifications, unreadCount, isOpen, toggleNotificationCenter, markAllAsRead, clearNotifications } = useNotification();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const getIcon = (type) => {
    if (type === 'success') return <CheckCircle size={16} className="text-green-400" />;
    if (type === 'error') return <AlertCircle size={16} className="text-red-400" />;
    return <Info size={16} className="text-blue-400" />;
  };

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 left-0 right-0 z-50 bg-[#0f172a]/80 backdrop-blur-md border-b border-white/10"
    >
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-500/20 group-hover:rotate-12 transition duration-300">
            S
          </div>
          <span className="text-xl font-bold text-white tracking-tight">
            Skill<span className="text-indigo-400">Barter</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {user ? (
            <>
              <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
                Marketplace
              </Link>
              <Link to="/my-transactions" className={`nav-link ${location.pathname === '/my-transactions' ? 'active' : ''}`}>
                Activity
              </Link>
              <Link to="/leaderboard" className={`nav-link ${location.pathname === '/leaderboard' ? 'active' : ''}`}>
                Leaderboard
              </Link>
              <Link to="/profile" className={`nav-link ${location.pathname === '/profile' ? 'active' : ''}`}>
                Profile
              </Link>

              <div className="h-6 w-px bg-white/10 mx-3"></div>

              {/* Credits Display */}
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full mr-2">
                <Zap size={14} className="text-yellow-400 fill-yellow-400" />
                <span className="text-white font-mono font-bold text-sm">{user.timeCredits} CR</span>
              </div>

              {/* Notification Center */}
              <div className="relative mr-2">
                <button 
                  onClick={toggleNotificationCenter} 
                  className="relative p-2 text-gray-400 hover:text-white transition rounded-full hover:bg-white/5"
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-[#0f172a]"></span>
                  )}
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 top-12 w-80 bg-[#1e293b] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50"
                    >
                      <div className="flex items-center justify-between p-3 border-b border-white/10 bg-[#0f172a]/50">
                        <h3 className="font-bold text-sm text-white">Notifications</h3>
                        <div className="flex gap-2">
                          <button onClick={markAllAsRead} className="text-xs text-indigo-400 hover:text-indigo-300">Mark read</button>
                          <button onClick={clearNotifications} className="text-xs text-slate-500 hover:text-slate-400">Clear</button>
                        </div>
                      </div>
                      <div className="max-h-[300px] overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-8 text-center text-slate-500 text-sm">
                            No notifications yet
                          </div>
                        ) : (
                          notifications.map((note) => (
                            <div key={note.id} className={`p-3 border-b border-white/5 hover:bg-white/5 transition flex gap-3 ${!note.read ? 'bg-indigo-500/10' : ''}`}>
                              <div className="mt-1">{getIcon(note.type)}</div>
                              <div className="flex-1">
                                <p className="text-sm text-slate-200 leading-snug">{note.message}</p>
                                <p className="text-xs text-slate-500 mt-1">{moment(note.timestamp).fromNow()}</p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <Link to="/create-listing" className="bg-indigo-600 hover:bg-indigo-500 text-white p-2 rounded-lg transition shadow-lg shadow-indigo-600/20">
                <Plus size={20} />
              </Link>
              <button onClick={handleLogout} className="text-gray-400 hover:text-white p-2 transition">
                <LogOut size={20} />
              </button>
            </>
          ) : (
            <div className="flex gap-4">
              <Link to="/login" className="text-gray-300 hover:text-white font-medium py-2">Login</Link>
              <Link to="/register" className="bg-white text-gray-900 px-5 py-2 rounded-lg font-bold hover:bg-gray-100 transition">Get Started</Link>
            </div>
          )}
        </div>
      </div>
      <style>{`
        .nav-link {
          color: #94a3b8;
          padding: 0.5rem 1rem;
          border-radius: 0.5rem;
          font-weight: 500;
          transition: all 0.2s;
        }
        .nav-link:hover { color: white; background: rgba(255,255,255,0.05); }
        .nav-link.active { color: white; background: rgba(255,255,255,0.1); }
      `}</style>
    </motion.nav>
  );
};

export default Navbar;