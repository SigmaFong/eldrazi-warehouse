import { useState, useEffect, useCallback } from "react";
import axiosInstance from "../api/axiosInstance";

// ── Types ─────────────────────────────────────────────────────────────────
interface SystemData {
  server: {
    platform:     string;
    arch:         string;
    nodeVersion:  string;
    uptime:       string;
    uptimeSeconds:number;
    pid:          number;
  };
  cpu: {
    model:   string;
    cores:   number;
    loadAvg: number[];
  };
  memory: {
    total:   string;
    used:    string;
    free:    string;
    usedPct: number;
  };
  process: {
    heapUsed:  string;
    heapTotal: string;
    rss:       string;
  };
  timestamp: string;
}

interface ConnCheck {
  name:    string;
  url:     string;
  status:  "checking" | "online" | "offline" | "error";
  latency: number | null;
  detail:  string;
}

// ── Small UI helpers ──────────────────────────────────────────────────────
function StatusDot({ status }: { status: ConnCheck["status"] }) {
  const map = {
    checking: "bg-zinc-600 animate-pulse",
    online:   "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,.8)]",
    offline:  "bg-red-500    shadow-[0_0_8px_rgba(239,68,68,.8)]",
    error:    "bg-amber-500  shadow-[0_0_8px_rgba(245,158,11,.8)]",
  };
  return <span className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${map[status]}`} />;
}

function StatRow({ label, value, mono = false, accent = false }: {
  label: string; value: string | number; mono?: boolean; accent?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-zinc-800/60 last:border-0">
      <span className="text-xs text-zinc-500 uppercase tracking-widest font-mono">{label}</span>
      <span className={`text-sm font-semibold ${mono ? "font-mono" : ""} ${accent ? "text-violet-300" : "text-zinc-200"}`}>
        {value}
      </span>
    </div>
  );
}

function GaugeBar({ pct, warn = 70, danger = 90 }: { pct: number; warn?: number; danger?: number }) {
  const color = pct >= danger ? "bg-red-500" : pct >= warn ? "bg-amber-400" : "bg-emerald-500";
  return (
    <div className="mt-1.5 h-2 bg-zinc-800 rounded-full overflow-hidden">
      <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${Math.min(pct, 100)}%` }} />
    </div>
  );
}

// ── Connectivity targets ──────────────────────────────────────────────────
const CONN_TARGETS: Pick<ConnCheck, "name" | "url">[] = [
  { name: "Backend API",      url: "http://localhost:5000/api/system/health" },
  { name: "Scryfall API",     url: "https://api.scryfall.com/sets?page=1"   },
  { name: "Google Fonts CDN", url: "https://fonts.googleapis.com"           },
];

// ── Main page ─────────────────────────────────────────────────────────────
export function SystemInfoPage() {
  const [sys,      setSys]      = useState<SystemData | null>(null);
  const [checks,   setChecks]   = useState<ConnCheck[]>(
    CONN_TARGETS.map(t => ({ ...t, status: "checking", latency: null, detail: "" }))
  );
  const [sysError, setSysError] = useState<string | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // ── Fetch backend system info ─────────────────────────────────────────
  const fetchSysInfo = useCallback(async () => {
    setLoading(true);
    setSysError(null);
    try {
      const { data } = await axiosInstance.get("/system/info");
      setSys(data.data.system);
    } catch (err) {
      setSysError(err instanceof Error ? err.message : "Failed to fetch system info");
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Run connectivity checks ───────────────────────────────────────────
  const runChecks = useCallback(async () => {
    setChecks(CONN_TARGETS.map(t => ({ ...t, status: "checking", latency: null, detail: "" })));

    await Promise.all(
      CONN_TARGETS.map(async (target, idx) => {
        const start = Date.now();
        try {
          const res = await fetch(target.url, {
            method: "GET",
            mode:   target.url.includes("localhost") ? "cors" : "no-cors",
            cache:  "no-store",
          });
          const latency = Date.now() - start;
          // no-cors always returns opaque (status 0) but means reachable
          const online = res.ok || res.type === "opaque";
          setChecks(prev => {
            const next = [...prev];
            next[idx] = {
              ...target,
              status:  online ? "online" : "offline",
              latency,
              detail:  online ? `HTTP ${res.status || "200"} · ${latency}ms` : `HTTP ${res.status} · unreachable`,
            };
            return next;
          });
        } catch {
          const latency = Date.now() - start;
          setChecks(prev => {
            const next = [...prev];
            next[idx] = {
              ...target,
              status:  "offline",
              latency,
              detail:  "Connection refused or network error",
            };
            return next;
          });
        }
      })
    );
  }, []);

  const handleRefresh = useCallback(async () => {
    setLastRefresh(new Date());
    await Promise.all([fetchSysInfo(), runChecks()]);
  }, [fetchSysInfo, runChecks]);

  useEffect(() => {
    fetchSysInfo();
    runChecks();
    // auto-refresh system info every 30s
    const interval = setInterval(fetchSysInfo, 30_000);
    return () => clearInterval(interval);
  }, [fetchSysInfo, runChecks]);

  const fmtTime = (d: Date) => d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  return (
    <div className="space-y-6 max-w-5xl">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-amber-300 tracking-wide" style={{ fontFamily: "'Cinzel Decorative', serif" }}>
            ◈ System Information
          </h2>
          <p className="font-mono text-[10px] text-zinc-600 mt-0.5 uppercase tracking-widest">
            Admin only · last refreshed {fmtTime(lastRefresh)}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold border border-amber-700/40 text-amber-400 rounded-xl hover:bg-amber-900/20 transition-colors disabled:opacity-50"
        >
          {loading ? (
            <><div className="w-3.5 h-3.5 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" /> Refreshing…</>
          ) : "↺ Refresh"}
        </button>
      </div>

      {/* ── Connectivity checks ── */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
        <div className="font-bold text-zinc-200 text-sm mb-4 tracking-wide" style={{ fontFamily: "'Cinzel Decorative', serif" }}>
          Connectivity Status
        </div>
        <div className="grid grid-cols-3 gap-4">
          {checks.map(c => (
            <div
              key={c.name}
              className={`rounded-xl border p-4 transition-all ${
                c.status === "online"   ? "border-emerald-700/40 bg-emerald-900/10" :
                c.status === "offline"  ? "border-red-700/40    bg-red-900/10"    :
                c.status === "error"    ? "border-amber-700/40  bg-amber-900/10"  :
                                          "border-zinc-700      bg-zinc-800/40"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <StatusDot status={c.status} />
                <span className="text-sm font-semibold text-zinc-200">{c.name}</span>
              </div>
              <div className={`text-xs font-mono font-bold uppercase tracking-wider mb-1 ${
                c.status === "online"  ? "text-emerald-400" :
                c.status === "offline" ? "text-red-400"     :
                c.status === "error"   ? "text-amber-400"   : "text-zinc-500"
              }`}>
                {c.status === "checking" ? "Checking…" : c.status.toUpperCase()}
              </div>
              <div className="text-[10px] font-mono text-zinc-600 truncate">{c.detail || c.url}</div>
              {c.latency !== null && (
                <div className="mt-2 text-[10px] font-mono text-zinc-500">
                  Latency: <span className={`font-bold ${c.latency < 200 ? "text-emerald-400" : c.latency < 500 ? "text-amber-400" : "text-red-400"}`}>
                    {c.latency}ms
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Backend system stats ── */}
      {sysError ? (
        <div className="bg-red-900/10 border border-red-700/30 rounded-2xl p-5 font-mono text-sm text-red-400">
          ⚠ Could not fetch system info from backend: {sysError}
        </div>
      ) : loading && !sys ? (
        <div className="flex items-center gap-3 py-10 text-zinc-600 font-mono text-xs justify-center">
          <div className="w-4 h-4 border-2 border-zinc-700 border-t-amber-500 rounded-full animate-spin" />
          Fetching system info…
        </div>
      ) : sys ? (
        <div className="grid grid-cols-2 gap-5">

          {/* Server */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <div className="font-bold text-zinc-200 text-sm mb-4 tracking-wide" style={{ fontFamily: "'Cinzel Decorative', serif" }}>
              Server
            </div>
            <StatRow label="Platform"    value={`${sys.server.platform} / ${sys.server.arch}`} mono />
            <StatRow label="Node.js"     value={sys.server.nodeVersion} mono accent />
            <StatRow label="PID"         value={sys.server.pid} mono />
            <StatRow label="Uptime"      value={sys.server.uptime} mono accent />
            <StatRow label="Environment" value={import.meta.env.MODE} mono />
          </div>

          {/* CPU */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <div className="font-bold text-zinc-200 text-sm mb-4 tracking-wide" style={{ fontFamily: "'Cinzel Decorative', serif" }}>
              CPU
            </div>
            <StatRow label="Model" value={sys.cpu.model} />
            <StatRow label="Cores" value={sys.cpu.cores} mono accent />
            <div className="py-2.5 border-b border-zinc-800/60">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-zinc-500 uppercase tracking-widest font-mono">Load Avg (1m / 5m / 15m)</span>
              </div>
              <div className="flex gap-2">
                {sys.cpu.loadAvg.map((v, i) => (
                  <span key={i} className="font-mono text-sm font-bold text-violet-300">{v.toFixed(2)}</span>
                )).reduce((a, b, i) => [...a, <span key={`s${i}`} className="text-zinc-600">/</span>, b] as any, [] as any[])}
              </div>
            </div>
          </div>

          {/* Memory */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <div className="font-bold text-zinc-200 text-sm mb-4 tracking-wide" style={{ fontFamily: "'Cinzel Decorative', serif" }}>
              System Memory
            </div>
            <StatRow label="Total" value={sys.memory.total} mono />
            <StatRow label="Used"  value={sys.memory.used}  mono accent />
            <StatRow label="Free"  value={sys.memory.free}  mono />
            <div className="pt-2">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-zinc-500 font-mono uppercase tracking-widest">Usage</span>
                <span className={`font-mono font-bold ${sys.memory.usedPct >= 90 ? "text-red-400" : sys.memory.usedPct >= 70 ? "text-amber-400" : "text-emerald-400"}`}>
                  {sys.memory.usedPct}%
                </span>
              </div>
              <GaugeBar pct={sys.memory.usedPct} />
            </div>
          </div>

          {/* Process heap */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <div className="font-bold text-zinc-200 text-sm mb-4 tracking-wide" style={{ fontFamily: "'Cinzel Decorative', serif" }}>
              Node.js Process
            </div>
            <StatRow label="Heap Used"  value={sys.process.heapUsed}  mono accent />
            <StatRow label="Heap Total" value={sys.process.heapTotal} mono />
            <StatRow label="RSS"        value={sys.process.rss}       mono />
            <StatRow label="Timestamp"  value={new Date(sys.timestamp).toLocaleTimeString()} mono />
          </div>
        </div>
      ) : null}
    </div>
  );
}