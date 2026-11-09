import { useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

interface SystemDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  wide?: boolean;
}

export function SystemDialog({ isOpen, onClose, title, children, wide = false }: SystemDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog || !isOpen) return;
    dialog.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  return <dialog ref={ref} aria-labelledby={titleId} onCancel={(event) => { event.preventDefault(); onClose(); }}
    className={`fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] overflow-y-auto rounded-sm border border-slate-300 bg-white p-0 text-slate-900 shadow-lg backdrop:bg-slate-900/40 ${wide ? "max-w-2xl" : "max-w-lg"}`}
    style={{ fontFamily: 'Arial, "Segoe UI", sans-serif' }}>
    <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-5 py-3">
      <h2 id={titleId} className="text-base font-semibold">{title}</h2>
      <button type="button" onClick={onClose} aria-label={`Đóng ${title}`} className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-sm text-slate-600 hover:bg-slate-100">
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
    {isOpen && <div className="p-5">{children}</div>}
  </dialog>;
}
