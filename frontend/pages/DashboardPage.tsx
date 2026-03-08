import type { CardInventory, Order } from "../types";
import { StatCard } from "../components/ui/StatCard";
import { BarChart } from "../components/ui/BarChart";

interface DashboardProps {
  inventory: CardInventory[];
  orders: Order[];
}

interface DonutSegment {
  label: string;
  color: string;
  count: number;
}

function DonutChart({ segments, total }: { segments: DonutSegment[]; total: number }) {
  let cumulative = 0;
  const paths = segments.map(seg => {
    const pct   = seg.count / (total || 1);
    const angle = pct * 2 * Math.PI;
    const x1    = 60 + 45 * Math.cos(cumulative - Math.PI / 2);
    const y1    = 60 + 45 * Math.sin(cumulative - Math.PI / 2);
    cumulative += angle;
    const x2   = 60 + 45 * Math.cos(cumulative - Math.PI / 2);
    const y2   = 60 + 45 * Math.sin(cumulative - Math.PI / 2);
    const large = angle > Math.PI ? 1 : 0;
    return pct > 0 ? (
      <path key={seg.label} d={`M60,60 L${x1},${y1} A45,45 0 ${large},1 ${x2},${y2} Z`} fill={seg.color} opacity="0.85" />
    ) : null;
  });

  return (
    <div className="flex items-center gap-6">
      <svg width="120" height="120" viewBox="0 0 120 120" className="flex-shrink-0">
        {paths}
        <circle cx="60" cy="60" r="28" fill="#09090b" />
        <text x="60" y="65" textAnchor="middle" fill="#e4e4e7" fontSize="14"
          fontFamily="'Cinzel Decorative',serif" fontWeight="bold">
          {total}
        </text>
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
  const totalQty   = inventory.reduce((s, i) => s + i.quantity, 0);
  const totalValue = inventory.reduce((s, i) => s + i.quantity * i.price, 0);
  const pending    = orders.filter(o => ["pending", "processing"].includes(o.status)).length;
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
  ];

  const rarities = ["mythic", "rare", "uncommon", "common"] as const;

  return (
    <div className="space-y-6">
      {/* banner */}
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-violet-500/10 border border-violet-500/30 text-violet-300 text-sm">
        <span className="text-lg">🌀</span>
        <span>Eldrazi Void Protocol Active — Colorless permanents tracked across all realms. Scryfall API connected.</span>
      </div>

      {/* stat cards */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Total Cards"     value={totalQty.toLocaleString()} sub={`${inventory.length} unique entries`} icon="🃏" />
        <StatCard label="Vault Value"     value={`$${Math.round(totalValue).toLocaleString()}`} sub="USD market price" icon="💎" />
        <StatCard label="Active Orders"   value={pending}  sub={`${orders.length} total orders`} icon="📦" />
        <StatCard label="Mythic Holdings" value={mythicQty} sub={`${inventory.filter(i => i.rarity === "mythic").length} titles`} icon="⚡" />
      </div>

      {/* charts */}
      <div className="grid grid-cols-2 gap-5">
        <BarChart
          title="Stock Levels by Card"
          items={inventory.map(i => ({
            label: i.name.split(",")[0],
            value: i.quantity,
            max:   maxQty,
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
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-violet-700 to-violet-400"
                      style={{ width: `${(cnt / inventory.length) * 100}%` }}
                    />
                  </div>
                  <div className="w-4 text-right font-mono text-[11px] text-zinc-500">{cnt}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
