import { useState, useContext } from "react";
import AuthContext from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion"; // eslint-disable-line no-unused-vars
import { Mail, Lock, LogIn } from "lucide-react";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate("/");
    } catch (error) {
      console.error("Login Error:", error);
      alert(error.response?.data?.message || error.message || "Login Failed");
    }
  };

  return (
    <div className="min-h-screen flex bg-[#0f172a] text-white">
      {/* Left Visual */}
      <div className="hidden lg:flex w-1/2 items-center justify-center relative overflow-hidden bg-gradient-to-br from-indigo-900 to-slate-900">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10"></div>
        <div className="relative z-10 text-center px-10">
          <h1 className="text-5xl font-black mb-4">Welcome Back.</h1>
          <p className="text-indigo-200 text-lg">Continue your journey in the skill economy.</p>
        </div>
        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/50 to-transparent"></div>
      </div>

      {/* Right Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-[#0f172a]">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md"
        >
          <div className="mb-8">
            <h2 className="text-3xl font-bold">Sign In</h2>
            <p className="text-slate-400 mt-2">Enter your credentials to access your wallet.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative">
              <Mail className="absolute left-4 top-3.5 text-slate-500" size={18} />
              <input type="email" placeholder="Email" className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-3 pl-12 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
                value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-3.5 text-slate-500" size={18} />
              <input type="password" placeholder="Password" className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-3 pl-12 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
                value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-indigo-500/20 transition flex items-center justify-center gap-2">
              <LogIn size={18} /> Sign In
            </button>
          </form>
          <p className="mt-6 text-center text-slate-500">
            No account? <Link to="/register" className="text-indigo-400 font-bold hover:underline">Register</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};
export default Login;