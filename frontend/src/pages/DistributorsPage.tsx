import { useState } from "react";
import type { Distributor } from "../types";
import { Badge }   from "../components/ui/Badge";
import { Table }   from "../components/ui/Table";
import { Modal }   from "../components/ui/Modal";
import { useRole } from "../hooks/useRole";
import { useAuth } from "../context/AuthContext";

interface DistributorsPageProps {
  distributors: Distributor[];
}

const ADMIN_HEADERS  = ["Distributor", "Country", "Tier", "Credit Limit", "Balance", "Credit Used", ""];
const VIEWER_HEADERS = ["Distributor", "Country", "Tier", "Credit Used"];

export function DistributorsPage({ distributors }: DistributorsPageProps) {
  const { can, is } = useRole();
  const { user }    = useAuth();

  const [editTarget, setEditTarget] = useState<Distributor | null>(null);
  const [editName,   setEditName]   = useState("");

  // Distributors only see their own row
  const visible = is("distributor")
    ? distributors.filter(d => d.contact === user?.email)
    : distributors;

  const headers = can("canEditDistributor") ? ADMIN_HEADERS : VIEWER_HEADERS;

  return (
    <div className="space-y-5">
      {/* top bar */}
      <div className="flex items-center justify-between">
        {is("distributor") && (
          <div className="flex items-center gap-2 px-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-zinc-500 text-xs font-mono">
            <span className="text-blue-400">◉</span>
            Showing your distributor profile only
          </div>
        )}
        {!can("canEditDistributor") && !is("distributor") && (
          <div className="flex items-center gap-2 px-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-zinc-500 text-xs font-mono">
            <span className="text-amber-400">⚠</span>
            Read-only — your role cannot edit distributors
          </div>
        )}
        {can("canCreateDistributor") && (
          <button className="ml-auto flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-xl transition-colors shadow-lg shadow-violet-900/30">
            + Add Distributor
          </button>
        )}
      </div>

      <Table
        title="Distributor Network"
        subtitle={`${visible.length} partner${visible.length !== 1 ? "s" : ""}`}
        headers={headers}
      >
        {visible.map(d => {
          // Use backend virtual if available, otherwise calculate
          const usedPct = typeof d.creditUsedPct === "number"
            ? d.creditUsedPct
            : (d.balance / d.creditLimit) * 100;

          return (
            <tr key={d._id ?? d.id} className="border-b border-zinc-800/50 hover:bg-violet-500/5 transition-colors">
              {/* name + contact */}
              <td className="px-4 py-3">
                <div className="text-sm font-semibold text-zinc-200">{d.name}</div>
                <div className="font-mono text-[10px] text-zinc-600">{d.contact}</div>
              </td>

              <td className="px-4 py-3 text-sm text-zinc-400">{d.country}</td>
              <td className="px-4 py-3"><Badge variant="tier" value={d.tier} /></td>

              {/* Financial columns — admin/manager only */}
              {can("canEditDistributor") && (
                <>
                  <td className="px-4 py-3 font-mono text-amber-400 text-sm">
                    ${d.creditLimit.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 font-mono text-amber-400 text-sm">
                    ${d.balance.toLocaleString()}
                  </td>
                </>
              )}

              {/* Credit used bar — all roles */}
              <td className="px-4 py-3 min-w-[140px]">
                <div className={`text-[11px] mb-1.5 font-mono ${usedPct > 70 ? "text-red-400" : "text-zinc-500"}`}>
                  {usedPct.toFixed(1)}%
                </div>
                <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${usedPct > 70 ? "bg-red-500" : "bg-gradient-to-r from-violet-700 to-violet-400"}`}
                    style={{ width: `${Math.min(usedPct, 100)}%` }}
                  />
                </div>
              </td>

              {/* Actions — admin/manager only */}
              {can("canEditDistributor") && (
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => { setEditTarget(d); setEditName(d.name); }}
                      className="text-xs px-3 py-1.5 border border-zinc-700 text-zinc-400 rounded-lg hover:border-violet-500 hover:text-violet-300 transition-colors font-semibold">
                      Edit
                    </button>
                    {can("canDeleteDistributor") && (
                      <button className="text-xs px-3 py-1.5 border border-red-900/40 text-red-500 rounded-lg hover:bg-red-900/20 transition-colors font-semibold">
                        Delete
                      </button>
                    )}
                  </div>
                </td>
              )}
            </tr>
          );
        })}
      </Table>

      {/* Edit modal */}
      {editTarget && (
        <Modal title={`Edit — ${editTarget.name}`} onClose={() => setEditTarget(null)}>
          <div className="mb-4">
            <label className="block font-mono text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Name</label>
            <input value={editName} onChange={e => setEditName(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-zinc-200 text-sm focus:outline-none focus:border-violet-500 transition-colors" />
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setEditTarget(null)}
              className="px-4 py-2 text-sm font-semibold text-zinc-400 border border-zinc-700 rounded-lg hover:border-zinc-500 transition-colors">
              Cancel
            </button>
            <button onClick={() => setEditTarget(null)}
              className="px-4 py-2 text-sm font-semibold text-white bg-violet-600 rounded-lg hover:bg-violet-500 transition-colors shadow-lg shadow-violet-900/30">
              Save
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}