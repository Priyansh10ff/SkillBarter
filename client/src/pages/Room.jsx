import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Mic, MicOff, Monitor, MonitorOff, MessageSquare, PenLine, PhoneOff, Video, VideoOff } from "lucide-react";
import toast from "react-hot-toast";
import api from "../api/client";
import AuthContext from "../context/AuthContext";
import { useConfirm } from "../context/ConfirmContext";
import { useSocket } from "../context/SocketContext";
import { apiError, formatDateTime } from "../lib/format";
import { Button, Spinner, cx } from "../components/ui";
import { BookingChat } from "../components/bookings/BookingChat";
import { useLocalMedia } from "../components/room/useLocalMedia";
import { usePeerCall } from "../components/room/usePeerCall";
import { Whiteboard } from "../components/room/Whiteboard";
import { SessionTimer } from "../components/room/SessionTimer";
import { VideoTile } from "../components/room/VideoTile";

const STATUS = {
  joining: { text: "Joining", dot: "bg-faint" },
  waiting: { text: "Waiting for", dot: "bg-faint" },
  connecting: { text: "Connecting to", dot: "bg-warn" },
  connected: { text: "Connected with", dot: "bg-ok" },
  error: { text: "Connection problem", dot: "bg-bad" },
};

const ControlButton = ({ label, active = true, danger, onClick, children, pressed }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={label}
    title={label}
    aria-pressed={pressed}
    className={cx(
      "h-11 min-w-11 px-3 flex items-center justify-center gap-2 rounded text-sm transition-colors",
      danger ? "bg-bad text-bg hover:bg-bad/90" : active ? "text-ink hover:bg-raised" : "bg-bad/15 text-bad hover:bg-bad/25",
      pressed && "bg-raised"
    )}
  >
    {children}
  </button>
);

const SessionRoom = ({ info }) => {
  const { user } = useContext(AuthContext);
  const { socket } = useSocket();
  const confirm = useConfirm();
  const navigate = useNavigate();
  const media = useLocalMedia();
  const boardRef = useRef(null);
  const [boardOpen, setBoardOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  const onBoard = useCallback((strokes) => boardRef.current?.load(strokes), []);
  const call = usePeerCall({ info, localStream: media.stream, socket, onBoard });

  useEffect(() => {
    if (media.error) toast.error(media.error, { duration: 6000 });
  }, [media.error]);

  const leave = () => navigate(`/bookings#${info.bookingId}`);

  const clearBoard = async () => {
    const ok = await confirm({ title: "Clear the whiteboard?", body: `This clears it for ${info.other.name} too.`, confirmLabel: "Clear", tone: "danger" });
    if (!ok) return;
    boardRef.current?.clear();
    socket?.emit("wb:clear", { bookingId: info.bookingId });
  };

  const toggleShare = async () => {
    try {
      if (call.sharing) await call.stopShare();
      else await call.startShare();
    } catch (err) {
      if (err?.name !== "NotAllowedError") toast.error("Couldn't share your screen");
    }
  };

  const status = STATUS[call.status];
  const localView = call.sharing || media.stream;

  return (
    <div className="flex h-dvh flex-col bg-bg text-ink">
      {/* top bar */}
      <header className="flex h-12 shrink-0 items-center gap-3 border-b border-line px-3 md:px-4">
        <Link to={`/bookings#${info.bookingId}`} className="flex h-8 w-8 items-center justify-center rounded text-muted hover:text-ink hover:bg-raised" aria-label="Back to bookings">
          <ArrowLeft size={16} />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{info.title}</p>
          <p className="flex min-w-0 items-center gap-1.5 label-mono" aria-live="polite">
            <span className={cx("h-1.5 w-1.5 rounded-full", status.dot)} aria-hidden="true" />
            <span className="truncate">
              {status.text} {["waiting", "connecting", "connected"].includes(call.status) && info.other.name}
            </span>
          </p>
        </div>
        <SessionTimer scheduledAt={info.scheduledAt} durationMinutes={info.durationMinutes} />
      </header>

      <div className="flex min-h-0 flex-1">
        {/* stage */}
        <main className={cx("relative min-w-0 flex-1 p-2 md:p-3", boardOpen ? "grid gap-2 md:gap-3 grid-rows-[1fr_auto] lg:grid-rows-1 lg:grid-cols-[minmax(0,1fr)_260px]" : "flex")}>
          <section aria-label="Whiteboard" className={cx("min-h-0", !boardOpen && "hidden")}>
            <Whiteboard ref={boardRef} socket={socket} bookingId={info.bookingId} onClear={clearBoard} />
          </section>

          <div className={cx(boardOpen ? "grid grid-cols-2 gap-2 lg:grid-cols-1 lg:content-start" : "relative flex-1")}>
            <VideoTile
              stream={call.remoteStream}
              name={info.other.name}
              label={info.other.name}
              className={boardOpen ? "aspect-video" : "h-full w-full"}
            />
            {!call.remoteStream && !boardOpen && (
              <p className="pointer-events-none absolute inset-x-0 bottom-16 text-center text-muted">
                {call.status === "error" ? "Couldn't connect. Leave and rejoin the room." : `Waiting for ${info.other.name} to join. They'll appear here.`}
              </p>
            )}
            {/* own preview: in the column next to the board, or floating top-right over their video */}
            <div className={boardOpen ? "" : "absolute right-3 top-3 z-10 w-36 md:w-56"}>
              <VideoTile
                stream={localView}
                name={user.name}
                label={call.sharing ? "Your screen" : "You"}
                muted
                mirrored={!call.sharing}
                showVideo={Boolean(call.sharing) || media.camOn}
                className="aspect-video"
              />
            </div>
          </div>
        </main>

        {/* chat */}
        {chatOpen && (
          <aside className="fixed inset-x-0 bottom-16 top-12 z-20 flex flex-col border-l border-line bg-bg p-3 md:static md:w-80 md:shrink-0" aria-label="Chat">
            <div className="mb-2 flex items-center justify-between">
              <span className="label-mono">Chat with {info.other.name}</span>
              <button type="button" onClick={() => setChatOpen(false)} className="text-xs text-muted hover:text-ink">
                Close
              </button>
            </div>
            <div className="min-h-0 flex-1">
              <BookingChat bookingId={info.bookingId} userId={user._id} fill />
            </div>
          </aside>
        )}
      </div>

      {/* controls */}
      <nav aria-label="Call controls" className="flex h-16 shrink-0 items-center justify-center gap-1 border-t border-line bg-surface px-2">
        <ControlButton label={media.micOn ? "Mute" : "Unmute"} active={media.micOn || !media.stream} onClick={media.toggleMic}>
          {media.micOn ? <Mic size={18} /> : <MicOff size={18} />}
        </ControlButton>
        <ControlButton label={media.camOn ? "Turn camera off" : "Turn camera on"} active={media.camOn || !media.stream} onClick={media.toggleCam}>
          {media.camOn ? <Video size={18} /> : <VideoOff size={18} />}
        </ControlButton>
        <ControlButton label={call.sharing ? "Stop sharing" : "Share screen"} onClick={toggleShare} pressed={Boolean(call.sharing)}>
          {call.sharing ? <MonitorOff size={18} /> : <Monitor size={18} />}
          <span className="hidden sm:inline">{call.sharing ? "Stop" : "Share"}</span>
        </ControlButton>
        <ControlButton label={boardOpen ? "Hide whiteboard" : "Show whiteboard"} onClick={() => setBoardOpen((o) => !o)} pressed={boardOpen}>
          <PenLine size={18} />
          <span className="hidden sm:inline">Board</span>
        </ControlButton>
        <ControlButton label={chatOpen ? "Hide chat" : "Show chat"} onClick={() => setChatOpen((o) => !o)} pressed={chatOpen}>
          <MessageSquare size={18} />
          <span className="hidden sm:inline">Chat</span>
        </ControlButton>
        <span className="mx-1 h-6 w-px bg-line" aria-hidden="true" />
        <ControlButton label="Leave room" danger onClick={leave}>
          <PhoneOff size={16} /> <span>Leave</span>
        </ControlButton>
      </nav>
    </div>
  );
};

const RoomGate = ({ title, children }) => (
  <div className="flex min-h-dvh items-center justify-center bg-bg px-4">
    <div className="max-w-sm space-y-4">
      <p className="label-mono">Session room</p>
      <h1 className="text-2xl tracking-tightest">{title}</h1>
      {children}
    </div>
  </div>
);

const Room = () => {
  const { id } = useParams();
  const [state, setState] = useState({ status: "loading" });

  useEffect(() => {
    let alive = true;
    api
      .get(`/api/bookings/${id}/room`)
      .then(({ data }) => alive && setState({ status: "ready", info: data }))
      .catch((err) =>
        alive &&
        setState({
          status: "blocked",
          code: err.response?.data?.code,
          message: apiError(err, "Couldn't open the room"),
          opensAt: err.response?.data?.details?.find((d) => d.field === "opensAt")?.message,
        })
      );
    return () => {
      alive = false;
    };
  }, [id]);

  if (state.status === "loading") {
    return (
      <RoomGate title="Opening the room">
        <p className="flex items-center gap-2 text-muted">
          <Spinner /> Checking your booking.
        </p>
      </RoomGate>
    );
  }

  if (state.status === "blocked") {
    return (
      <RoomGate title={state.code === "ROOM_NOT_OPEN" ? "Not open yet" : "Room closed"}>
        <p className="text-muted">{state.message}</p>
        {state.opensAt && (
          <p className="font-mono text-sm">
            opens <span className="text-accent">{formatDateTime(state.opensAt)}</span>
          </p>
        )}
        <Button to={`/bookings#${id}`}>Back to bookings</Button>
      </RoomGate>
    );
  }

  return <SessionRoom info={state.info} />;
};

export default Room;
