import { useEffect, useState, useContext, useCallback } from "react";
import axios from "axios";
import AuthContext from "../context/AuthContext";
import moment from "moment";
import { motion } from "framer-motion"; // eslint-disable-line no-unused-vars
import {
  Video, CheckCircle, Clock, ArrowUpRight, ArrowDownLeft, Activity, CalendarClock
} from "lucide-react";
import toast from "react-hot-toast";

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const { user, refreshUser } = useContext(AuthContext);
  const [filter, setFilter] = useState("ALL");
  const [scheduleDate, setScheduleDate] = useState("");

  const fetchTransactions = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.get("http://localhost:5000/api/transactions/my", { headers: { Authorization: `Bearer ${token}` } });
      setTransactions(data);
    } catch (error) { console.error(error); }
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

  const handleComplete = async (id) => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(`http://localhost:5000/api/transactions/${id}/complete`, {}, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Funds Released!");
      fetchTransactions();
      refreshUser();
    } catch (error) { 
      console.error(error);
      toast.error("Error completing transaction"); 
    }
  };

  const handleSchedule = async (id, action) => {
    if (action === 'PROPOSE' && !scheduleDate) return toast.error("Pick a date first!");

    let reason = "";
    if (action === 'REJECT') {
        reason = prompt("Enter reason for rejection:");
        if (!reason) return; // Cancel if no reason provided
    }

    try {
      const token = localStorage.getItem("token");
      await axios.put(`http://localhost:5000/api/transactions/${id}/schedule`,
        { date: scheduleDate, action, reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (action === 'REJECT') toast.error("Time Rejected");
      else toast.success(action === 'PROPOSE' ? "Time Proposed!" : "Time Accepted!");
      
      fetchTransactions();
    } catch (error) { 
      console.error(error);
      toast.error("Scheduling failed"); 
    }
  };

  const filteredTransactions = transactions.filter(tx => {
    const isSender = tx.sender?._id === user?._id;
    if (filter === "SENT") return isSender;
    if (filter === "RECEIVED") return !isSender;
    return true;
  });

  return (
    <div className="min-h-screen bg-[#020617] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pt-28 pb-20 px-6">
      <div className="container mx-auto max-w-4xl">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-black uppercase mb-4">
              <Activity size={14} /> Live Ledger
            </div>
            <h1 className="text-4xl font-black text-white">Activity Log</h1>
          </div>
          <div className="flex items-center gap-2 bg-white/5 p-1.5 rounded-xl border border-white/10">
            {["ALL", "SENT", "RECEIVED"].map((f) => (
              <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${filter === f ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"}`}>
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* FEED */}
        <div className="space-y-4">
          {filteredTransactions.map((tx, index) => {
            const isSender = tx.sender?._id === user?._id;
            const isPending = tx.status === "PENDING";
            const pendingAcceptance = tx.appointmentStatus === 'PROPOSED';
            const isScheduled = tx.appointmentStatus === 'SCHEDULED';

            return (
              <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}
                key={tx._id}
                className="bg-[#0f172a]/60 backdrop-blur-xl p-6 rounded-2xl border border-white/5 hover:border-indigo-500/30 transition-all"
              >
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Icon */}
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl shrink-0 ${isSender ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>
                    {isSender ? <ArrowUpRight /> : <ArrowDownLeft />}
                  </div>

                  {/* Details */}
                  <div className="flex-1">
                    <h3 className="font-bold text-white text-lg flex items-center gap-2">
                      {isSender ? "Outgoing" : "Incoming"} · {tx.listing?.title}
                    </h3>
                    <div className="text-slate-400 text-sm mt-1 mb-4">
                      with <span className="text-white font-bold">{isSender ? tx.receiver?.name : tx.sender?.name}</span>
                    </div>

                    {/* SCHEDULING UI */}
                    {isPending && (
                      <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                        {isScheduled ? (
                          <div className="flex items-center gap-2 text-green-400 font-bold">
                            <CalendarClock size={16} /> Scheduled: {moment(tx.scheduledDate).format("MMM Do, h:mm a")}
                          </div>
                        ) : (
                          <div className="flex flex-col gap-2">
                            <div className="text-slate-400 text-xs font-bold uppercase">Scheduling Required</div>
                            {pendingAcceptance ? (
                              <div className="flex items-center justify-between">
                                <span className="text-white">Proposed: {moment(tx.proposedDate).format("MMM Do, h:mm a")}</span>
                                {/* Only Receiver can accept */}
                                {tx.proposedBy !== user._id && (
                                  <button onClick={() => handleSchedule(tx._id, 'ACCEPT')} className="bg-green-600 px-3 py-1 rounded text-white text-xs font-bold">Accept</button>
                                )}
                                {tx.proposedBy === user._id && <span className="text-xs text-yellow-500">Waiting for partner...</span>}
                              </div>
                            ) : (
                              <div className="flex gap-2">
                                <input type="datetime-local" className="bg-slate-800 text-white p-2 rounded text-xs" onChange={(e) => setScheduleDate(e.target.value)} />
                                <button onClick={() => handleSchedule(tx._id, 'PROPOSE')} className="bg-indigo-600 px-3 py-1 rounded text-white text-xs font-bold">Propose Time</button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 justify-center">
                    {isPending && isScheduled && (
                      <a href={`/room/${tx._id}?role=${isSender ? 'student' : 'teacher'}`} target="_blank" className="bg-white text-black px-4 py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 hover:bg-indigo-50 transition">
                        <Video size={16} /> Start Call
                      </a>
                    )}
                    {isPending && (
                      <button onClick={() => handleComplete(tx._id)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2">
                        <CheckCircle size={16} /> Release
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Transactions;