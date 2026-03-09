import { useState } from "react";
import type { Order, CardInventory, OrderStatus, Distributor } from "../types";
import { Badge }        from "../components/ui/Badge";
import { Modal }        from "../components/ui/Modal";
import { Table }        from "../components/ui/Table";
import { useRole }      from "../hooks/useRole";
import axiosInstance    from "../api/axiosInstance";

interface OrdersPageProps {
  orders:       Order[];
  inventory:    CardInventory[];
  distributors: Distributor[];
  addToast:     (msg: string, type?: "success" | "error") => void;
}

interface OrderLine { cardId: string; qty: number }
interface OrderForm {
  distributorId: string;
  notes:         string;
  items:         OrderLine[];
}

const ALL_STATUSES: OrderStatus[] = ["pending", "processing", "shipped", "delivered", "cancelled"];
const HEADERS = ["Order ID", "Distributor", "Items", "Total", "Status", "Date", ""];

function distName(d: Order["distributor"]): string {
  if (!d) return "—";
  if (typeof d === "string") return d;
  return d.name ?? "—";
}
function fmtDate(iso: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}
function fmtDateTime(iso: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

const STATUS_STEP: Record<OrderStatus, number> = {
  pending: 0, processing: 1, shipped: 2, delivered: 3, cancelled: -1,
};
const STATUS_STEPS: OrderStatus[] = ["pending", "processing", "shipped", "delivered"];

export function OrdersPage({ orders: initOrders, inventory, distributors, addToast }: OrdersPageProps) {
  const { can, is } = useRole();

  const [orders,      setOrders]      = useState<Order[]>(initOrders);
  const [showCreate,  setShowCreate]  = useState(false);
  const [editOrder,   setEditOrder]   = useState<Order | null>(null);
  const [deleteOrder, setDeleteOrder] = useState<Order | null>(null);
  const [viewOrder,   setViewOrder]   = useState<Order | null>(null);  // ← view detail
  const [creating,    setCreating]    = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [deleting,    setDeleting]    = useState(false);
  const [editStatus,  setEditStatus]  = useState<OrderStatus>("pending");

  const [form, setForm] = useState<OrderForm>({
    distributorId: "", notes: "", items: [{ cardId: "", qty: 1 }],
  });

  const addLine    = ()            => setForm(f => ({ ...f, items: [...f.items, { cardId: "", qty: 1 }] }));
  const removeLine = (idx: number) => setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));
  const updateLine = (idx: number, k: keyof OrderLine, v: string | number) =>
    setForm(f => { const items = [...f.items]; items[idx] = { ...items[idx], [k]: v }; return { ...f, items }; });

  const calcTotal = () =>
    form.items.reduce((s, line) => {
      const card = inventory.find(c => (c._id ?? c.id) === line.cardId);
      return s + (card ? card.price * line.qty : 0);
    }, 0);

  const handleCreate = async () => {
    if (!form.distributorId) { addToast("Please select a distributor", "error"); return; }
    const validLines = form.items.filter(l => l.cardId && l.qty > 0);
    if (!validLines.length)  { addToast("Add at least one card", "error"); return; }
    setCreating(true);
    try {
      const { data } = await axiosInstance.post("/orders", {
        distributorId: form.distributorId,
        notes:         form.notes || undefined,
        items:         validLines.map(l => ({ cardId: l.cardId, qty: l.qty })),
      });
      setOrders(prev => [data.data.order, ...prev]);
      setShowCreate(false);
      setForm({ distributorId: "", notes: "", items: [{ cardId: "", qty: 1 }] });
      addToast("Order created", "success");
    } catch (err: any) {
      addToast(err?.response?.data?.message ?? "Failed to create order", "error");
    } finally {
      setCreating(false);
    }
  };

  const openEdit = (o: Order) => { setEditOrder(o); setEditStatus(o.status); };

  const handleSaveStatus = async () => {
    if (!editOrder) return;
    setSaving(true);
    try {
      const { data } = await axiosInstance.patch(`/orders/${editOrder._id}/status`, { status: editStatus });
      setOrders(prev => prev.map(o => o._id === editOrder._id ? data.data.order : o));
      setEditOrder(null);
      addToast("Order status updated", "success");
    } catch (err: any) {
      addToast(err?.response?.data?.message ?? "Failed to update status", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteOrder) return;
    setDeleting(true);
    try {
      await axiosInstance.delete(`/orders/${deleteOrder._id}`);
      setOrders(prev => prev.filter(o => o._id !== deleteOrder._id));
      setDeleteOrder(null);
      addToast("Order deleted", "success");
    } catch (err: any) {
      addToast(err?.response?.data?.message ?? "Failed to delete order", "error");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-5">

      {/* Top bar */}
      <div className="flex items-center justify-between">
        {!can("canCreateOrder") ? (
          <div className="flex items-center gap-2 px-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-zinc-500 text-xs font-mono">
            <span className="text-amber-400">⚠</span>
            {is("distributor") ? "Showing your orders — contact a manager to place new orders" : "Read-only — your role cannot create orders"}
          </div>
        ) : <div />}
        {can("canCreateOrder") && (
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-xl transition-colors shadow-lg shadow-violet-900/30">
            + New Order
          </button>
        )}
      </div>

      {/* Table */}
      <Table title="Distributor Orders" subtitle={`${orders.length} orders`} headers={HEADERS}>
        {orders.map(o => (
          <tr key={o.orderId ?? o._id} className="border-b border-zinc-800/50 hover:bg-violet-500/5 transition-colors">
            <td className="px-4 py-3 font-mono text-violet-400 text-[13px]">{o.orderId}</td>
            <td className="px-4 py-3 text-sm font-semibold text-zinc-200">{distName(o.distributor)}</td>
            <td className="px-4 py-3 text-sm text-zinc-500">{o.items.length} items</td>
            <td className="px-4 py-3 font-mono text-amber-400 text-sm">${o.total?.toFixed(2) ?? "—"}</td>
            <td className="px-4 py-3"><Badge variant="status" value={o.status} /></td>
            <td className="px-4 py-3 font-mono text-[12px] text-zinc-500">{fmtDate(o.createdAt)}</td>
            <td className="px-4 py-3">
              <div className="flex items-center gap-2">
                {/* View detail — available to ALL roles */}
                <button onClick={() => setViewOrder(o)}
                  className="text-xs px-3 py-1.5 border border-zinc-700 text-zinc-400 rounded-lg hover:border-blue-500 hover:text-blue-300 transition-colors font-semibold">
                  View
                </button>
                {/* Edit status — admin/manager */}
                {can("canChangeOrderStatus") && (
                  <button onClick={() => openEdit(o)}
                    className="text-xs px-3 py-1.5 border border-zinc-700 text-zinc-400 rounded-lg hover:border-violet-500 hover:text-violet-300 transition-colors font-semibold">
                    Edit
                  </button>
                )}
                {/* Delete — admin only */}
                {can("canCancelOrder") && (
                  <button onClick={() => setDeleteOrder(o)}
                    className="text-xs px-3 py-1.5 border border-red-900/40 text-red-500 rounded-lg hover:bg-red-900/20 transition-colors font-semibold">
                    Delete
                  </button>
                )}
              </div>
            </td>
          </tr>
        ))}
        {orders.length === 0 && (
          <tr><td colSpan={7} className="px-4 py-10 text-center font-mono text-xs text-zinc-600">No orders found</td></tr>
        )}
      </Table>

      {/* ── View Detail Modal — all roles ── */}
      {viewOrder && (
        <Modal title={`Order Detail — ${viewOrder.orderId}`} onClose={() => setViewOrder(null)}>

          {/* Status progress bar */}
          {viewOrder.status !== "cancelled" ? (
            <div className="mb-5">
              <div className="flex items-center justify-between mb-2">
                {STATUS_STEPS.map((s, i) => {
                  const currentStep = STATUS_STEP[viewOrder.status] ?? 0;
                  const done    = i <= currentStep;
                  const active  = i === currentStep;
                  return (
                    <div key={s} className="flex-1 flex flex-col items-center gap-1.5">
                      {/* connector line */}
                      <div className="w-full flex items-center">
                        <div className={`flex-1 h-px ${i === 0 ? "opacity-0" : done ? "bg-violet-500" : "bg-zinc-700"}`} />
                        <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all flex-shrink-0 ${
                          active  ? "border-violet-400 bg-violet-500/20 text-violet-300 shadow-[0_0_12px_rgba(139,92,246,.5)]"
                          : done  ? "border-violet-600 bg-violet-900/40 text-violet-400"
                          :         "border-zinc-700   bg-zinc-800       text-zinc-600"
                        }`}>
                          {done && !active ? "✓" : i + 1}
                        </div>
                        <div className={`flex-1 h-px ${i === STATUS_STEPS.length - 1 ? "opacity-0" : done && i < currentStep ? "bg-violet-500" : "bg-zinc-700"}`} />
                      </div>
                      <span className={`text-[9px] font-mono uppercase tracking-wider capitalize ${active ? "text-violet-300" : done ? "text-violet-500" : "text-zinc-600"}`}>
                        {s}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="mb-5 flex items-center gap-2 px-4 py-3 bg-red-900/10 border border-red-800/30 rounded-xl text-red-400 text-sm font-semibold">
              <span>✕</span> This order was cancelled
            </div>
          )}

          {/* Order meta */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            {[
              ["Order ID",    viewOrder.orderId,                         "font-mono text-violet-400"],
              ["Distributor", distName(viewOrder.distributor),           "font-semibold text-zinc-200"],
              ["Status",      viewOrder.status,                          "capitalize"],
              ["Date",        fmtDateTime(viewOrder.createdAt),          "font-mono text-zinc-400 text-xs"],
              ["Total",       `$${viewOrder.total?.toFixed(2) ?? "—"}`,  "font-mono text-amber-400 font-bold"],
              ["Items",       `${viewOrder.items.length} card line${viewOrder.items.length !== 1 ? "s" : ""}`, "text-zinc-300"],
            ].map(([label, value, cls]) => (
              <div key={label} className="bg-zinc-800 border border-zinc-700/50 rounded-xl px-3 py-2.5">
                <div className="font-mono text-[9px] uppercase tracking-widest text-zinc-600 mb-1">{label}</div>
                <div className={`text-sm ${cls}`}>{value}</div>
              </div>
            ))}
          </div>

          {/* Notes */}
          {viewOrder.notes && (
            <div className="mb-4 px-3 py-2.5 bg-zinc-800 border border-zinc-700/50 rounded-xl">
              <div className="font-mono text-[9px] uppercase tracking-widest text-zinc-600 mb-1">Notes</div>
              <div className="text-sm text-zinc-300">{viewOrder.notes}</div>
            </div>
          )}

          {/* Items table */}
          <div className="mb-2">
            <div className="font-mono text-[10px] uppercase tracking-widest text-zinc-600 mb-2">
              Order Items ({viewOrder.items.length})
            </div>
            <div className="rounded-xl border border-zinc-700/50 overflow-hidden">
              <div className="grid grid-cols-12 px-3 py-2 bg-zinc-800/80 border-b border-zinc-700/50">
                <span className="col-span-6 font-mono text-[9px] uppercase tracking-widest text-zinc-600">Card</span>
                <span className="col-span-2 font-mono text-[9px] uppercase tracking-widest text-zinc-600 text-center">Qty</span>
                <span className="col-span-2 font-mono text-[9px] uppercase tracking-widest text-zinc-600 text-right">Unit Price</span>
                <span className="col-span-2 font-mono text-[9px] uppercase tracking-widest text-zinc-600 text-right">Subtotal</span>
              </div>
              <div className="divide-y divide-zinc-800/60">
                {viewOrder.items.map((item, i) => {
                  // try to find card image from local inventory
                  const localCard = inventory.find(c => c.cardId === item.cardId);
                  return (
                    <div key={i} className="grid grid-cols-12 px-3 py-3 hover:bg-zinc-800/40 transition-colors">
                      <div className="col-span-6 flex items-center gap-2.5">
                        {localCard?.img && (
                          <img src={localCard.img} alt={item.cardName}
                            className="w-7 h-9 rounded object-cover border border-zinc-700 flex-shrink-0"
                            onError={e => (e.currentTarget.style.display = "none")} />
                        )}
                        <div>
                          <div className="text-sm font-semibold text-zinc-200 leading-snug">{item.cardName}</div>
                          {localCard && (
                            <div className="font-mono text-[9px] text-zinc-600 capitalize">{localCard.rarity} · {localCard.set}</div>
                          )}
                        </div>
                      </div>
                      <div className="col-span-2 flex items-center justify-center">
                        <span className="font-mono text-sm font-bold text-zinc-300">×{item.qty}</span>
                      </div>
                      <div className="col-span-2 flex items-center justify-end">
                        <span className="font-mono text-sm text-zinc-400">${item.price.toFixed(2)}</span>
                      </div>
                      <div className="col-span-2 flex items-center justify-end">
                        <span className="font-mono text-sm font-bold text-amber-400">${(item.price * item.qty).toFixed(2)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* Total footer */}
              <div className="grid grid-cols-12 px-3 py-3 bg-zinc-800/60 border-t border-zinc-700/50">
                <div className="col-span-10 font-mono text-[10px] uppercase tracking-widest text-zinc-500 flex items-center">
                  Order Total
                </div>
                <div className="col-span-2 text-right font-mono text-base font-black text-amber-400">
                  ${viewOrder.total?.toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <button onClick={() => setViewOrder(null)}
              className="px-5 py-2 text-sm font-semibold text-zinc-400 border border-zinc-700 rounded-lg hover:border-zinc-500 transition-colors">
              Close
            </button>
          </div>
        </Modal>
      )}

      {/* ── Create Modal ── */}
      {showCreate && (
        <Modal title="Create New Order" onClose={() => setShowCreate(false)}>
          <div className="mb-4">
            <label className="block font-mono text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Distributor</label>
            <select value={form.distributorId}
              onChange={e => setForm(f => ({ ...f, distributorId: e.target.value }))}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-zinc-200 text-sm focus:outline-none focus:border-violet-500 transition-colors">
              <option value="">— Select distributor —</option>
              {distributors.map(d => (
                <option key={d._id ?? d.id} value={d._id ?? d.id}>
                  {d.name} · {d.country} · {d.tier}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-4">
            <label className="block font-mono text-[10px] uppercase tracking-widest text-zinc-500 mb-2">
              Notes <span className="text-zinc-700">(optional)</span>
            </label>
            <input placeholder="e.g. Priority shipment…"
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-zinc-200 text-sm focus:outline-none focus:border-violet-500 transition-colors" />
          </div>
          <label className="block font-mono text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Order Lines</label>
          <div className="space-y-2 mb-3 max-h-52 overflow-y-auto pr-1">
            {form.items.map((line, idx) => {
              const selectedCard = inventory.find(c => (c._id ?? c.id) === line.cardId);
              const available    = selectedCard ? selectedCard.quantity - selectedCard.reserved : 0;
              return (
                <div key={idx} className="flex gap-2 items-center">
                  <select value={line.cardId}
                    onChange={e => updateLine(idx, "cardId", e.target.value)}
                    className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-200 text-sm focus:outline-none focus:border-violet-500 transition-colors">
                    <option value="">Select card…</option>
                    {inventory.map(c => {
                      const avail = c.quantity - c.reserved;
                      return (
                        <option key={c._id ?? c.id} value={c._id ?? c.id} disabled={avail === 0}>
                          {c.name} — ${c.price.toFixed(2)} ({avail > 0 ? `${avail} avail` : "out of stock"})
                        </option>
                      );
                    })}
                  </select>
                  <input type="number" min="1"
                    max={selectedCard ? selectedCard.quantity - selectedCard.reserved : undefined}
                    value={line.qty}
                    onChange={e => updateLine(idx, "qty", +e.target.value)}
                    className="w-20 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-200 text-sm focus:outline-none focus:border-violet-500 transition-colors" />
                  {selectedCard && (
                    <span className={`text-[10px] font-mono w-16 text-right flex-shrink-0 ${available < 5 ? "text-amber-400" : "text-zinc-600"}`}>
                      {available} avail
                    </span>
                  )}
                  {form.items.length > 1 && (
                    <button onClick={() => removeLine(idx)}
                      className="text-red-400 border border-red-800/40 rounded-lg px-2 py-1.5 text-sm hover:bg-red-900/20 transition-colors flex-shrink-0">✕</button>
                  )}
                </div>
              );
            })}
          </div>
          <button onClick={addLine}
            className="text-xs px-3 py-1.5 border border-zinc-700 text-zinc-400 rounded-lg hover:border-zinc-500 transition-colors font-semibold mb-4">
            + Add Line
          </button>
          <div className="flex justify-between items-center bg-zinc-800 rounded-xl px-4 py-3 mb-5">
            <span className="font-mono text-[11px] text-zinc-400 uppercase tracking-wider">Estimated Total</span>
            <span className="font-mono text-amber-400 font-bold text-base">${calcTotal().toFixed(2)}</span>
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setShowCreate(false)}
              className="px-4 py-2 text-sm font-semibold text-zinc-400 border border-zinc-700 rounded-lg hover:border-zinc-500 transition-colors">Cancel</button>
            <button onClick={handleCreate} disabled={creating}
              className="px-4 py-2 text-sm font-semibold text-white bg-violet-600 rounded-lg hover:bg-violet-500 disabled:opacity-50 transition-colors shadow-lg shadow-violet-900/30">
              {creating ? "Creating…" : "Create Order"}
            </button>
          </div>
        </Modal>
      )}

      {/* ── Edit Status Modal ── */}
      {editOrder && (
        <Modal title={`Edit Order — ${editOrder.orderId}`} onClose={() => setEditOrder(null)}>
          <div className="flex items-center gap-6 p-3 bg-zinc-800 rounded-xl mb-5">
            <div><div className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Distributor</div>
              <div className="text-sm font-semibold text-zinc-200">{distName(editOrder.distributor)}</div></div>
            <div><div className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Items</div>
              <div className="text-sm font-semibold text-zinc-200">{editOrder.items.length} cards</div></div>
            <div><div className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Total</div>
              <div className="text-sm font-bold text-amber-400 font-mono">${editOrder.total?.toFixed(2)}</div></div>
          </div>
          <label className="block font-mono text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Status</label>
          <div className="grid grid-cols-5 gap-2 mb-5">
            {ALL_STATUSES.map(s => (
              <button key={s} onClick={() => setEditStatus(s)}
                className={`py-2.5 rounded-xl text-xs font-bold uppercase tracking-wide border transition-all ${
                  editStatus === s
                    ? s === "cancelled" ? "border-red-500 bg-red-900/20 text-red-300"
                    : s === "delivered" ? "border-emerald-500 bg-emerald-900/20 text-emerald-300"
                    : "border-violet-500 bg-violet-500/20 text-violet-300"
                    : "border-zinc-700 text-zinc-600 hover:border-zinc-500 hover:text-zinc-400"
                }`}>{s}</button>
            ))}
          </div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-zinc-600 mb-2">Order Items</div>
          <div className="space-y-1.5 max-h-40 overflow-y-auto mb-4">
            {editOrder.items.map((item, i) => (
              <div key={i} className="flex items-center justify-between px-3 py-2 bg-zinc-800 rounded-lg">
                <span className="text-xs text-zinc-300">{item.cardName}</span>
                <div className="flex items-center gap-3 text-xs font-mono">
                  <span className="text-zinc-500">×{item.qty}</span>
                  <span className="text-amber-400">${(item.price * item.qty).toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setEditOrder(null)}
              className="px-4 py-2 text-sm font-semibold text-zinc-400 border border-zinc-700 rounded-lg hover:border-zinc-500 transition-colors">Cancel</button>
            <button onClick={handleSaveStatus} disabled={saving}
              className="px-4 py-2 text-sm font-semibold text-white bg-violet-600 rounded-lg hover:bg-violet-500 disabled:opacity-50 transition-colors shadow-lg shadow-violet-900/30">
              {saving ? "Saving…" : "Save Status"}
            </button>
          </div>
        </Modal>
      )}

      {/* ── Delete Confirm Modal ── */}
      {deleteOrder && (
        <Modal title="Delete Order" onClose={() => setDeleteOrder(null)}>
          <div className="flex items-center gap-3 p-4 bg-red-900/10 border border-red-800/30 rounded-xl mb-4">
            <span className="text-2xl">⚠</span>
            <div>
              <div className="text-sm font-semibold text-red-300">This action cannot be undone</div>
              <div className="text-xs text-zinc-500 mt-0.5">The order will be soft-deleted and hidden from all views.</div>
            </div>
          </div>
          <div className="space-y-2 mb-6 text-sm">
            {([
              ["Order ID",    deleteOrder.orderId,                      "font-mono text-violet-400"],
              ["Distributor", distName(deleteOrder.distributor),        "font-semibold text-zinc-200"],
              ["Total",       `$${deleteOrder.total?.toFixed(2)}`,      "font-mono text-amber-400"],
              ["Status",      deleteOrder.status,                       "capitalize text-zinc-300"],
            ] as [string, string, string][]).map(([label, value, cls]) => (
              <div key={label} className="flex justify-between px-3 py-2 bg-zinc-800 rounded-lg">
                <span className="text-zinc-500 font-mono text-xs uppercase tracking-widest">{label}</span>
                <span className={cls}>{value}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setDeleteOrder(null)}
              className="px-4 py-2 text-sm font-semibold text-zinc-400 border border-zinc-700 rounded-lg hover:border-zinc-500 transition-colors">Cancel</button>
            <button onClick={handleDelete} disabled={deleting}
              className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-500 disabled:opacity-50 transition-colors shadow-lg shadow-red-900/30">
              {deleting ? "Deleting…" : "Delete Order"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}