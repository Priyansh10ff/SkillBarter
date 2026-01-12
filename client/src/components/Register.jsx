import { useState, useContext } from "react";
import AuthContext from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion"; // eslint-disable-line no-unused-vars
import { User, Mail, Lock, Zap, ArrowRight } from "lucide-react";

const Register = () => {
  const [formData, setFormData] = useState({ name: "", email: "", password: "", skills: "" });
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await register(formData.name, formData.email, formData.password, formData.skills.split(','));
      navigate("/");
    } catch (error) {
      console.error("Registration Error:", error);
      alert(error.response?.data?.message || error.message || "Registration Failed");
    }
  };

  return (
    <div className="min-h-screen flex bg-[#0f172a] text-white">
      <div className="hidden lg:flex w-1/2 items-center justify-center bg-gradient-to-br from-slate-900 to-indigo-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10"></div>
        <div className="relative z-10 px-12">
          <h1 className="text-5xl font-black mb-6 leading-tight">Your Skills <br />Have Value.</h1>
          <div className="flex items-center gap-4 bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10 max-w-sm">
            <div className="bg-yellow-500/20 p-3 rounded-lg"><Zap className="text-yellow-400" /></div>
            <div>
              <h3 className="font-bold">2 Free Credits</h3>
              <p className="text-slate-400 text-sm">Given upon registration.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="w-full max-w-md">
          <h2 className="text-3xl font-bold mb-2">Create Account</h2>
          <p className="text-slate-400 mb-8">Join the network today.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <User className="absolute left-4 top-3.5 text-slate-500" size={18} />
              <input type="text" placeholder="Full Name" className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-3 pl-12 text-white outline-none focus:border-indigo-500 transition"
                onChange={e => setFormData({ ...formData, name: e.target.value })} required />
            </div>
            <div className="relative">
              <Mail className="absolute left-4 top-3.5 text-slate-500" size={18} />
              <input type="email" placeholder="Email" className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-3 pl-12 text-white outline-none focus:border-indigo-500 transition"
                onChange={e => setFormData({ ...formData, email: e.target.value })} required />
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-3.5 text-slate-500" size={18} />
              <input type="password" placeholder="Password" className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-3 pl-12 text-white outline-none focus:border-indigo-500 transition"
                onChange={e => setFormData({ ...formData, password: e.target.value })} required />
            </div>
            <div className="relative">
              <Zap className="absolute left-4 top-3.5 text-slate-500" size={18} />
              <input type="text" placeholder="Skills (comma separated)" className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-3 pl-12 text-white outline-none focus:border-indigo-500 transition"
                onChange={e => setFormData({ ...formData, skills: e.target.value })} />
            </div>
            <button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-4 rounded-xl font-bold mt-4 shadow-lg shadow-indigo-500/20 transition flex items-center justify-center gap-2">
              Get Started <ArrowRight size={18} />
            </button>
          </form>
          <p className="mt-6 text-center text-slate-500">
            Member? <Link to="/login" className="text-indigo-400 font-bold hover:underline">Log In</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};
export default Register;