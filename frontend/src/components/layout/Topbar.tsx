import type { User } from "../../../types";

const ROLE_COLORS: Record<string, string> = {
  admin:       "bg-amber-500/20  text-amber-300  border-amber-500/30",
  manager:     "bg-violet-500/20 text-violet-300 border-violet-500/30",
  distributor: "bg-blue-500/20   text-blue-300   border-blue-500/30",
  viewer:      "bg-zinc-500/20   text-zinc-400   border-zinc-500/30",
};

interface TopbarProps {
  title:     string;
  onRefresh: () => void;
  user?:     User | null;
  onLogout?: () => void;
}

export function Topbar({ title, onRefresh, user, onLogout }: TopbarProps) {
  const roleClass = ROLE_COLORS[user?.role ?? "viewer"] ?? ROLE_COLORS.viewer;

  return (
    <header className="sticky top-0 z-30 h-14 bg-zinc-950/90 backdrop-blur border-b border-zinc-800 flex items-center px-7 gap-4">
      <h1
        className="font-bold text-zinc-200 text-sm tracking-wide"
        style={{ fontFamily: "'Cinzel Decorative', serif" }}
      >
        {title}
      </h1>

      <div className="ml-auto flex items-center gap-3">
        <button
          onClick={onRefresh}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-zinc-400 border border-zinc-700 rounded-lg hover:border-zinc-500 transition-colors"
        >
          Refresh
        </button>

        {user && (
          <>
            <div className="flex items-center gap-2 pl-3 border-l border-zinc-800">
              <span className={`font-mono text-[9px] uppercase tracking-widest px-2 py-0.5 rounded border ${roleClass}`}>
                {user.role}
              </span>
              <span className="text-xs font-semibold text-zinc-300">{user.name}</span>
            </div>
            <div className="w-7 h-7 rounded-full bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400 text-xs font-bold uppercase select-none">
              {user.name.charAt(0)}
            </div>
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-zinc-500 border border-zinc-800 rounded-lg hover:border-red-800/60 hover:text-red-400 transition-colors"
            >
              Logout
            </button>
          </>
        )}
      </div>
    </header>
  );
}
