import { useEffect, useState, useContext } from "react";
import axios from "axios";
import AuthContext from "../context/AuthContext";
import moment from "moment";
import { motion } from "framer-motion"; // eslint-disable-line no-unused-vars
import { Trash2, Calendar, Zap, Layers, Award, Clock } from "lucide-react";
import toast from "react-hot-toast";

const Profile = () => {
  const { user, refreshUser } = useContext(AuthContext); 
  const [myListings, setMyListings] = useState([]);
  const [preferredHours, setPreferredHours] = useState("");
  const [isEditingHours, setIsEditingHours] = useState(false);
  



  useEffect(() => {
    const fetchMyListings = async () => {
      try {
        const token = localStorage.getItem("token");
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const { data } = await axios.get("/api/listings/my", config);
        setMyListings(data);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load listings");
      } 
    };
    fetchMyListings();
  }, []);

  const handleUpdateProfile = async () => {
    if (preferredHours.length > 50) return toast.error("Preference too long (max 50 chars)");

    try {
        const token = localStorage.getItem("token");
        await axios.put("/api/users/profile", { preferredHours }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        toast.success("Profile updated!");
        setIsEditingHours(false);
        refreshUser(); 
    } catch (error) {
        console.error(error);
        toast.error("Update failed");
    }
  };

  if (!user) return <div className="min-h-screen flex items-center justify-center bg-[#020617] text-white">Loading Profile...</div>;

  const handleDelete = async (id) => {
    toast((t) => (
      <div className="flex flex-col gap-2">
        <span className="font-bold">Delete this listing?</span>
        <div className="flex gap-2">
          <button
            onClick={() => {
              performDelete(id);
              toast.dismiss(t.id);
            }}
            className="bg-red-500 text-white px-3 py-1 rounded text-sm"
          >
            Yes, Delete
          </button>
          <button onClick={() => toast.dismiss(t.id)} className="bg-gray-600 text-white px-3 py-1 rounded text-sm">Cancel</button>
        </div>
      </div>
    ), { duration: 5000 });
  };

  const performDelete = async (id) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`/api/listings/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setMyListings(myListings.filter(l => l._id !== id));
      toast.success("Listing deleted successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete.");
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-[#020617] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pt-28 pb-20 px-6">
      <div className="container mx-auto max-w-5xl">

        {/* HERO PROFILE CARD */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative bg-[#0f172a]/80 backdrop-blur-xl rounded-[2.5rem] p-6 md:p-12 overflow-hidden border border-white/5 shadow-2xl"
        >
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] -mr-20 -mt-20"></div>

          <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 md:gap-12">
            <div className="relative group">
              <div className="w-32 h-32 bg-gray-900 rounded-full flex items-center justify-center text-5xl font-black text-white border-4 border-white/10 shadow-xl">
                {user?.name.charAt(0)}
              </div>
            </div>

            <div className="text-center md:text-left flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-bold mb-3">
                <Award size={12} /> LEVEL 1 TRADER
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-white mb-2">{user?.name}</h1>
              <p className="text-slate-400 text-lg mb-6">{user?.email}</p>

              <div className="flex flex-wrap justify-center md:justify-start gap-4">
                <div className="flex items-center gap-2 bg-indigo-500/10 px-4 py-2 rounded-xl border border-indigo-500/20">
                  <Zap size={18} className="text-yellow-400 fill-yellow-400" />
                  <span className="text-white font-mono font-bold">{user?.timeCredits} CREDITS</span>
                </div>
                <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl border border-white/10">
                  <Calendar size={16} className="text-slate-400" />
                  <span className="text-slate-300 text-sm font-medium">Joined {moment(user?.createdAt).format("MMM YYYY")}</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* STATS & BADGES GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {/* STATS */}
            <motion.div variants={itemVariants} className="bg-[#0f172a]/60 backdrop-blur-xl p-6 md:p-8 rounded-3xl border border-white/5">
                <h3 className="text-2xl font-black text-white mb-6 flex items-center gap-2">
                    <Award className="text-yellow-500" /> Statistics
                </h3>
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 p-4 rounded-2xl">
                        <div className="text-slate-400 text-xs font-bold uppercase mb-1">Classes Attended</div>
                        <div className="text-3xl font-black text-white">{user?.stats?.classesAttended || 0}</div>
                    </div>
                    <div className="bg-white/5 p-4 rounded-2xl">
                        <div className="text-slate-400 text-xs font-bold uppercase mb-1">Classes Taught</div>
                        <div className="text-3xl font-black text-white">{user?.stats?.classesTaught || 0}</div>
                    </div>
                </div>
            </motion.div>

            {/* PREFERENCES */}
            <motion.div variants={itemVariants} className="bg-[#0f172a]/60 backdrop-blur-xl p-6 md:p-8 rounded-3xl border border-white/5">
                <h3 className="text-2xl font-black text-white mb-6 flex items-center gap-2">
                    <Clock className="text-indigo-500" /> Availability
                </h3>
                <div className="space-y-4">
                    <div className="text-slate-400 text-sm">Set your preferred teaching/learning hours to help others schedule with you.</div>
                    {isEditingHours ? (
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                value={preferredHours} 
                                onChange={(e) => setPreferredHours(e.target.value)} 
                                className="flex-1 bg-slate-800 text-white p-3 rounded-xl border border-white/10 focus:border-indigo-500 outline-none"
                                placeholder="e.g. Weekdays 6PM - 9PM"
                            />
                            <button onClick={handleUpdateProfile} className="bg-green-600 text-white px-4 rounded-xl font-bold">Save</button>
                        </div>
                    ) : (
                        <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/10">
                            <span className="text-white font-mono">{user?.preferredHours || "No preference set"}</span>
                            <button onClick={() => setIsEditingHours(true)} className="text-indigo-400 text-sm font-bold hover:text-white">Edit</button>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>

        {/* BADGES */}
        {user?.badges?.length > 0 && (
            <motion.div variants={itemVariants} className="mb-12">
                <h3 className="text-2xl font-black text-white mb-6">Earned Badges</h3>
                <div className="flex gap-4 flex-wrap">
                    {user.badges.map((badge, idx) => (
                        <div key={idx} className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 p-4 rounded-2xl border border-yellow-500/30 flex items-center gap-3">
                            <span className="text-2xl">{badge.icon}</span>
                            <div>
                                <div className="text-white font-bold">{badge.name}</div>
                                <div className="text-yellow-200/50 text-xs">{moment(badge.dateEarned).format("MMM YYYY")}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </motion.div>
        )}

        {/* LISTINGS MANAGEMENT */}
        <h2 className="text-2xl font-black text-white mb-6 flex items-center gap-2 mt-12">
          <Layers className="text-indigo-500" /> Manage Inventory
        </h2>

        <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid md:grid-cols-2 gap-6">
          {myListings.length > 0 ? myListings.map((listing) => (
            <motion.div
              key={listing._id}
              variants={itemVariants}
              whileHover={{ y: -5 }}
              className="bg-[#1e293b]/50 backdrop-blur-sm p-8 rounded-[2rem] border border-white/5 relative group overflow-hidden hover:border-indigo-500/30 transition duration-300"
            >
              <div className="flex justify-between items-start mb-4">
                <span className="bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-lg text-xs font-black uppercase">
                  {listing.category}
                </span>
                <button
                  onClick={() => handleDelete(listing._id)}
                  className="w-10 h-10 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center hover:bg-red-500 hover:text-white transition"
                >
                  <Trash2 size={18} />
                </button>
              </div>

              <h3 className="text-2xl font-bold text-white mb-2">{listing.title}</h3>
              <div className="flex items-center gap-4 text-slate-400 text-sm font-medium mb-6">
                <span className="flex items-center gap-1"><Clock size={14} /> {listing.duration} mins</span>
                <span className="flex items-center gap-1"><Calendar size={14} /> {moment(listing.createdAt).format("MMM Do")}</span>
              </div>
            </motion.div>
          )) : (
            <div className="col-span-full py-20 text-center text-slate-500">
              <p>No listings found.</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Profile;