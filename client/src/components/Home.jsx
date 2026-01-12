import { useEffect, useState, useContext } from "react";
import axios from "axios";
import AuthContext from "../context/AuthContext";
import { useNotification } from "../context/NotificationContext";
import { motion } from "framer-motion"; // eslint-disable-line no-unused-vars
import { Search, Clock, ArrowRight, Sparkles, Zap, BookOpen, User } from "lucide-react";
import Hero3D from "./Hero3D";
import toast from "react-hot-toast";

const Home = () => {
  const [listings, setListings] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const { user, refreshUser } = useContext(AuthContext);
  const { addNotification } = useNotification();

  useEffect(() => {
    const fetchListings = async () => {
      try {
        const { data } = await axios.get("/api/listings");
        setListings(data);
      } catch (error) { console.error(error); }
    };
    fetchListings();
  }, []);

  const filteredListings = listings.filter(item => {
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
    const matchesSearch = !searchTerm || item.title.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleBook = async (id) => {
    if (!user) return addNotification("Please login to book a class", "error");
    if (user.timeCredits < 1) return addNotification("Insufficient credits! You need at least 1 credit.", "error");
    
    const toastId = toast.loading("Processing booking...");

    try {
      const token = localStorage.getItem("token");
      await axios.post("/api/transactions/book", { listingId: id }, { headers: { Authorization: `Bearer ${token}` } });
      toast.dismiss(toastId);
      addNotification("Booking Confirmed! 1 Credit deducted.", "success");
      refreshUser();
    } catch (err) { 
      toast.dismiss(toastId);
      console.error(err);
      addNotification(err.response?.data?.message || "Booking Failed", "error"); 
    }
  };

  const categories = ["All", "Coding", "Music", "Design", "Language", "Lifestyle"];

  return (
    <div className="min-h-screen bg-[#020617] pb-20 overflow-x-hidden">

      {/* 1. HERO SECTION */}
      <div className="relative overflow-hidden min-h-[600px] flex items-center">
        {/* Animated Background Noise & Blobs */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10"></div>
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-indigo-600/20 blur-[120px] rounded-full animate-pulse"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-purple-600/20 blur-[100px] rounded-full"></div>

        <div className="container mx-auto px-6 pt-24 relative z-10 grid lg:grid-cols-2 gap-16 items-center">
          <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-indigo-300 font-mono text-xs mb-6 backdrop-blur-md">
              <Zap size={12} className="text-yellow-400 fill-yellow-400" /> DECENTRALIZED SKILL ECONOMY
            </div>

            <h1 className="text-6xl md:text-8xl font-black text-white mb-6 leading-[0.9] tracking-tighter">
              Knowledge <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
                Unchained.
              </span>
            </h1>
            <p className="text-slate-400 text-lg mb-10 max-w-lg leading-relaxed font-light">
              Trade your expertise for time. No currency, no fees—just a pure peer-to-peer exchange of value.
            </p>

            {/* Glass Search Bar */}
            <div className="bg-white/5 backdrop-blur-xl p-2 rounded-2xl border border-white/10 flex flex-col md:flex-row gap-2 shadow-2xl shadow-indigo-500/10 max-w-xl group hover:border-indigo-500/30 transition-all duration-500">
              <div className="flex-1 flex items-center px-4 bg-black/20 rounded-xl border border-white/5">
                <Search className="text-slate-400 group-hover:text-indigo-400 transition" size={20} />
                <input
                  type="text"
                  placeholder="Search for skills (e.g. React)..."
                  className="bg-transparent w-full p-3 text-white outline-none placeholder-slate-500 font-medium"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select
                className="bg-indigo-600 text-white px-6 py-3 rounded-xl outline-none font-bold hover:bg-indigo-500 transition cursor-pointer appearance-none text-center"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                {categories.map(c => <option key={c} value={c} className="text-black">{c}</option>)}
              </select>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 1.2, type: "spring" }}
            className="hidden lg:block h-[500px]"
          >
            <Hero3D />
          </motion.div>
        </div>
      </div>

      {/* 2. NEON GRID SECTION */}
      <div className="container mx-auto px-6 -mt-10 relative z-20">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredListings.length > 0 ? filteredListings.map((listing, i) => (
            <motion.div
              key={listing._id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -10, scale: 1.02 }}
              className="group relative bg-[#0f172a]/80 backdrop-blur-md rounded-[2rem] border border-white/5 overflow-hidden hover:border-indigo-500/50 transition-all duration-500"
            >
              {/* Glowing Hover Effect behind card */}
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 via-purple-600/5 to-transparent opacity-0 group-hover:opacity-100 transition duration-700"></div>

              <div className="p-8 relative z-10 flex flex-col h-full">
                {/* Header: Category & Duration */}
                <div className="flex justify-between items-start mb-6">
                  <span className="bg-white/5 border border-white/10 text-indigo-300 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm group-hover:bg-indigo-500 group-hover:text-white transition-colors duration-300">
                    {listing.category}
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-400 text-xs font-bold bg-black/20 px-3 py-1.5 rounded-lg">
                    <Clock size={12} className="text-indigo-400" /> {listing.duration} MIN
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-white mb-3 leading-tight group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-indigo-400 group-hover:to-purple-400 transition-all duration-300">
                    {listing.title}
                  </h3>
                  <p className="text-slate-400 text-sm leading-relaxed line-clamp-3 mb-6 font-medium">
                    {listing.description}
                  </p>
                </div>

                {/* Footer: Teacher & Action */}
                <div className="flex items-center justify-between pt-6 border-t border-white/5 mt-auto">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 p-[2px]">
                      <div className="w-full h-full bg-[#0f172a] rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {listing.teacher?.name?.[0]}
                      </div>
                    </div>
                    <div>
                      <span className="block text-white text-sm font-bold">{listing.teacher?.name}</span>
                      <span className="block text-slate-500 text-[10px] uppercase tracking-wider font-bold">Instructor</span>
                    </div>
                  </div>

                  {user?._id !== listing.teacher?._id ? (
                    <button
                      onClick={() => handleBook(listing._id)}
                      className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:bg-indigo-500 hover:text-white transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_20px_rgba(99,102,241,0.6)]"
                    >
                      <ArrowRight size={20} />
                    </button>
                  ) : (
                    <span className="text-xs font-bold text-indigo-400 bg-indigo-400/10 px-3 py-1 rounded-full border border-indigo-400/20">
                      YOU
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          )) : (
            <div className="col-span-full py-20 text-center">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-600">
                <BookOpen size={32} />
              </div>
              <p className="text-slate-500 text-lg">No classes found matching your criteria.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;