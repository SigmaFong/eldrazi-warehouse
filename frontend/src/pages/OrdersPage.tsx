import { useState } from "react";
import type { Order, CardInventory, OrderStatus } from "../../types";
import { Badge } from "../components/ui/Badge";
import { Modal } from "../components/ui/Modal";
import { Table } from "../components/ui/Table";
import { createOrder } from "../api";

interface OrdersPageProps {
  orders: Order[];
  inventory: CardInventory[];
  addToast: (msg: string, type?: "success" | "error") => void;
}

interface OrderLine {
  cardId: string;
  qty: number;
}

interface OrderForm {
  distributor: string;
  status: OrderStatus;
  items: OrderLine[];
}

const STATUSES: OrderStatus[] = ["pending", "processing", "shipped", "delivered"];
const HEADERS = ["Order ID", "Distributor", "Items", "Total", "Status", "Date"];

export function OrdersPage({ orders: initOrders, inventory, addToast }: OrdersPageProps) {
  const [orders,      setOrders]     = useState<Order[]>(initOrders);
  const [showCreate,  setShowCreate] = useState(false);
  const [form,        setForm]       = useState<OrderForm>({
    distributor: "",
    status: "pending",
    items: [{ cardId: "", qty: 1 }],
  });

  const addLine    = ()               => setForm(f => ({ ...f, items: [...f.items, { cardId: "", qty: 1 }] }));
  const removeLine = (idx: number)    => setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));
  const updateLine = (idx: number, k: keyof OrderLine, v: string | number) =>
    setForm(f => { const items = [...f.items]; items[idx] = { ...items[idx], [k]: v }; return { ...f, items }; });

  const calcTotal = () =>
    form.items.reduce((s, line) => {
      const card = inventory.find(c => c.cardId === line.cardId);
      return s + (card ? card.price * line.qty : 0);
    }, 0);

  const handleCreate = async () => {
    if (!form.distributor) return;
    const newOrder = await createOrder({
      distributor: form.distributor,
      items: form.items.map(line => {
        const card = inventory.find(c => c.cardId === line.cardId);
        return { cardId: line.cardId, qty: line.qty, price: card?.price ?? 0 };
      }),
      status: form.status,
      total: calcTotal(),
    });
    setOrders(prev => [newOrder, ...prev]);
    setShowCreate(false);
    setForm({ distributor: "", status: "pending", items: [{ cardId: "", qty: 1 }] });
    addToast("Order created", "success");
  };

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-xl transition-colors shadow-lg shadow-violet-900/30"
        >
          + New Order
        </button>
      </div>

      <Table title="Distributor Orders" headers={HEADERS}>
        {orders.map(o => (
          <tr key={o.id} className="border-b border-zinc-800/50 hover:bg-violet-500/5 transition-colors">
            <td className="px-4 py-3 font-mono text-violet-400 text-[13px]">{o.id}</td>
            <td className="px-4 py-3 text-sm font-semibold text-zinc-200">{o.distributor}</td>
            <td className="px-4 py-3 text-sm text-zinc-500">{o.items.length} items</td>
            <td className="px-4 py-3 font-mono text-amber-400 text-sm">${o.total.toFixed(2)}</td>
            <td className="px-4 py-3"><Badge variant="status" value={o.status} /></td>
            <td className="px-4 py-3 font-mono text-[12px] text-zinc-500">{o.date}</td>
          </tr>
        ))}
      </Table>

      {showCreate && (
        <Modal title="Create New Order" onClose={() => setShowCreate(false)}>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block font-mono text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Distributor</label>
              <input
                placeholder="e.g. Tokyo Card Exchange"
                value={form.distributor}
                onChange={e => setForm(f => ({ ...f, distributor: e.target.value }))}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-zinc-200 text-sm focus:outline-none focus:border-violet-500 transition-colors"
              />
            </div>
            <div>
              <label className="block font-mono text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Status</label>
              <select
                value={form.status}
                onChange={e => setForm(f => ({ ...f, status: e.target.value as OrderStatus }))}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-zinc-200 text-sm focus:outline-none focus:border-violet-500 transition-colors"
              >
                {STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <label className="block font-mono text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Order Lines</label>
          <div className="space-y-2 mb-3">
            {form.items.map((line, idx) => (
              <div key={idx} className="flex gap-2 items-center">
                <select
                  value={line.cardId}
                  onChange={e => updateLine(idx, "cardId", e.target.value)}
                  className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-200 text-sm focus:outline-none focus:border-violet-500 transition-colors"
                >
                  <option value="">Select card...</option>
                  {inventory.map(c => (
                    <option key={c.cardId} value={c.cardId}>{c.name} — ${c.price}</option>
                  ))}
                </select>
                <input
                  type="number" min="1" value={line.qty}
                  onChange={e => updateLine(idx, "qty", +e.target.value)}
                  className="w-20 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-200 text-sm focus:outline-none focus:border-violet-500 transition-colors"
                />
                {form.items.length > 1 && (
                  <button
                    onClick={() => removeLine(idx)}
                    className="text-red-400 border border-red-800/40 rounded-lg px-2 py-1.5 text-sm hover:bg-red-900/20 transition-colors"
                  >✕</button>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={addLine}
            className="text-xs px-3 py-1.5 border border-zinc-700 text-zinc-400 rounded-lg hover:border-zinc-500 transition-colors font-semibold mb-4"
          >
            + Add Line
          </button>

          <div className="flex justify-between items-center bg-zinc-800 rounded-xl px-4 py-3 mb-5 font-mono text-sm">
            <span className="text-zinc-400 uppercase tracking-wider text-[11px]">Order Total</span>
            <span className="text-amber-400 font-bold">${calcTotal().toFixed(2)}</span>
          </div>

          <div className="flex justify-end gap-3">
            <button onClick={() => setShowCreate(false)}
              className="px-4 py-2 text-sm font-semibold text-zinc-400 border border-zinc-700 rounded-lg hover:border-zinc-500 transition-colors">
              Cancel
            </button>
            <button onClick={handleCreate}
              className="px-4 py-2 text-sm font-semibold text-white bg-violet-600 rounded-lg hover:bg-violet-500 transition-colors shadow-lg shadow-violet-900/30">
              Create Order
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
