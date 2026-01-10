import { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { Trophy, Medal, Star } from "lucide-react";

const Leaderboard = () => {
  const [leaders, setLeaders] = useState([]);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        // Public endpoint, no auth needed technically, but if protected, use token
        const { data } = await axios.get("http://localhost:5000/api/users/leaderboard");
        setLeaders(data);
      } catch (error) {
        console.error("Failed to fetch leaderboard", error);
      }
    };
    fetchLeaderboard();
  }, []);

  return (
    <div className="min-h-screen bg-[#020617] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pt-28 pb-20 px-6">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-xs font-black uppercase mb-4">
              <Trophy size={14} /> Top Performers
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white mb-4">Leaderboard</h1>
            <p className="text-slate-400">Recognizing the most dedicated teachers in our community.</p>
        </div>

        <div className="bg-[#0f172a]/60 backdrop-blur-xl rounded-3xl border border-white/5 overflow-hidden">
            <div className="grid grid-cols-12 gap-4 p-6 border-b border-white/5 text-slate-400 text-xs font-bold uppercase tracking-wider">
                <div className="col-span-2 text-center">Rank</div>
                <div className="col-span-6">User</div>
                <div className="col-span-4 text-right">Classes Taught</div>
            </div>

            <div className="divide-y divide-white/5">
                {leaders.map((user, index) => (
                    <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        key={user._id} 
                        className="grid grid-cols-12 gap-4 p-6 items-center hover:bg-white/5 transition-colors"
                    >
                        <div className="col-span-2 flex justify-center">
                            {index === 0 ? <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-black font-bold"><Trophy size={16} /></div> :
                             index === 1 ? <div className="w-8 h-8 bg-slate-300 rounded-full flex items-center justify-center text-black font-bold">2</div> :
                             index === 2 ? <div className="w-8 h-8 bg-amber-700 rounded-full flex items-center justify-center text-black font-bold">3</div> :
                             <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-white font-bold">{index + 1}</div>
                            }
                        </div>
                        <div className="col-span-6 flex items-center gap-4">
                            <div>
                                <div className="text-white font-bold text-lg">{user.name}</div>
                                <div className="flex gap-2 mt-1">
                                    {user.badges?.map((b, idx) => (
                                        <span key={idx} title={b.name} className="text-lg">{b.icon}</span>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="col-span-4 text-right">
                            <div className="text-2xl font-black text-indigo-400">{user.stats?.classesTaught || 0}</div>
                        </div>
                    </motion.div>
                ))}
            </div>
            
            {leaders.length === 0 && (
                <div className="p-12 text-center text-slate-500">
                    No data available yet. Start teaching to climb the ranks!
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
