import { useState } from "react";
import type { CardInventory, Condition } from "../types";
import { Badge } from "../components/ui/Badge";
import { Modal } from "../components/ui/Modal";
import { Table } from "../components/ui/Table";

interface InventoryPageProps {
  inventory: CardInventory[];
  onUpdate: (id: string, patch: Partial<CardInventory>) => Promise<void>;
  addToast: (msg: string, type?: "success" | "error") => void;
}

type FilterRarity = "all" | "mythic" | "rare" | "uncommon";

interface EditForm {
  quantity:  number;
  price:     number;
  location:  string;
  condition: Condition;
}

const CONDITIONS: Condition[] = ["NM", "LP", "MP", "HP", "DMG"];
const FILTERS: FilterRarity[] = ["all", "mythic", "rare", "uncommon"];
const HEADERS = ["Card", "Rarity", "Qty", "Available", "Cond.", "Price", "Location", ""];

export function InventoryPage({ inventory, onUpdate, addToast }: InventoryPageProps) {
  const [filter,   setFilter]   = useState<FilterRarity>("all");
  const [editItem, setEditItem] = useState<CardInventory | null>(null);
  const [form,     setForm]     = useState<EditForm>({ quantity: 0, price: 0, location: "", condition: "NM" });

  const shown = filter === "all" ? inventory : inventory.filter(i => i.rarity === filter);

  const openEdit = (item: CardInventory) => {
    setEditItem(item);
    setForm({ quantity: item.quantity, price: item.price, location: item.location, condition: item.condition });
  };

  const save = async () => {
    if (!editItem) return;
    await onUpdate(editItem.id, form);
    setEditItem(null);
    addToast("Inventory updated", "success");
  };

  return (
    <div className="space-y-5">
      {/* filter tabs */}
      <div className="flex gap-0 border-b border-zinc-800">
        {FILTERS.map(t => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`px-5 py-2.5 text-sm font-semibold capitalize tracking-wide border-b-2 transition-colors
              ${filter === t ? "border-violet-500 text-violet-300" : "border-transparent text-zinc-500 hover:text-zinc-300"}`}
          >
            {t}
          </button>
        ))}
      </div>

      <Table title="Card Inventory — Eldrazi Colorless" subtitle={`${shown.length} entries`} headers={HEADERS}>
        {shown.map(item => {
          const avail = item.quantity - item.reserved;
          return (
            <tr key={item.id} className="border-b border-zinc-800/50 hover:bg-violet-500/5 transition-colors">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <img src={item.img} alt={item.name}
                    className="w-9 h-12 rounded object-cover border border-zinc-700 flex-shrink-0"
                    onError={e => (e.currentTarget.style.display = "none")} />
                  <div>
                    <div className="text-sm font-semibold text-zinc-200">{item.name}</div>
                    <div className="font-mono text-[10px] text-zinc-500">{item.set}</div>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3"><Badge variant="rarity" value={item.rarity} /></td>
              <td className="px-4 py-3">
                <div className="text-sm font-bold text-zinc-200">{item.quantity}</div>
                <div className="font-mono text-[10px] text-zinc-600">Res: {item.reserved}</div>
              </td>
              <td className="px-4 py-3">
                <span className={`text-sm font-bold ${avail < 5 ? "text-amber-400" : "text-emerald-400"}`}>{avail}</span>
              </td>
              <td className="px-4 py-3"><Badge variant="condition" value={item.condition} /></td>
              <td className="px-4 py-3 font-mono text-amber-400 text-sm">${item.price.toFixed(2)}</td>
              <td className="px-4 py-3">
                <span className="font-mono text-[11px] bg-zinc-800 border border-zinc-700 text-violet-400 px-2 py-1 rounded">
                  {item.location}
                </span>
              </td>
              <td className="px-4 py-3">
                <button
                  onClick={() => openEdit(item)}
                  className="text-xs px-3 py-1.5 border border-zinc-700 text-zinc-400 rounded-lg hover:border-violet-500 hover:text-violet-300 transition-colors font-semibold"
                >
                  Edit
                </button>
              </td>
            </tr>
          );
        })}
      </Table>

      {editItem && (
        <Modal title={`Edit — ${editItem.name}`} onClose={() => setEditItem(null)}>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block font-mono text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Quantity</label>
              <input type="number" value={form.quantity}
                onChange={e => setForm(f => ({ ...f, quantity: +e.target.value }))}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-zinc-200 text-sm focus:outline-none focus:border-violet-500 transition-colors" />
            </div>
            <div>
              <label className="block font-mono text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Price (USD)</label>
              <input type="number" step="0.01" value={form.price}
                onChange={e => setForm(f => ({ ...f, price: +e.target.value }))}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-zinc-200 text-sm focus:outline-none focus:border-violet-500 transition-colors" />
            </div>
            <div>
              <label className="block font-mono text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Location</label>
              <input value={form.location}
                onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-zinc-200 text-sm focus:outline-none focus:border-violet-500 transition-colors" />
            </div>
            <div>
              <label className="block font-mono text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Condition</label>
              <select value={form.condition}
                onChange={e => setForm(f => ({ ...f, condition: e.target.value as Condition }))}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-zinc-200 text-sm focus:outline-none focus:border-violet-500 transition-colors">
                {CONDITIONS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-2">
            <button onClick={() => setEditItem(null)}
              className="px-4 py-2 text-sm font-semibold text-zinc-400 border border-zinc-700 rounded-lg hover:border-zinc-500 transition-colors">
              Cancel
            </button>
            <button onClick={save}
              className="px-4 py-2 text-sm font-semibold text-white bg-violet-600 rounded-lg hover:bg-violet-500 transition-colors shadow-lg shadow-violet-900/30">
              Save Changes
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
