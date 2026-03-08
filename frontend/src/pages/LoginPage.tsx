import { useState, type FormEvent } from "react";
import { useAuth } from "../context/AuthContext";

const DEMO_ACCOUNTS = [
  { email: "admin@eldrazi.com",   password: "Admin1234!",  role: "Admin",       icon: "◈" },
  { email: "manager@eldrazi.com", password: "Manage1234!", role: "Manager",     icon: "◎" },
  { email: "tanaka@tce.jp",       password: "Dist1234!",   role: "Distributor", icon: "◉" },
];

export function LoginPage() {
  const { login } = useAuth();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState<string | null>(null);
  const [loading,  setLoading]  = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError("Email and password are required."); return; }
    setLoading(true);
    setError(null);
    try {
      await login({ email: email.trim().toLowerCase(), password });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (acc: typeof DEMO_ACCOUNTS[0]) => {
    setEmail(acc.email);
    setPassword(acc.password);
    setError(null);
  };

  /* ── tiny animated eldrazi glyph ── */
function EldraziGlyph() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" className="mx-auto mb-6 opacity-90">
      <defs>
        <radialGradient id="glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#a78bfa" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#7c3aed" stopOpacity="0"   />
        </radialGradient>
      </defs>
      {/* outer ring */}
      <circle cx="32" cy="32" r="30" fill="none" stroke="#7c3aed" strokeWidth="1" strokeDasharray="6 3" className="animate-spin" style={{ animationDuration: "20s" }} />
      {/* inner ring */}
      <circle cx="32" cy="32" r="20" fill="none" stroke="#a78bfa" strokeWidth="0.5" strokeDasharray="4 2" className="animate-spin" style={{ animationDuration: "12s", animationDirection: "reverse" }} />
      {/* glow core */}
      <circle cx="32" cy="32" r="14" fill="url(#glow)" />
      {/* eldrazi hex */}
      <polygon points="32,16 44,24 44,40 32,48 20,40 20,24" fill="none" stroke="#c4b5fd" strokeWidth="1.5" />
      {/* center dot */}
      <circle cx="32" cy="32" r="4" fill="#a78bfa" />
      {/* spokes */}
      {[0,60,120,180,240,300].map(deg => {
        const rad = (deg * Math.PI) / 180;
        const x1 = 32 + 14 * Math.cos(rad);
        const y1 = 32 + 14 * Math.sin(rad);
        const x2 = 32 + 20 * Math.cos(rad);
        const y2 = 32 + 20 * Math.sin(rad);
        return <line key={deg} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#7c3aed" strokeWidth="1" />;
      })}
    </svg>
  );
}

  return (
    <div
      className="min-h-screen flex"
      style={{ fontFamily: "'Rajdhani', sans-serif", background: "linear-gradient(135deg, #1a0a2e 0%, #16213e 40%, #0f172a 100%)" }}
    >
      {/* ── Left panel — branding ── */}
      <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center p-16 relative overflow-hidden">
        {/* subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg,transparent,transparent 48px,rgba(167,139,250,1) 48px,rgba(167,139,250,1) 49px)," +
              "repeating-linear-gradient(90deg,transparent,transparent 48px,rgba(167,139,250,1) 48px,rgba(167,139,250,1) 49px)",
          }}
        />
        {/* glowing orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-20" style={{ background: "radial-gradient(circle, #7c3aed 0%, transparent 70%)" }} />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #4f46e5 0%, transparent 70%)" }} />

        <div className="relative z-10 text-center max-w-md">
          {/* large glyph */}
          {/* <div
            className="text-8xl mb-8 select-none"
            style={{ color: "#a78bfa", textShadow: "0 0 60px rgba(167,139,250,0.5), 0 0 120px rgba(124,58,237,0.3)" }}
          >
            ⬡
          </div> */}
          <EldraziGlyph />

          <h1
            className="text-4xl font-black mb-3 leading-tight"
            style={{
              fontFamily: "'Cinzel Decorative', serif",
              background: "linear-gradient(135deg, #e2d9f3 0%, #a78bfa 50%, #7c3aed 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            ELDRAZI
          </h1>
          <div
            className="text-sm tracking-[0.4em] uppercase mb-6"
            style={{ fontFamily: "'Cinzel Decorative', serif", color: "#9f7aea" }}
          >
            Warehouse System
          </div>

          <p className="text-slate-400 text-base leading-relaxed">
            MTG colorless card distribution<br />and inventory management platform.
          </p>

          {/* stats strip */}
          <div className="flex justify-center gap-8 mt-10">
            {[["8", "Card Types"], ["4", "Distributors"], ["v2.4", "Version"]].map(([val, label]) => (
              <div key={label} className="text-center">
                <div className="text-xl font-bold text-violet-300" style={{ fontFamily: "'Share Tech Mono', monospace" }}>{val}</div>
                <div className="text-[10px] uppercase tracking-widest text-slate-600">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right panel — login form ── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-16">
        <div className="w-full max-w-md">

          {/* mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="text-5xl text-violet-400 mb-2">⬡</div>
            <h1
              className="text-xl font-black text-violet-200 tracking-widest"
              style={{ fontFamily: "'Cinzel Decorative', serif" }}
            >
              ELDRAZI
            </h1>
          </div>

          {/* card */}
          <div
            className="rounded-2xl p-8 shadow-2xl"
            style={{
              background: "rgba(255,255,255,0.05)",
              backdropFilter: "blur(24px)",
              border: "1px solid rgba(167,139,250,0.15)",
              boxShadow: "0 25px 50px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.07)",
            }}
          >
            <div className="mb-7">
              <h2 className="text-2xl font-bold text-white mb-1">Welcome back</h2>
              <p className="text-slate-400 text-sm">Log in to access the warehouse.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">

              {/* email */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none transition-all"
                  style={{
                    background: "rgba(255,255,255,0.07)",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                  onFocus={e => (e.target.style.borderColor = "rgba(167,139,250,0.6)")}
                  onBlur={e  => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                />
              </div>

              {/* password */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl px-4 py-3 pr-16 text-sm text-white placeholder-slate-600 focus:outline-none transition-all"
                    style={{
                      background: "rgba(255,255,255,0.07)",
                      border: "1px solid rgba(255,255,255,0.1)",
                    }}
                    onFocus={e => (e.target.style.borderColor = "rgba(167,139,250,0.6)")}
                    onBlur={e  => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-[10px] font-bold uppercase tracking-wider transition-colors px-1"
                  >
                    {showPass ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              {/* error */}
              {error && (
                <div
                  className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-red-300 text-sm"
                  style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)" }}
                >
                  <span>⚠</span> {error}
                </div>
              )}

              {/* submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl font-bold text-sm text-white transition-all mt-2 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                style={{
                  background: loading
                    ? "rgba(124,58,237,0.5)"
                    : "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)",
                  boxShadow: loading ? "none" : "0 4px 24px rgba(124,58,237,0.4)",
                }}
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Authenticating…
                  </>
                ) : (
                  "Enter the Void →"
                )}
              </button>
            </form>

            {/* divider */}
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.07)" }} />
              <span className="text-[10px] uppercase tracking-widest text-slate-600">Quick Access</span>
              <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.07)" }} />
            </div>

            {/* demo accounts */}
            <div className="space-y-2">
              {DEMO_ACCOUNTS.map(acc => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => fillDemo(acc)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-left transition-all hover:scale-[1.01] active:scale-[0.99] group"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(167,139,250,0.3)")}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
                >
                  <span className="text-violet-400 text-base w-5 text-center flex-shrink-0">{acc.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-slate-200">{acc.role}</div>
                    <div className="text-[10px] text-slate-500 truncate font-mono">{acc.email}</div>
                  </div>
                  <span className="text-[10px] text-slate-600 group-hover:text-violet-400 transition-colors flex-shrink-0">Fill ↵</span>
                </button>
              ))}
            </div>
          </div>

          <p className="text-center text-[10px] text-slate-700 mt-6 uppercase tracking-widest font-mono">
            Eldrazi Warehouse v2.4 // MTG Distribution
          </p>
        </div>
      </div>
    </div>
  );
}