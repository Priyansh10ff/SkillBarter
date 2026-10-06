import { useEffect, useRef } from "react";
import { X } from "lucide-react";

// Native <dialog>: focus trap, Esc to close and backdrop come from the browser.
export const Dialog = ({ open, onClose, title, children, footer }) => {
  const ref = useRef(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      aria-labelledby="dialog-title"
      className="w-[calc(100%-2rem)] max-w-md bg-surface text-ink border border-line rounded p-0"
    >
      {open && (
        <div className="flex flex-col">
          <div className="flex items-center justify-between border-b border-line px-5 h-12">
            <h2 id="dialog-title" className="font-medium">
              {title}
            </h2>
            <button type="button" onClick={onClose} className="text-muted hover:text-ink p-1 -mr-1" aria-label="Close">
              <X size={16} />
            </button>
          </div>
          <div className="px-5 py-4 text-muted">{children}</div>
          {footer && <div className="flex justify-end gap-2 border-t border-line px-5 py-3">{footer}</div>}
        </div>
      )}
    </dialog>
  );
};
