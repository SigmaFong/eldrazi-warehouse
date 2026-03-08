import type { Distributor } from "../types";
import { Badge } from "../components/ui/Badge";
import { Table } from "../components/ui/Table";

interface DistributorsPageProps {
  distributors: Distributor[];
}

const HEADERS = ["Distributor", "Country", "Tier", "Credit Limit", "Balance", "Credit Used", "Orders"];

export function DistributorsPage({ distributors }: DistributorsPageProps) {
  return (
    <Table title="Distributor Network" subtitle={`${distributors.length} partners`} headers={HEADERS}>
      {distributors.map(d => {
        const usedPct = (d.balance / d.creditLimit) * 100;
        return (
          <tr key={d.id} className="border-b border-zinc-800/50 hover:bg-violet-500/5 transition-colors">
            <td className="px-4 py-3">
              <div className="text-sm font-semibold text-zinc-200">{d.name}</div>
              <div className="font-mono text-[10px] text-zinc-600">{d.contact}</div>
            </td>
            <td className="px-4 py-3 text-sm text-zinc-400">{d.country}</td>
            <td className="px-4 py-3"><Badge variant="tier" value={d.tier} /></td>
            <td className="px-4 py-3 font-mono text-amber-400 text-sm">${d.creditLimit.toLocaleString()}</td>
            <td className="px-4 py-3 font-mono text-amber-400 text-sm">${d.balance.toLocaleString()}</td>
            <td className="px-4 py-3 min-w-[140px]">
              <div className={`text-[11px] mb-1.5 font-mono ${usedPct > 70 ? "text-red-400" : "text-zinc-500"}`}>
                {usedPct.toFixed(1)}%
              </div>
              <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${usedPct > 70 ? "bg-red-500" : "bg-gradient-to-r from-violet-700 to-violet-400"}`}
                  style={{ width: `${usedPct}%` }}
                />
              </div>
            </td>
            <td className="px-4 py-3 text-center text-sm font-bold text-zinc-300">{d.activeOrders}</td>
          </tr>
        );
      })}
    </Table>
  );
}
