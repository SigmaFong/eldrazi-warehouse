import type { Page } from "../../../types";

interface NavItem {
  key: Page;
  icon: string;
  label: string;
  badge?: number | null;
}

interface SidebarProps {
  page: Page;
  navItems: NavItem[];
  onNavigate: (page: Page) => void;
}

export function Sidebar({ page, navItems, onNavigate }: SidebarProps) {
  return (
    <aside className="w-60 min-h-screen bg-zinc-950 border-r border-zinc-800 flex flex-col fixed left-0 top-0 bottom-0 z-40">
      {/* top accent line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500 to-transparent" />

      {/* brand */}
      <div className="px-5 py-6 border-b border-zinc-800">
        <div className="text-3xl mb-2" style={{ filter: "hue-rotate(60deg) brightness(1.5)" }}>⬡</div>
        <div
          className="font-black text-violet-300 leading-tight text-[13px] tracking-wide"
          style={{ fontFamily: "'Cinzel Decorative', serif", textShadow: "0 0 16px rgba(167,139,250,.4)" }}
        >
          ELDRAZI<br />WAREHOUSE
        </div>
        <div className="font-mono text-[9px] text-zinc-600 tracking-widest uppercase mt-1">
          MTG Colorless // Distribution
        </div>
      </div>

      {/* nav links */}
      <nav className="flex-1 py-4">
        <div className="font-mono text-[9px] uppercase tracking-widest text-zinc-700 px-5 mb-2 mt-1">
          Navigation
        </div>
        {navItems.map(item => (
          <button
            key={item.key}
            onClick={() => onNavigate(item.key)}
            className={`w-full flex items-center gap-3 px-5 py-2.5 text-sm font-semibold transition-colors border-l-2 text-left
              ${page === item.key
                ? "border-violet-500 text-violet-300 bg-violet-500/10"
                : "border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-white/5"}`}
          >
            <span className="w-5 text-center text-base">{item.icon}</span>
            <span className="flex-1">{item.label}</span>
            {item.badge ? (
              <span className="bg-violet-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full font-mono">
                {item.badge}
              </span>
            ) : null}
          </button>
        ))}
      </nav>

      {/* footer */}
      <div className="px-5 py-4 border-t border-zinc-800">
        <div className="flex items-center gap-2 font-mono text-[10px] text-zinc-600 uppercase tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,.8)] animate-pulse" />
          System Online
        </div>
        <div className="font-mono text-[9px] text-zinc-800 mt-1">v2.4.1 // VOID PROTOCOL</div>
      </div>
    </aside>
  );
}
