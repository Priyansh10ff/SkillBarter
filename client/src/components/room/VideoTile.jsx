import { useEffect, useRef } from "react";
import { Avatar, cx } from "../ui";

// A <video> bound to a MediaStream, with a name label and a fallback when there's no video
export const VideoTile = ({ stream, name, label, muted = false, mirrored = false, className, showVideo = true }) => {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current && ref.current.srcObject !== stream) ref.current.srcObject = stream || null;
  }, [stream]);

  const hasVideo = showVideo && stream?.getVideoTracks().some((t) => t.readyState === "live");

  return (
    <div className={cx("relative overflow-hidden rounded bg-black border border-line", className)}>
      <video
        ref={ref}
        autoPlay
        playsInline
        muted={muted}
        className={cx("h-full w-full object-cover", mirrored && "-scale-x-100", !hasVideo && "invisible")}
      />
      {!hasVideo && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Avatar name={name} size="lg" />
        </div>
      )}
      <span className="absolute bottom-2 left-2 rounded-sm bg-bg/85 px-1.5 py-0.5 label-mono">{label}</span>
    </div>
  );
};
