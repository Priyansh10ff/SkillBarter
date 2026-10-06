import { useCallback, useEffect, useState } from "react";

/**
 * Camera + mic for the room. stream is undefined while asking, null if the
 * browser refused (the call still works receive-only).
 */
export const useLocalMedia = () => {
  const [stream, setStream] = useState(undefined);
  const [error, setError] = useState("");
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);

  useEffect(() => {
    let alive = true;
    let acquired = null;
    navigator.mediaDevices
      ?.getUserMedia({ video: { width: { ideal: 1280 }, height: { ideal: 720 } }, audio: { echoCancellation: true, noiseSuppression: true } })
      .then((s) => {
        acquired = s;
        if (alive) setStream(s);
        else s.getTracks().forEach((t) => t.stop());
      })
      .catch((err) => {
        if (!alive) return;
        setError(err.name === "NotAllowedError" ? "Camera and mic are blocked. Allow them in the browser to be seen and heard." : "No camera or mic found. You can still watch, listen and use the board.");
        setStream(null);
      });
    if (!navigator.mediaDevices) Promise.resolve().then(() => alive && (setError("This browser can't use a camera here (needs HTTPS)."), setStream(null)));
    return () => {
      alive = false;
      acquired?.getTracks().forEach((t) => t.stop()); // releases the camera light
    };
  }, []);

  const toggleMic = useCallback(() => {
    stream?.getAudioTracks().forEach((t) => (t.enabled = !t.enabled));
    setMicOn((on) => !on);
  }, [stream]);

  const toggleCam = useCallback(() => {
    stream?.getVideoTracks().forEach((t) => (t.enabled = !t.enabled));
    setCamOn((on) => !on);
  }, [stream]);

  return { stream, error, micOn, camOn, toggleMic, toggleCam };
};
