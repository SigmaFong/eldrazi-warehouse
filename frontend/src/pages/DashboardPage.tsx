import type { CardInventory, Order } from "../types";
import { StatCard } from "../components/ui/StatCard";
import { BarChart } from "../components/ui/BarChart";
import { useRole }  from "../hooks/useRole";
import { useAuth }  from "../context/AuthContext";

interface DashboardProps {
  inventory: CardInventory[];
  orders:    Order[];
}

interface DonutSegment { label: string; color: string; count: number }

function DonutChart({ segments, total }: { segments: DonutSegment[]; total: number }) {
  let cumulative = 0;
  const paths = segments.map(seg => {
    const pct   = seg.count / (total || 1);
    const angle = pct * 2 * Math.PI;
    const x1 = 60 + 45 * Math.cos(cumulative - Math.PI / 2);
    const y1 = 60 + 45 * Math.sin(cumulative - Math.PI / 2);
    cumulative += angle;
    const x2    = 60 + 45 * Math.cos(cumulative - Math.PI / 2);
    const y2    = 60 + 45 * Math.sin(cumulative - Math.PI / 2);
    const large = angle > Math.PI ? 1 : 0;
    return pct > 0
      ? <path key={seg.label} d={`M60,60 L${x1},${y1} A45,45 0 ${large},1 ${x2},${y2} Z`} fill={seg.color} opacity="0.85" />
      : null;
  });

  return (
    <div className="flex items-center gap-6">
      <svg width="120" height="120" viewBox="0 0 120 120" className="flex-shrink-0">
        {paths}
        <circle cx="60" cy="60" r="28" fill="#09090b" />
        <text x="60" y="65" textAnchor="middle" fill="#e4e4e7" fontSize="14"
          fontFamily="'Cinzel Decorative',serif" fontWeight="bold">{total}</text>
      </svg>
      <div className="space-y-2 flex-1">
        {segments.map(s => (
          <div key={s.label} className="flex items-center gap-2 text-sm">
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: s.color }} />
            <span className="text-zinc-400 flex-1">{s.label}</span>
            <span className="text-zinc-200 font-bold">{s.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DashboardPage({ inventory, orders }: DashboardProps) {
  const { role, can, is } = useRole();
  const { user }          = useAuth();

  const totalQty   = inventory.reduce((s, i) => s + i.quantity, 0);
  const totalValue = inventory.reduce((s, i) => s + i.quantity * i.price, 0);
  const pending    = orders.filter(o => ["pending","processing"].includes(o.status)).length;
  const mythicQty  = inventory.filter(i => i.rarity === "mythic").reduce((s, i) => s + i.quantity, 0);
  const maxQty     = Math.max(...inventory.map(i => i.quantity), 1);

  const statusCounts = orders.reduce<Record<string, number>>((acc, o) => {
    acc[o.status] = (acc[o.status] ?? 0) + 1;
    return acc;
  }, {});

  const donutSegments: DonutSegment[] = [
    { label: "Delivered",  color: "#10b981", count: statusCounts.delivered  ?? 0 },
    { label: "Shipped",    color: "#60a5fa", count: statusCounts.shipped    ?? 0 },
    { label: "Processing", color: "#f59e0b", count: statusCounts.processing ?? 0 },
    { label: "Pending",    color: "#64748b", count: statusCounts.pending    ?? 0 },
    { label: "Cancelled",  color: "#ef4444", count: statusCounts.cancelled  ?? 0 },
  ];

  const rarities = ["mythic", "rare", "uncommon", "common"] as const;

  const bannerContent: Record<string, { icon: string; text: string; color: string }> = {
    admin:       { icon: "◈", text: "Full system access — all vaults, orders, distributors, and system controls are unlocked.", color: "bg-amber-500/10 border-amber-500/30 text-amber-300" },
    manager:     { icon: "◎", text: "Manager access — you can edit inventory, create orders, and manage distributor relationships.", color: "bg-violet-500/10 border-violet-500/30 text-violet-300" },
    distributor: { icon: "◉", text: `Welcome, ${user?.name}. You are viewing your distributor dashboard. Contact a manager to place new orders.`, color: "bg-blue-500/10 border-blue-500/30 text-blue-300" },
    viewer:      { icon: "○", text: "Read-only access — you can browse inventory, orders, and distributor data but cannot make changes.", color: "bg-zinc-500/10 border-zinc-600/30 text-zinc-400" },
  };
  const banner = bannerContent[role] ?? bannerContent.viewer;

  return (
    <div className="space-y-6">

      {/* Role banner */}
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm ${banner.color}`}>
        <span className="text-lg flex-shrink-0">{banner.icon}</span>
        <span>{banner.text}</span>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Total Cards"   value={totalQty.toLocaleString()} sub={`${inventory.length} unique entries`} icon="🃏" />

        {!is("distributor") ? (
          <StatCard label="Vault Value" value={`$${Math.round(totalValue).toLocaleString()}`} sub="USD market price" icon="💎" />
        ) : (
          <StatCard label="Your Orders" value={orders.length} sub="total orders placed" icon="📋" />
        )}

        <StatCard label="Active Orders" value={pending} sub={`${orders.length} total orders`} icon="📦" />

        {can("canEditInventory") ? (
          <StatCard label="Mythic Holdings" value={mythicQty} sub={`${inventory.filter(i => i.rarity === "mythic").length} titles`} icon="⚡" />
        ) : (
          <StatCard label="Delivered" value={statusCounts.delivered ?? 0} sub="completed orders" icon="✅" />
        )}
      </div>

      {/* Charts */}
      {can("canEditInventory") ? (
        // Admin / Manager — full charts
        <div className="grid grid-cols-2 gap-5">
          <BarChart
            title="Stock Levels by Card"
            items={inventory.map(i => ({
              // ✅ FIX: use cardId as key — unique, not the truncated name
              label: i.name,
              value: i.quantity,
              max:   maxQty,
              key:   i.cardId,
            }))}
          />

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-5">
            <div className="font-bold text-zinc-200 text-sm tracking-wide" style={{ fontFamily: "'Cinzel Decorative', serif" }}>
              Order Distribution
            </div>
            <DonutChart segments={donutSegments} total={orders.length} />

            <div>
              <div className="font-bold text-zinc-200 text-sm mb-3 tracking-wide" style={{ fontFamily: "'Cinzel Decorative', serif" }}>
                Rarity Mix
              </div>
              {rarities.map(r => {
                const cnt = inventory.filter(i => i.rarity === r).length;
                return (
                  <div key={r} className="flex items-center gap-3 mb-2">
                    <div className="w-20 text-xs capitalize text-zinc-400">{r}</div>
                    <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-violet-700 to-violet-400"
                        style={{ width: `${(cnt / (inventory.length || 1)) * 100}%` }} />
                    </div>
                    <div className="w-4 text-right font-mono text-[11px] text-zinc-500">{cnt}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        // Distributor / Viewer — simplified
        <div className="grid grid-cols-2 gap-5">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <div className="font-bold text-zinc-200 text-sm tracking-wide mb-5" style={{ fontFamily: "'Cinzel Decorative', serif" }}>
              Order Status Overview
            </div>
            <DonutChart segments={donutSegments} total={orders.length} />
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <div className="font-bold text-zinc-200 text-sm tracking-wide mb-4" style={{ fontFamily: "'Cinzel Decorative', serif" }}>
              Available Inventory
            </div>
            <div className="space-y-3">
              {inventory.slice(0, 6).map(item => {
                const avail = item.quantity - item.reserved;
                return (
                  // ✅ FIX: use cardId as key — always unique
                  <div key={item.cardId} className="flex items-center gap-3">
                    <img src={item.img} alt={item.name}
                      className="w-7 h-9 rounded object-cover border border-zinc-700 flex-shrink-0"
                      onError={e => (e.currentTarget.style.display = "none")} />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-zinc-300 truncate">{item.name}</div>
                      <div className="text-[10px] font-mono text-zinc-600 capitalize">{item.rarity}</div>
                    </div>
                    <div className={`text-sm font-bold font-mono ${avail < 5 ? "text-amber-400" : "text-emerald-400"}`}>
                      {avail}
                    </div>
                  </div>
                );
              })}
            </div>
            {is("distributor") && (
              <div className="mt-4 pt-3 border-t border-zinc-800 font-mono text-[10px] text-zinc-600 uppercase tracking-widest">
                Pricing visible to managers only
              </div>
            )}
          </div>
        </div>
      )}

      {/* Admin-only quick stats */}
      {is("admin") && (
        <div className="bg-zinc-900 border border-amber-500/20 rounded-2xl p-5">
          <div className="font-bold text-amber-300 text-sm tracking-wide mb-3" style={{ fontFamily: "'Cinzel Decorative', serif" }}>
            ◈ Admin Quick Stats
          </div>
          <div className="grid grid-cols-4 gap-4 text-center">
            {[
              { label: "Cancelled Orders", value: statusCounts.cancelled ?? 0,                                           color: "text-red-400"    },
              { label: "Low Stock Items",  value: inventory.filter(i => (i.quantity - i.reserved) < 5).length,           color: "text-amber-400"  },
              { label: "Mythic Titles",    value: inventory.filter(i => i.rarity === "mythic").length,                   color: "text-violet-400" },
              { label: "Reserved Units",   value: inventory.reduce((s, i) => s + i.reserved, 0),                        color: "text-blue-400"   },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-zinc-800/60 rounded-xl px-3 py-3">
                <div className={`text-xl font-black font-mono ${color}`}>{value}</div>
                <div className="text-[10px] text-zinc-600 uppercase tracking-widest mt-1">{label}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}