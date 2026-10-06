import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Eraser } from "lucide-react";
import { cx } from "../ui";

// Must match server/sockets/roomHandlers.js COLORS
const BOARD_COLORS = ["#ECEAE3", "#E0604A", "#5FB37A", "#6EA8FE", "#D6A84C"];
const WIDTHS = [3, 8];
const FLUSH_MS = 40;

// Points are 0..1 on a 4:3 board, widths are in "1000 px wide" units,
// so both screens draw the same picture whatever their size.
const drawStroke = (ctx, stroke, w, h) => {
  const pts = stroke.points;
  ctx.strokeStyle = stroke.color;
  ctx.fillStyle = stroke.color;
  ctx.lineWidth = (stroke.width * w) / 1000;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  if (pts.length === 1) {
    ctx.beginPath();
    ctx.arc(pts[0][0] * w, pts[0][1] * h, ctx.lineWidth / 2, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  ctx.beginPath();
  ctx.moveTo(pts[0][0] * w, pts[0][1] * h);
  for (let i = 1; i < pts.length; i += 1) ctx.lineTo(pts[i][0] * w, pts[i][1] * h);
  ctx.stroke();
};

export const Whiteboard = forwardRef(({ socket, bookingId, onClear }, ref) => {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const strokesRef = useRef([]);
  const drawingRef = useRef(null); // { points, sentUpTo }
  const [color, setColor] = useState(BOARD_COLORS[0]);
  const [width, setWidth] = useState(WIDTHS[0]);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const { width: w, height: h } = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, w, h);
    strokesRef.current.forEach((s) => drawStroke(ctx, s, w, h));
  }, []);

  // Fit the largest 4:3 box into the available space (same shape on every screen,
  // so strokes line up), and keep the pixel size sharp on hi-dpi displays.
  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    const observer = new ResizeObserver(([entry]) => {
      const { width: cw, height: ch } = entry.contentRect;
      if (!cw || !ch) return; // hidden
      const w = Math.floor(Math.min(cw, (ch * 4) / 3));
      const h = Math.floor((w * 3) / 4);
      const dpr = window.devicePixelRatio || 1;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.getContext("2d").setTransform(dpr, 0, 0, dpr, 0, 0);
      redraw();
    });
    observer.observe(wrap);
    return () => observer.disconnect();
  }, [redraw]);

  useImperativeHandle(ref, () => ({
    load(strokes) {
      strokesRef.current = [...strokes];
      redraw();
    },
    clear() {
      strokesRef.current = [];
      redraw();
    },
  }));

  useEffect(() => {
    if (!socket) return;
    const onStroke = (stroke) => {
      strokesRef.current.push(stroke);
      const canvas = canvasRef.current;
      const { width: w, height: h } = canvas.getBoundingClientRect();
      drawStroke(canvas.getContext("2d"), stroke, w, h);
    };
    const onClearRemote = () => {
      strokesRef.current = [];
      redraw();
    };
    socket.on("wb:stroke", onStroke);
    socket.on("wb:clear", onClearRemote);
    return () => {
      socket.off("wb:stroke", onStroke);
      socket.off("wb:clear", onClearRemote);
    };
  }, [socket, redraw]);

  const pointAt = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const clamp = (n) => Math.min(1, Math.max(0, n));
    return [clamp((e.clientX - rect.left) / rect.width), clamp((e.clientY - rect.top) / rect.height)];
  };

  // send what's been drawn since the last flush as its own small stroke
  const flush = () => {
    const d = drawingRef.current;
    if (!d || d.points.length <= d.sentUpTo) return;
    const from = Math.max(0, d.sentUpTo - 1); // overlap one point so chunks join up
    const chunk = { color, width, points: d.points.slice(from, from + 500) };
    d.sentUpTo = from + chunk.points.length;
    strokesRef.current.push(chunk);
    socket?.emit("wb:stroke", { bookingId, stroke: chunk });
  };

  const onPointerDown = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drawingRef.current = { points: [pointAt(e)], sentUpTo: 0, timer: setInterval(flush, FLUSH_MS) };
  };

  const onPointerMove = (e) => {
    const d = drawingRef.current;
    if (!d) return;
    const next = pointAt(e);
    const prev = d.points[d.points.length - 1];
    d.points.push(next);
    const canvas = canvasRef.current;
    const { width: w, height: h } = canvas.getBoundingClientRect();
    drawStroke(canvas.getContext("2d"), { color, width, points: [prev, next] }, w, h);
  };

  const onPointerUp = () => {
    const d = drawingRef.current;
    if (!d) return;
    clearInterval(d.timer);
    if (d.points.length === 1) {
      const canvas = canvasRef.current;
      const { width: w, height: h } = canvas.getBoundingClientRect();
      drawStroke(canvas.getContext("2d"), { color, width, points: d.points }, w, h);
    }
    flush();
    drawingRef.current = null;
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      <div className="flex flex-wrap items-center gap-1.5" role="toolbar" aria-label="Whiteboard tools">
        {BOARD_COLORS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setColor(c)}
            aria-label={`Colour ${c}`}
            aria-pressed={color === c}
            className={cx("h-7 w-7 rounded-sm border", color === c ? "border-ink" : "border-line")}
          >
            <span className="block h-3 w-3 m-auto rounded-full" style={{ background: c }} />
          </button>
        ))}
        <span className="mx-1 h-5 w-px bg-line" aria-hidden="true" />
        {WIDTHS.map((w) => (
          <button
            key={w}
            type="button"
            onClick={() => setWidth(w)}
            aria-label={w === WIDTHS[0] ? "Thin line" : "Thick line"}
            aria-pressed={width === w}
            className={cx("h-7 w-9 rounded-sm border flex items-center justify-center", width === w ? "border-ink" : "border-line")}
          >
            <span className="block rounded-full bg-ink" style={{ width: 18, height: w === WIDTHS[0] ? 2 : 5 }} />
          </button>
        ))}
        <button type="button" onClick={onClear} className="ml-auto h-7 px-2 rounded-sm border border-line text-xs text-muted hover:text-ink flex items-center gap-1.5">
          <Eraser size={13} /> Clear for both
        </button>
      </div>
      <div ref={wrapRef} className="relative flex-1 min-h-0 flex items-center justify-center">
        <canvas
          ref={canvasRef}
          className="bg-surface border border-line rounded touch-none cursor-crosshair"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          aria-label="Shared whiteboard"
          role="img"
        />
      </div>
    </div>
  );
});

Whiteboard.displayName = "Whiteboard";
