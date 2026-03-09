import { useState } from "react";
import type { CardInventory, Condition, Rarity } from "../types";
import { Badge }        from "../components/ui/Badge";
import { Modal }        from "../components/ui/Modal";
import { Table }        from "../components/ui/Table";
import { useRole }      from "../hooks/useRole";
import axiosInstance    from "../api/axiosInstance";

interface InventoryPageProps {
  inventory: CardInventory[];
  onUpdate:  (id: string, patch: Partial<CardInventory>) => Promise<void>;
  addToast:  (msg: string, type?: "success" | "error") => void;
  onReload?: () => void;
}

type FilterRarity = "all" | "mythic" | "rare" | "uncommon" | "common";

interface EditForm {
  quantity:  number;
  price:     number;
  location:  string;
  condition: Condition;
}

interface AddForm {
  name:      string;
  cardId:    string;
  set:       string;
  rarity:    Rarity;
  quantity:  number;
  price:     number;
  location:  string;
  condition: Condition;
  img:       string;
}

const CONDITIONS: Condition[] = ["NM", "LP", "MP", "HP", "DMG"];
const RARITIES:   Rarity[]    = ["mythic", "rare", "uncommon", "common"];
const FILTERS: FilterRarity[] = ["all", "mythic", "rare", "uncommon", "common"];

const EMPTY_ADD: AddForm = {
  name: "", cardId: "", set: "", rarity: "rare",
  quantity: 1, price: 0, location: "", condition: "NM", img: "",
};

// Auto-generate slug from name
function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

// Rarity colour for the add form selector
const RARITY_STYLE: Record<Rarity, string> = {
  mythic:   "border-orange-500  bg-orange-900/20  text-orange-300",
  rare:     "border-yellow-500  bg-yellow-900/20  text-yellow-300",
  uncommon: "border-blue-500    bg-blue-900/20    text-blue-300",
  common:   "border-zinc-500    bg-zinc-800       text-zinc-300",
};

export function InventoryPage({ inventory, onUpdate, addToast, onReload }: InventoryPageProps) {
  const { can } = useRole();

  const [filter,     setFilter]     = useState<FilterRarity>("all");
  const [editItem,   setEditItem]   = useState<CardInventory | null>(null);
  const [deleteItem, setDeleteItem] = useState<CardInventory | null>(null);
  const [showAdd,    setShowAdd]    = useState(false);
  const [form,       setForm]       = useState<EditForm>({ quantity: 0, price: 0, location: "", condition: "NM" });
  const [addForm,    setAddForm]    = useState<AddForm>(EMPTY_ADD);
  const [saving,     setSaving]     = useState(false);
  const [adding,     setAdding]     = useState(false);
  const [deleting,   setDeleting]   = useState(false);
  const [sfFetching, setSfFetching] = useState(false);  // scryfall lookup in add modal

  // ── Fetch card data from Scryfall by name ──────────────────────────────
  const fetchFromScryfall = async () => {
    if (!addForm.name.trim()) { addToast("Enter a card name first", "error"); return; }
    setSfFetching(true);
    try {
      const { data } = await axiosInstance.get(
        `/scryfall/named?fuzzy=${encodeURIComponent(addForm.name)}`
      );
      const card = data.data.card;
      setAddForm(f => ({
        ...f,
        name:   card.name,
        cardId: slugify(card.name),
        set:    card.set ?? f.set,
        rarity: (["mythic","rare","uncommon","common"].includes(card.rarity) ? card.rarity : f.rarity) as Rarity,
        price:  card.prices?.usd ?? f.price,
        img:    card.imageUris?.normal ?? f.img,
      }));
      addToast(`Fetched: ${card.name}`, "success");
    } catch (err: any) {
      addToast(err?.response?.data?.message ?? "Card not found on Scryfall", "error");
    } finally {
      setSfFetching(false);
    }
  };

  const shown = filter === "all" ? inventory : inventory.filter(i => i.rarity === filter);

  // Table headers depend on role
  const HEADERS = ["Card", "Rarity", "Qty", "Available", "Cond.", "Price", "Location",
    ...(can("canEditInventory") ? ["Actions"] : [])];

  // ── Edit ────────────────────────────────────────────────────────────────
  const openEdit = (item: CardInventory) => {
    setEditItem(item);
    setForm({ quantity: item.quantity, price: item.price, location: item.location, condition: item.condition });
  };

  const handleSave = async () => {
    if (!editItem) return;
    setSaving(true);
    try {
      await onUpdate(editItem._id ?? editItem.id, form);
      setEditItem(null);
      addToast("Inventory updated", "success");
    } catch (err: any) {
      addToast(err?.response?.data?.message ?? "Update failed", "error");
    } finally {
      setSaving(false);
    }
  };

  // ── Add ─────────────────────────────────────────────────────────────────
  // Auto-fill cardId from name when name changes
  const handleNameChange = (name: string) => {
    setAddForm(f => ({
      ...f,
      name,
      cardId: slugify(name),
    }));
  };

  const handleAdd = async () => {
    if (!addForm.name)     { addToast("Card name is required",  "error"); return; }
    if (!addForm.set)      { addToast("Set code is required",   "error"); return; }
    if (!addForm.location) { addToast("Location is required",   "error"); return; }
    if (addForm.price < 0) { addToast("Price cannot be negative","error"); return; }

    setAdding(true);
    try {
      await axiosInstance.post("/cards", {
        ...addForm,
        set: addForm.set.toUpperCase(),
      });
      setShowAdd(false);
      setAddForm(EMPTY_ADD);
      addToast(`${addForm.name} added to inventory`, "success");
      onReload?.();
    } catch (err: any) {
      addToast(err?.response?.data?.message ?? "Failed to add card", "error");
    } finally {
      setAdding(false);
    }
  };

  // ── Delete ───────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteItem) return;
    setDeleting(true);
    try {
      await axiosInstance.delete(`/cards/${deleteItem._id ?? deleteItem.id}`);
      setDeleteItem(null);
      addToast(`${deleteItem.name} removed from inventory`, "success");
      onReload?.();
    } catch (err: any) {
      addToast(err?.response?.data?.message ?? "Failed to delete card", "error");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-5">

      {/* ── Top bar ── */}
      <div className="flex items-center justify-between">
        {!can("canEditInventory") ? (
          <div className="flex items-center gap-2 px-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-zinc-500 text-xs font-mono">
            <span className="text-amber-400">⚠</span>
            Read-only view — your role cannot edit inventory
          </div>
        ) : <div />}
        {can("canEditInventory") && (
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-xl transition-colors shadow-lg shadow-violet-900/30">
            + Add Card
          </button>
        )}
      </div>

      {/* ── Filter tabs ── */}
      <div className="flex gap-0 border-b border-zinc-800">
        {FILTERS.map(t => (
          <button key={t} onClick={() => setFilter(t)}
            className={`px-5 py-2.5 text-sm font-semibold capitalize tracking-wide border-b-2 transition-colors
              ${filter === t ? "border-violet-500 text-violet-300" : "border-transparent text-zinc-500 hover:text-zinc-300"}`}>
            {t}
          </button>
        ))}
      </div>

      {/* ── Table ── */}
      <Table title="Card Inventory — Eldrazi Colorless" subtitle={`${shown.length} entries`} headers={HEADERS}>
        {shown.map(item => {
          const avail = item.quantity - item.reserved;
          return (
            <tr key={item._id ?? item.id} className="border-b border-zinc-800/50 hover:bg-violet-500/5 transition-colors">
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

              {/* Actions — edit (admin+manager), delete (admin only) */}
              {can("canEditInventory") && (
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button onClick={() => openEdit(item)}
                      className="text-xs px-3 py-1.5 border border-zinc-700 text-zinc-400 rounded-lg hover:border-violet-500 hover:text-violet-300 transition-colors font-semibold">
                      Edit
                    </button>
                    {can("canDeleteInventory") && (
                      <button onClick={() => setDeleteItem(item)}
                        className="text-xs px-3 py-1.5 border border-red-900/40 text-red-500 rounded-lg hover:bg-red-900/20 transition-colors font-semibold">
                        Delete
                      </button>
                    )}
                  </div>
                </td>
              )}
            </tr>
          );
        })}
        {shown.length === 0 && (
          <tr><td colSpan={HEADERS.length} className="px-4 py-10 text-center font-mono text-xs text-zinc-600">No cards found</td></tr>
        )}
      </Table>

      {/* ── Add Card Modal ── */}
      {showAdd && (
        <Modal title="Add Card to Inventory" onClose={() => { setShowAdd(false); setAddForm(EMPTY_ADD); }}>

          {/* Card name + Scryfall fetch */}
          <div className="mb-4">
            <label className="block font-mono text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Card Name</label>
            <div className="flex gap-2">
              <input
                placeholder="e.g. Emrakul, the Aeons Torn"
                value={addForm.name}
                onChange={e => handleNameChange(e.target.value)}
                onKeyDown={e => e.key === "Enter" && fetchFromScryfall()}
                className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-zinc-200 text-sm focus:outline-none focus:border-violet-500 transition-colors"
              />
              <button
                type="button"
                onClick={fetchFromScryfall}
                disabled={sfFetching}
                title="Fetch card data from Scryfall"
                className="flex items-center gap-1.5 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-xs font-semibold text-violet-400 hover:border-violet-500 hover:bg-violet-500/10 disabled:opacity-50 transition-colors whitespace-nowrap flex-shrink-0"
              >
                {sfFetching
                  ? <><span className="w-3.5 h-3.5 border-2 border-violet-400/30 border-t-violet-400 rounded-full animate-spin inline-block" /> Fetching…</>
                  : <>⬡ Fetch from Scryfall</>
                }
              </button>
            </div>
            <p className="mt-1.5 font-mono text-[10px] text-zinc-600">
              Type a name and click Fetch — auto-fills set, rarity, price, and image
            </p>
          </div>

          {/* cardId — auto-filled, editable */}
          <div className="mb-4">
            <label className="block font-mono text-[10px] uppercase tracking-widest text-zinc-500 mb-2">
              Card ID <span className="text-zinc-700 normal-case tracking-normal">(auto-generated, must be unique)</span>
            </label>
            <input
              placeholder="emrakul-the-aeons-torn"
              value={addForm.cardId}
              onChange={e => setAddForm(f => ({ ...f, cardId: e.target.value }))}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 font-mono text-violet-400 text-sm focus:outline-none focus:border-violet-500 transition-colors"
            />
          </div>

          {/* Set + Rarity row */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block font-mono text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Set Code</label>
              <input
                placeholder="e.g. UMA"
                value={addForm.set}
                onChange={e => setAddForm(f => ({ ...f, set: e.target.value.toUpperCase() }))}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 font-mono uppercase text-zinc-200 text-sm focus:outline-none focus:border-violet-500 transition-colors"
              />
            </div>
            <div>
              <label className="block font-mono text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Rarity</label>
              <div className="grid grid-cols-2 gap-1.5">
                {RARITIES.map(r => (
                  <button key={r} type="button"
                    onClick={() => setAddForm(f => ({ ...f, rarity: r }))}
                    className={`py-2 rounded-lg text-xs font-bold capitalize border transition-all ${
                      addForm.rarity === r ? RARITY_STYLE[r] : "border-zinc-700 text-zinc-600 hover:border-zinc-500 hover:text-zinc-400"
                    }`}>
                    {r}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Qty + Price row */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block font-mono text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Quantity</label>
              <input type="number" min="0" value={addForm.quantity}
                onChange={e => setAddForm(f => ({ ...f, quantity: +e.target.value }))}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-zinc-200 text-sm focus:outline-none focus:border-violet-500 transition-colors" />
            </div>
            <div>
              <label className="block font-mono text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Price (USD)</label>
              <input type="number" step="0.01" min="0" value={addForm.price}
                onChange={e => setAddForm(f => ({ ...f, price: +e.target.value }))}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-zinc-200 text-sm focus:outline-none focus:border-violet-500 transition-colors" />
            </div>
          </div>

          {/* Location + Condition row */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block font-mono text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Location</label>
              <input
                placeholder="e.g. VAULT-A1"
                value={addForm.location}
                onChange={e => setAddForm(f => ({ ...f, location: e.target.value.toUpperCase() }))}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 font-mono uppercase text-zinc-200 text-sm focus:outline-none focus:border-violet-500 transition-colors" />
            </div>
            <div>
              <label className="block font-mono text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Condition</label>
              <div className="flex gap-1.5">
                {CONDITIONS.map(c => (
                  <button key={c} type="button"
                    onClick={() => setAddForm(f => ({ ...f, condition: c }))}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${
                      addForm.condition === c
                        ? "border-violet-500 bg-violet-500/20 text-violet-300"
                        : "border-zinc-700 text-zinc-600 hover:border-zinc-500 hover:text-zinc-400"
                    }`}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Live Scryfall preview — shows after fetch */}
          {addForm.img && addForm.name && (
            <div className="mb-4 flex items-center gap-4 p-3 bg-zinc-800/60 border border-violet-700/30 rounded-xl">
              <img src={addForm.img} alt={addForm.name}
                className="w-14 h-20 rounded-lg object-cover border border-zinc-700 flex-shrink-0 shadow-lg"
                onError={e => (e.currentTarget.style.display = "none")} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-violet-300 truncate">{addForm.name}</div>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="font-mono text-[10px] text-zinc-500 uppercase">{addForm.set}</span>
                  <span className="font-mono text-[10px] capitalize text-zinc-400">{addForm.rarity}</span>
                  <span className="font-mono text-[10px] text-amber-400">${addForm.price.toFixed(2)}</span>
                </div>
                <div className="font-mono text-[10px] text-emerald-500 mt-1">✓ Data fetched from Scryfall</div>
              </div>
            </div>
          )}

          {/* Image URL */}
          <div className="mb-5">
            <label className="block font-mono text-[10px] uppercase tracking-widest text-zinc-500 mb-2">
              Image URL <span className="text-zinc-700 normal-case tracking-normal">(optional — Scryfall CDN recommended)</span>
            </label>
            <div className="flex gap-3 items-start">
              <input
                placeholder="https://cards.scryfall.io/large/front/…"
                value={addForm.img}
                onChange={e => setAddForm(f => ({ ...f, img: e.target.value }))}
                className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-zinc-400 text-sm focus:outline-none focus:border-violet-500 transition-colors font-mono" />
              {addForm.img && (
                <img src={addForm.img} alt="preview"
                  className="w-10 h-14 rounded object-cover border border-zinc-700 flex-shrink-0"
                  onError={e => (e.currentTarget.style.opacity = "0.2")} />
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button onClick={() => { setShowAdd(false); setAddForm(EMPTY_ADD); }}
              className="px-4 py-2 text-sm font-semibold text-zinc-400 border border-zinc-700 rounded-lg hover:border-zinc-500 transition-colors">
              Cancel
            </button>
            <button onClick={handleAdd} disabled={adding}
              className="px-4 py-2 text-sm font-semibold text-white bg-violet-600 rounded-lg hover:bg-violet-500 disabled:opacity-50 transition-colors shadow-lg shadow-violet-900/30">
              {adding ? "Adding…" : "Add to Inventory"}
            </button>
          </div>
        </Modal>
      )}

      {/* ── Edit Modal ── */}
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
              <div className="flex gap-1.5">
                {CONDITIONS.map(c => (
                  <button key={c} type="button"
                    onClick={() => setForm(f => ({ ...f, condition: c }))}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${
                      form.condition === c
                        ? "border-violet-500 bg-violet-500/20 text-violet-300"
                        : "border-zinc-700 text-zinc-600 hover:border-zinc-500 hover:text-zinc-400"
                    }`}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-2">
            <button onClick={() => setEditItem(null)}
              className="px-4 py-2 text-sm font-semibold text-zinc-400 border border-zinc-700 rounded-lg hover:border-zinc-500 transition-colors">
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving}
              className="px-4 py-2 text-sm font-semibold text-white bg-violet-600 rounded-lg hover:bg-violet-500 disabled:opacity-50 transition-colors shadow-lg shadow-violet-900/30">
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </Modal>
      )}

      {/* ── Delete Confirm Modal ── */}
      {deleteItem && (
        <Modal title="Delete Card" onClose={() => setDeleteItem(null)}>
          <div className="flex items-center gap-3 p-4 bg-red-900/10 border border-red-800/30 rounded-xl mb-4">
            <span className="text-2xl">⚠</span>
            <div>
              <div className="text-sm font-semibold text-red-300">This card will be removed from inventory</div>
              <div className="text-xs text-zinc-500 mt-0.5">The card will be soft-deleted and hidden from all views.</div>
            </div>
          </div>

          {/* Card preview */}
          <div className="flex items-center gap-4 p-3 bg-zinc-800 rounded-xl mb-5">
            <img src={deleteItem.img} alt={deleteItem.name}
              className="w-12 h-16 rounded object-cover border border-zinc-700 flex-shrink-0"
              onError={e => (e.currentTarget.style.display = "none")} />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-zinc-200">{deleteItem.name}</div>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="rarity" value={deleteItem.rarity} />
                <Badge variant="condition" value={deleteItem.condition} />
                <span className="font-mono text-[10px] text-zinc-600">{deleteItem.set}</span>
              </div>
              <div className="font-mono text-xs text-amber-400 mt-1">
                ${deleteItem.price.toFixed(2)} · Qty: {deleteItem.quantity} · {deleteItem.location}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button onClick={() => setDeleteItem(null)}
              className="px-4 py-2 text-sm font-semibold text-zinc-400 border border-zinc-700 rounded-lg hover:border-zinc-500 transition-colors">
              Cancel
            </button>
            <button onClick={handleDelete} disabled={deleting}
              className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-500 disabled:opacity-50 transition-colors shadow-lg shadow-red-900/30">
              {deleting ? "Deleting…" : "Delete Card"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}