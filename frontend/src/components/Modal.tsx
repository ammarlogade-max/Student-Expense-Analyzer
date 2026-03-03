import type { ReactNode } from "react";
import { useEffect } from "react";

type Props = { open: boolean; onClose: () => void; title: string; children: ReactNode };

const Modal = ({ open, onClose, title, children }: Props) => {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", handler); document.body.style.overflow = ""; };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-panel">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold" style={{ color:"var(--text-primary)", fontFamily:"var(--font-display)" }}>{title}</h3>
          <button onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg transition"
            style={{ background:"var(--bg-tertiary)", border:"1px solid var(--border-light)", color:"var(--text-secondary)" }}>
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};
export default Modal;
