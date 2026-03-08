interface StatCardProps {
  label: string;
  value: string | number;
  sub: string;
  icon: string;
}

export function StatCard({ label, value, sub, icon }: StatCardProps) {
  return (
    <div className="relative overflow-hidden bg-zinc-900 border border-zinc-800 rounded-2xl p-5 hover:border-violet-600/60 transition-colors group">
      <div className="absolute top-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-violet-500/60 to-transparent" />
      <div className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 mb-3">{label}</div>
      <div
        className="text-3xl font-black text-violet-300 leading-none mb-2"
        style={{ fontFamily: "'Cinzel Decorative', serif", textShadow: "0 0 20px rgba(167,139,250,.35)" }}
      >
        {value}
      </div>
      <div className="text-xs text-zinc-500">{sub}</div>
      <span className="absolute right-4 top-4 text-3xl opacity-10 group-hover:opacity-20 transition-opacity">{icon}</span>
    </div>
  );
}
