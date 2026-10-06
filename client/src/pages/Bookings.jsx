import { useCallback, useContext, useEffect, useState } from "react";
import { CalendarClock, Video } from "lucide-react";
import toast from "react-hot-toast";
import api from "../api/client";
import AuthContext from "../context/AuthContext";
import { useConfirm } from "../context/ConfirmContext";
import { useSocket } from "../context/SocketContext";
import dayjs from "../lib/date";
import { BOOKING_STATUS as S } from "../lib/constants";
import { apiError, formatDateTime, formatDuration } from "../lib/format";
import { Avatar, Button, EmptyState, Hours, Input, PageHeader, Segmented, SkeletonRows, StatusTag } from "../components/ui";

const FILTERS = [
  { value: "ALL", label: "All" },
  { value: "LEARNING", label: "Learning" },
  { value: "TEACHING", label: "Teaching" },
];

const BookingCard = ({ booking: b, userId, onAction }) => {
  const [date, setDate] = useState("");
  const learning = b.learner?._id === userId;
  const other = learning ? b.teacher : b.learner;
  const myProposal = b.proposal?.by === userId;
  const started = b.scheduledAt && dayjs(b.scheduledAt).isBefore(dayjs());
  const canCancel = b.status === S.PENDING || (b.status === S.SCHEDULED && !started);

  return (
    <li className="p-4 md:p-5 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <Avatar name={other?.name} />
          <div className="min-w-0">
            <h3 className="font-medium text-ink">{b.listingSnapshot?.title}</h3>
            <p className="text-sm text-muted">
              {learning ? "Learning from" : "Teaching"} {other?.name} · {formatDuration(b.listingSnapshot?.duration)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 sm:flex-col sm:items-end sm:gap-1">
          <StatusTag status={b.status} />
          <span className="font-mono text-2xs text-faint">
            <Hours value={b.creditCost} tone="muted" /> {b.status === S.COMPLETED ? "paid" : [S.CANCELLED].includes(b.status) ? "refunded" : "held"}
          </span>
        </div>
      </div>

      {b.status === S.PENDING && (
        <div className="border border-line rounded bg-bg p-3 space-y-3">
          {b.proposal?.date ? (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm">
                <span className="text-muted">{myProposal ? "You proposed" : `${other?.name} proposed`}</span>{" "}
                <span className="font-mono text-ink">{formatDateTime(b.proposal.date)}</span>
              </p>
              {myProposal ? (
                <span className="text-sm text-muted">Waiting for {other?.name}</span>
              ) : (
                <Button size="sm" variant="primary" onClick={() => onAction(b._id, "accept", {}, "Session scheduled")}>
                  Accept time
                </Button>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted">No time yet. Propose one and {other?.name} can accept it.</p>
          )}
          <form
            className="flex flex-col gap-2 sm:flex-row"
            onSubmit={(e) => {
              e.preventDefault();
              if (!date) return toast.error("Pick a date and time first");
              onAction(b._id, "propose", { date: new Date(date).toISOString() }, "Time proposed").then(() => setDate(""));
            }}
          >
            <Input type="datetime-local" aria-label="Proposed time" value={date} onChange={(e) => setDate(e.target.value)} className="h-8 text-sm sm:w-64" />
            <Button size="sm" type="submit">
              {b.proposal?.date ? "Suggest another time" : "Propose time"}
            </Button>
          </form>
        </div>
      )}

      {b.scheduledAt && b.status !== S.CANCELLED && (
        <p className="flex items-center gap-2 text-sm">
          <CalendarClock size={14} className="text-muted" />
          <span className="font-mono">{formatDateTime(b.scheduledAt)}</span>
        </p>
      )}
      {b.status === S.DISPUTED && <p className="text-sm text-bad">Reported: {b.dispute?.reason}. Credits are frozen until it's reviewed.</p>}
      {b.status === S.CANCELLED && b.cancelReason && <p className="text-sm text-muted">Reason: {b.cancelReason}</p>}

      <div className="flex flex-wrap gap-2">
        {b.status === S.SCHEDULED && (
          <Button size="sm" variant="primary" to={`/room/${b._id}?role=${learning ? "student" : "teacher"}`} target="_blank" rel="noreferrer">
            <Video size={14} /> Join room
          </Button>
        )}
        {b.status === S.SCHEDULED && learning && started && (
          <>
            <Button size="sm" onClick={() => onAction(b._id, "complete", {}, "Credits released", { kind: "complete", other })}>
              Confirm it happened
            </Button>
            <Button size="sm" variant="danger" onClick={() => onAction(b._id, "dispute", {}, "Problem reported", { kind: "dispute" })}>
              Report a problem
            </Button>
          </>
        )}
        {canCancel && (
          <Button size="sm" variant="ghost" onClick={() => onAction(b._id, "cancel", {}, "Booking cancelled", { kind: "cancel", learning })}>
            {b.status === S.PENDING && !learning ? "Decline" : "Cancel"}
          </Button>
        )}
      </div>
    </li>
  );
};

const Bookings = () => {
  const { user, refreshUser } = useContext(AuthContext);
  const { socket } = useSocket();
  const confirm = useConfirm();
  const [bookings, setBookings] = useState(null);
  const [filter, setFilter] = useState("ALL");

  const load = useCallback(async () => {
    try {
      const { data } = await api.get("/api/bookings");
      setBookings(data);
    } catch (error) {
      toast.error(apiError(error, "Couldn't load bookings"));
      setBookings([]);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch on mount; state is set after the request
    load();
  }, [load]);

  useEffect(() => {
    if (!socket) return;
    socket.on("booking:update", load);
    return () => socket.off("booking:update", load);
  }, [socket, load]);

  // Some actions need a confirmation or a reason first
  const ask = async (opts) => {
    if (opts.kind === "cancel") {
      const ok = await confirm({
        title: opts.learning ? "Cancel this booking?" : "Decline this booking?",
        body: "The held credits go back to the learner straight away.",
        confirmLabel: opts.learning ? "Cancel booking" : "Decline",
        tone: "danger",
      });
      return ok ? {} : null;
    }
    if (opts.kind === "complete") {
      const ok = await confirm({
        title: "Confirm the session happened?",
        body: `${opts.other?.name} receives the held credits. This can't be undone.`,
        confirmLabel: "Release credits",
      });
      return ok ? {} : null;
    }
    if (opts.kind === "dispute") {
      const reason = await confirm({
        title: "Report a problem",
        body: "The credits stay frozen until someone reviews it.",
        input: { label: "What went wrong?", minLength: 5, placeholder: "e.g. the teacher didn't join" },
        confirmLabel: "Report",
        tone: "danger",
      });
      return reason ? { reason } : null;
    }
    return {};
  };

  const onAction = async (id, action, body, success, opts) => {
    const extra = opts ? await ask(opts) : {};
    if (extra === null) return;
    try {
      await api.post(`/api/bookings/${id}/${action}`, { ...body, ...extra });
      toast.success(success);
      await Promise.all([load(), refreshUser()]);
    } catch (error) {
      toast.error(apiError(error));
    }
  };

  const visible = (bookings || []).filter((b) => {
    const learning = b.learner?._id === user?._id;
    if (filter === "LEARNING") return learning;
    if (filter === "TEACHING") return !learning;
    return true;
  });

  return (
    <>
      <PageHeader
        eyebrow="Your sessions"
        title="Bookings"
        description="Agree on a time, meet in the room, then confirm it happened so the hours move."
        actions={<Segmented label="Filter bookings" options={FILTERS} value={filter} onChange={setFilter} />}
      />

      {bookings === null ? (
        <SkeletonRows rows={3} />
      ) : visible.length === 0 ? (
        <EmptyState
          title={filter === "TEACHING" ? "Nobody has booked you yet." : "No bookings yet."}
          action={filter === "TEACHING" ? <Button to="/create-listing">Post a skill</Button> : <Button to="/">Browse sessions</Button>}
        >
          {filter === "TEACHING" ? "Post a skill so learners can find you." : "Book a session and it will show up here."}
        </EmptyState>
      ) : (
        <ul className="border border-line rounded divide-y divide-line">
          {visible.map((b) => (
            <BookingCard key={b._id} booking={b} userId={user?._id} onAction={onAction} />
          ))}
        </ul>
      )}
    </>
  );
};

export default Bookings;
