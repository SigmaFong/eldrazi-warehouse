import type { ReactNode } from "react";

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export function Modal({ title, onClose, children }: ModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-lg mx-4 bg-zinc-950 border border-zinc-800 rounded-2xl p-7 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="absolute top-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-violet-500 to-transparent" />
        <h2
          className="text-violet-300 text-base font-bold mb-6 tracking-wide"
          style={{ fontFamily: "'Cinzel Decorative', serif" }}
        >
          {title}
        </h2>
        {children}
      </div>
    </div>
  );
}
