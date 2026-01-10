import { useEffect, useRef, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import Peer from "peerjs";
import { Mic, MicOff, Video, VideoOff, PhoneOff, Monitor, Edit3 } from "lucide-react";
import { useSocket } from "../context/SocketContext";
import toast from "react-hot-toast";

const VideoRoom = () => {
   const { id: transactionId } = useParams();
   const { socket } = useSocket();

   const [status, setStatus] = useState("Initializing...");
   const [callStatus, setCallStatus] = useState("IDLE"); // IDLE, CALLING, IN_CALL
   const [micOn, setMicOn] = useState(true);
   const [camOn, setCamOn] = useState(true);
   const [whiteboardOpen, setWhiteboardOpen] = useState(false);

   const myVideoRef = useRef();
   const remoteVideoRef = useRef();
   const peerRef = useRef();
   const canvasRef = useRef(null);

   const drawOnCanvas = useCallback((x, y, color, emit) => {
      if (!canvasRef.current) return;
      const ctx = canvasRef.current.getContext('2d');
      ctx.beginPath();
      ctx.arc(x, y, 2, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();

      if (emit && socket) {
         socket.emit("draw", { roomId: transactionId, data: { x, y, color } });
      }
   }, [socket, transactionId]);

   useEffect(() => {
      const role = new URLSearchParams(window.location.search).get("role");
      if (!role || !socket) return;

      // Join Socket Room for Whiteboard
      socket.emit("join_room", transactionId);

      // Initialize Peer
      const myId = `${transactionId}-${role}`;
      const peer = new Peer(myId);
      peerRef.current = peer;

      peer.on("open", () => {
         setStatus(`System Online. You are: ${role}`);

         navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
            myVideoRef.current.srcObject = stream;

            // Listen for Incoming Peer Calls
            peer.on("call", (call) => {
               // Auto-answer for simplicity in this demo, or add "Accept" UI here
               call.answer(stream);
               call.on("stream", (remoteStream) => {
                  remoteVideoRef.current.srcObject = remoteStream;
                  setCallStatus("IN_CALL");
                  setStatus("Connected.");
               });
            });

            // Socket Logic for Ringing (Visual only since PeerJS handles stream)
            socket.on("call_user", () => {
               toast("Incoming Call!", { icon: '📞' });
            });

            // Whiteboard Sync
            socket.on("draw", (data) => {
               drawOnCanvas(data.x, data.y, data.color, false);
            });
         });
      });

      return () => {
         peer.destroy();
         socket.off("draw");
         socket.off("call_user");
      };
   }, [transactionId, socket, drawOnCanvas]);

   // Initiate Call
   const startCall = () => {
      const role = new URLSearchParams(window.location.search).get("role");
      const targetId = role === 'student' ? `${transactionId}-teacher` : `${transactionId}-student`;

      // Notify via socket (Ringing)
      socket.emit("call_user", { userToCall: targetId, from: role });
      setStatus("Calling...");

      // PeerJS Call
      const stream = myVideoRef.current.srcObject;
      const call = peerRef.current.call(targetId, stream);
      call.on("stream", (remoteStream) => {
         remoteVideoRef.current.srcObject = remoteStream;
         setCallStatus("IN_CALL");
         setStatus("Connected.");
      });
   };

   // Screen Share
   const shareScreen = () => {
      navigator.mediaDevices.getDisplayMedia({ cursor: true }).then(screenStream => {
         const videoTrack = screenStream.getVideoTracks()[0];
         // Replace track in peer connection (Simplified: just show local for now)
         myVideoRef.current.srcObject = screenStream;
         videoTrack.onended = () => {
            navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(cam => myVideoRef.current.srcObject = cam);
         };
      });
   };

   // Whiteboard Logic
   const startDrawing = (e) => {
      if (!whiteboardOpen) return;
      const canvas = canvasRef.current;
      canvas.isDrawing = true;
      const rect = canvas.getBoundingClientRect();
      canvas.lastX = e.clientX - rect.left;
      canvas.lastY = e.clientY - rect.top;
   };

   const draw = (e) => {
      if (!canvasRef.current.isDrawing) return;
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      drawOnCanvas(x, y, '#fff', true);
      canvas.lastX = x;
      canvas.lastY = y;
   };

   const stopDrawing = () => canvasRef.current.isDrawing = false;

   return (
      <div className="h-screen bg-black overflow-hidden relative font-mono text-white">
         {/* HUD HEADER */}
         <div className="absolute top-0 w-full p-4 flex justify-between bg-black/60 backdrop-blur z-20">
            <div className="flex items-center gap-4">
               <span className={`w-3 h-3 rounded-full ${callStatus === 'IN_CALL' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
               <span className="text-xs font-bold tracking-widest">{status}</span>
            </div>
            <button onClick={startCall} className="bg-green-600 px-4 py-1 rounded text-xs font-bold">CALL PARTNER</button>
         </div>

         {/* VIDEO GRID */}
         <div className="flex h-full">
            <div className={`flex-1 relative ${whiteboardOpen ? 'w-1/2' : 'w-full'} transition-all`}>
               <video ref={remoteVideoRef} autoPlay className="w-full h-full object-cover" />
               <div className="absolute bottom-4 left-4 bg-black/50 px-2 rounded text-xs">REMOTE</div>
            </div>

            {whiteboardOpen && (
               <div className="flex-1 bg-gray-900 border-l border-gray-700 relative cursor-crosshair">
                  <canvas
                     ref={canvasRef}
                     width={800} height={600}
                     className="w-full h-full"
                     onMouseDown={startDrawing}
                     onMouseMove={draw}
                     onMouseUp={stopDrawing}
                  />
                  <div className="absolute top-4 left-4 text-xs text-gray-500">WHITEBOARD ACTIVE</div>
               </div>
            )}
         </div>

         {/* PIP */}
         <div className="absolute top-20 right-4 w-48 h-32 bg-gray-800 border border-gray-600 rounded-lg overflow-hidden shadow-2xl z-30">
            <video ref={myVideoRef} autoPlay muted className="w-full h-full object-cover" />
         </div>

         {/* CONTROLS */}
         <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-4 z-40">
            <button onClick={() => setMicOn(!micOn)} className={`p-4 rounded-full backdrop-blur-md border ${micOn ? 'bg-white/10' : 'bg-red-500 text-white'}`}>{micOn ? <Mic /> : <MicOff />}</button>
            <button onClick={() => setCamOn(!camOn)} className={`p-4 rounded-full backdrop-blur-md border ${camOn ? 'bg-white/10' : 'bg-red-500 text-white'}`}>{camOn ? <Video /> : <VideoOff />}</button>
            <button onClick={shareScreen} className="p-4 rounded-full bg-indigo-600/80 backdrop-blur-md"><Monitor /></button>
            <button onClick={() => setWhiteboardOpen(!whiteboardOpen)} className={`p-4 rounded-full backdrop-blur-md ${whiteboardOpen ? 'bg-indigo-500' : 'bg-white/10'}`}><Edit3 /></button>
            <button onClick={() => window.close()} className="p-4 rounded-full bg-red-600 hover:bg-red-700"><PhoneOff /></button>
         </div>
      </div>
   );
};

export default VideoRoom;