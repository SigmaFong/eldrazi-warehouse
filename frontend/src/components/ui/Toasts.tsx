import type { Toast } from "../../../types";

interface ToastsProps {
  toasts: Toast[];
}

export function Toasts({ toasts }: ToastsProps) {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-semibold shadow-2xl backdrop-blur-sm
            ${t.type === "success"
              ? "bg-zinc-900/95 border-emerald-500/40 text-emerald-300"
              : "bg-zinc-900/95 border-red-500/40 text-red-300"}`}
        >
          <span>{t.type === "success" ? "✓" : "✕"}</span>
          {t.message}
        </div>
      ))}
    </div>
  );
}
