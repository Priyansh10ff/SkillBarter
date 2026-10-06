import { useCallback, useEffect, useRef, useState } from "react";
import Peer from "peerjs";
import { SOCKET_URL } from "../../lib/config";

const peerOptions = (iceServers) => {
  const url = new URL(SOCKET_URL);
  const secure = url.protocol === "https:";
  return {
    host: url.hostname,
    port: Number(url.port || (secure ? 443 : 80)),
    secure,
    path: "/peerjs",
    config: { iceServers },
  };
};

/**
 * One 1:1 call per room. To avoid both sides calling at once, only the learner
 * places calls (when the teacher is already there, or when they arrive);
 * the teacher answers. Presence comes from the socket room.
 *
 * status: "joining" | "waiting" | "connecting" | "connected" | "error"
 */
export const usePeerCall = ({ info, localStream, socket, onBoard }) => {
  const [remoteStream, setRemoteStream] = useState(null);
  const [status, setStatus] = useState("joining");
  const [sharing, setSharing] = useState(null); // screen MediaStream while sharing
  const callRef = useRef(null);
  const onBoardRef = useRef(onBoard);

  useEffect(() => {
    onBoardRef.current = onBoard;
  }, [onBoard]);

  useEffect(() => {
    // wait for the socket and for the media prompt to settle (null = no media)
    if (!socket || localStream === undefined) return;
    const { bookingId } = info;
    const isCaller = info.role === "learner";
    const peer = new Peer(info.me.peerId, peerOptions(info.iceServers));
    let retry = null;
    let closed = false;

    const attach = (call) => {
      callRef.current?.close();
      callRef.current = call;
      call.on("stream", (remote) => {
        setRemoteStream(remote);
        setStatus("connected");
      });
      call.on("close", () => {
        if (callRef.current !== call) return;
        callRef.current = null;
        setRemoteStream(null);
        setStatus("waiting");
      });
    };

    const callOther = () => {
      if (closed) return;
      setStatus("connecting");
      attach(peer.call(info.other.peerId, localStream || new MediaStream()));
    };

    peer.on("call", (call) => {
      call.answer(localStream || undefined);
      attach(call);
    });
    peer.on("error", (err) => {
      // the other side's peer isn't registered yet: try once more shortly
      if (err.type === "peer-unavailable" && isCaller) {
        setStatus("waiting");
        retry = setTimeout(callOther, 2000);
      } else if (err.type !== "peer-unavailable") {
        console.error("Peer error", err);
        setStatus("error");
      }
    });

    const onJoined = () => (isCaller ? callOther() : setStatus("connecting"));
    const onLeft = () => {
      callRef.current?.close();
      callRef.current = null;
      setRemoteStream(null);
      setStatus("waiting");
    };
    socket.on("room:peer-joined", onJoined);
    socket.on("room:peer-left", onLeft);

    peer.on("open", () => {
      socket.emit("room:join", { bookingId }, (res) => {
        if (!res?.ok) return setStatus("error");
        onBoardRef.current?.(res.strokes);
        if (res.others.length && isCaller) callOther();
        else setStatus(res.others.length ? "connecting" : "waiting");
      });
    });

    return () => {
      closed = true;
      clearTimeout(retry);
      socket.off("room:peer-joined", onJoined);
      socket.off("room:peer-left", onLeft);
      socket.emit("room:leave", { bookingId });
      callRef.current?.close();
      callRef.current = null;
      peer.destroy();
    };
  }, [socket, info, localStream]);

  // Screen share swaps the outgoing video track; the call itself stays up
  const videoSender = () => callRef.current?.peerConnection?.getSenders().find((s) => s.track?.kind === "video");

  const stopShare = useCallback(async () => {
    const camTrack = localStream?.getVideoTracks()[0];
    if (camTrack) await videoSender()?.replaceTrack(camTrack);
    setSharing((current) => {
      current?.getTracks().forEach((t) => t.stop());
      return null;
    });
  }, [localStream]);

  const startShare = useCallback(async () => {
    const screen = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
    const track = screen.getVideoTracks()[0];
    await videoSender()?.replaceTrack(track);
    track.onended = stopShare; // the browser's own "Stop sharing" button
    setSharing(screen);
  }, [stopShare]);

  // stop any share when leaving
  useEffect(() => () => sharing?.getTracks().forEach((t) => t.stop()), [sharing]);

  return { remoteStream, status, sharing, startShare, stopShare };
};
