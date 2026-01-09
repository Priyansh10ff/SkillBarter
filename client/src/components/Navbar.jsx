import { useContext } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import { motion } from "framer-motion";
import { LayoutGrid, Plus, LogOut, User, Zap } from "lucide-react";

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
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
              <Link to="/profile" className={`nav-link ${location.pathname === '/profile' ? 'active' : ''}`}>
                Profile
              </Link>
              
              <div className="h-6 w-px bg-white/10 mx-3"></div>

              <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full mr-3">
                <Zap size={14} className="text-yellow-400 fill-yellow-400" />
                <span className="text-white font-mono font-bold text-sm">{user.timeCredits} CR</span>
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