import { useEffect } from "react";

// Calls onDismiss on outside click or Escape while `open` is true.
export const useDismiss = (ref, open, onDismiss) => {
  useEffect(() => {
    if (!open) return;
    const onPointer = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onDismiss();
    };
    const onKey = (e) => e.key === "Escape" && onDismiss();
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [ref, open, onDismiss]);
};
