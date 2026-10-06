// Functional rewire for the new booking API. Visual redesign comes with the design system.
import { useEffect, useState, useContext, useCallback } from "react";
import api from "../api/client";
import AuthContext from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import dayjs from "../lib/date";
import { BOOKING_STATUS as S } from "../lib/constants";
import { Video, CheckCircle, ArrowUpRight, ArrowDownLeft, CalendarClock, XCircle, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";

const STATUS_STYLE = {
  PENDING: "text-yellow-400 border-yellow-400/30",
  SCHEDULED: "text-indigo-300 border-indigo-300/30",
  COMPLETED: "text-green-400 border-green-400/30",
  CANCELLED: "text-slate-400 border-slate-400/30",
  DISPUTED: "text-red-400 border-red-400/30",
};

const errorMessage = (error, fallback) => error.response?.data?.message || fallback;

const Bookings = () => {
  const { user, refreshUser } = useContext(AuthContext);
  const { socket } = useSocket();
  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState("ALL");
  const [dates, setDates] = useState({}); // bookingId -> datetime-local value

  const fetchBookings = useCallback(async () => {
    try {
      const { data } = await api.get("/api/bookings");
      setBookings(data);
    } catch (error) {
      console.error(error);
    }
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  // Refresh when the other person changes a booking
  useEffect(() => {
    if (!socket) return;
    socket.on("booking:update", fetchBookings);
    return () => socket.off("booking:update", fetchBookings);
  }, [socket, fetchBookings]);

  const run = async (id, action, body, success) => {
    try {
      await api.post(`/api/bookings/${id}/${action}`, body);
      toast.success(success);
      fetchBookings();
      refreshUser();
    } catch (error) {
      toast.error(errorMessage(error, "Something went wrong"));
    }
  };

  const propose = (id) => {
    if (!dates[id]) return toast.error("Pick a date and time first");
    run(id, "propose", { date: new Date(dates[id]).toISOString() }, "Time proposed");
  };

  // TODO(design system): replace prompt/confirm with proper dialogs
  const cancel = (id) => {
    if (!window.confirm("Cancel this booking? Held credits go back to the learner.")) return;
    run(id, "cancel", {}, "Booking cancelled");
  };

  const dispute = (id) => {
    const reason = window.prompt("What went wrong? (credits stay frozen until it's reviewed)");
    if (!reason) return;
    run(id, "dispute", { reason }, "Problem reported");
  };

  const visible = bookings.filter((b) => {
    const learning = b.learner?._id === user?._id;
    if (filter === "LEARNING") return learning;
    if (filter === "TEACHING") return !learning;
    return true;
  });

  return (
    <div className="min-h-screen bg-[#020617] pt-28 pb-20 px-6">
      <div className="container mx-auto max-w-4xl">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
          <h1 className="text-4xl font-black text-white">Bookings</h1>
          <div className="flex items-center gap-2 bg-white/5 p-1.5 rounded-xl border border-white/10">
            {["ALL", "LEARNING", "TEACHING"].map((f) => (
              <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${filter === f ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"}`}>
                {f}
              </button>
            ))}
          </div>
        </div>

        {visible.length === 0 && (
          <p className="text-slate-500 text-center py-20">No bookings yet. Book a session from the home page, or post a skill to start teaching.</p>
        )}

        <div className="space-y-4">
          {visible.map((b) => {
            const learning = b.learner?._id === user?._id;
            const other = learning ? b.teacher : b.learner;
            const myProposal = b.proposal?.by === user?._id;
            const started = b.scheduledAt && dayjs(b.scheduledAt).isBefore(dayjs());

            return (
              <div key={b._id} className="bg-[#0f172a]/60 p-6 rounded-2xl border border-white/5">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${learning ? "bg-red-500/10 text-red-500" : "bg-green-500/10 text-green-500"}`}>
                    {learning ? <ArrowUpRight /> : <ArrowDownLeft />}
                  </div>

                  <div className="flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="font-bold text-white text-lg">{b.listingSnapshot?.title}</h3>
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 border rounded ${STATUS_STYLE[b.status]}`}>{b.status}</span>
                    </div>
                    <div className="text-slate-400 text-sm">
                      {learning ? "Learning from" : "Teaching"} <span className="text-white font-bold">{other?.name}</span>
                      {" · "}<span className="font-mono">{b.creditCost} credits</span>
                    </div>

                    {b.status === S.PENDING && (
                      <div className="bg-black/20 p-4 rounded-xl border border-white/5 space-y-3">
                        {b.proposal?.date ? (
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-white text-sm">Proposed: {dayjs(b.proposal.date).format("ddd, MMM D · h:mm A")}</span>
                            {myProposal ? (
                              <span className="text-xs text-yellow-500">Waiting for {other?.name} to accept</span>
                            ) : (
                              <button onClick={() => run(b._id, "accept", {}, "Session scheduled")} className="bg-green-600 px-3 py-1 rounded text-white text-xs font-bold">Accept</button>
                            )}
                          </div>
                        ) : (
                          <div className="text-slate-400 text-xs">No time proposed yet.</div>
                        )}
                        <div className="flex flex-wrap gap-2">
                          <input
                            type="datetime-local"
                            className="bg-slate-800 text-white p-2 rounded text-xs"
                            value={dates[b._id] || ""}
                            onChange={(e) => setDates({ ...dates, [b._id]: e.target.value })}
                          />
                          <button onClick={() => propose(b._id)} className="bg-indigo-600 px-3 py-1 rounded text-white text-xs font-bold">
                            {b.proposal?.date ? "Suggest another time" : "Propose time"}
                          </button>
                        </div>
                      </div>
                    )}

                    {b.scheduledAt && (
                      <div className="flex items-center gap-2 text-sm text-indigo-200">
                        <CalendarClock size={16} /> {dayjs(b.scheduledAt).format("ddd, MMM D · h:mm A")}
                      </div>
                    )}
                    {b.status === S.DISPUTED && <div className="text-red-300 text-sm">Reported: {b.dispute?.reason}. Credits are frozen until it's reviewed.</div>}
                    {b.status === S.CANCELLED && b.cancelReason && <div className="text-slate-500 text-sm">Reason: {b.cancelReason}</div>}
                  </div>

                  <div className="flex flex-col gap-2 justify-center min-w-[150px]">
                    {b.status === S.SCHEDULED && (
                      <a href={`/room/${b._id}?role=${learning ? "student" : "teacher"}`} target="_blank" rel="noreferrer" className="bg-white text-black px-4 py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2">
                        <Video size={16} /> Join room
                      </a>
                    )}
                    {b.status === S.SCHEDULED && learning && started && (
                      <>
                        <button onClick={() => run(b._id, "complete", {}, "Credits released")} className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2">
                          <CheckCircle size={16} /> Confirm done
                        </button>
                        <button onClick={() => dispute(b._id)} className="text-red-300 border border-red-300/30 px-4 py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2">
                          <AlertTriangle size={16} /> Report problem
                        </button>
                      </>
                    )}
                    {(b.status === S.PENDING || (b.status === S.SCHEDULED && !started)) && (
                      <button onClick={() => cancel(b._id)} className="text-slate-300 border border-white/10 px-4 py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2">
                        <XCircle size={16} /> {b.status === S.PENDING && !learning ? "Decline" : "Cancel"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Bookings;
