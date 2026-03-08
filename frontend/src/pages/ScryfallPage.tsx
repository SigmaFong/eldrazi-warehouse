import { useState } from "react";
import type { CardInventory, ScryfallCard } from "../../types";
import { Table } from "../components/ui/Table";
import { fetchScryfallById, searchScryfallEldrazi } from "../api";

interface ScryfallPageProps {
  inventory: CardInventory[];
  addToast: (msg: string, type?: "success" | "error") => void;
}

type Tab = "lookup" | "search";

const CROSS_HEADERS = ["Card", "Local Stock", "Local Price", "Scryfall EUR", "Scryfall USD", "Status"];

export function ScryfallPage({ inventory, addToast }: ScryfallPageProps) {
  const [tab,     setTab]     = useState<Tab>("lookup");
  const [cardId,  setCardId]  = useState("379041");
  const [fetched, setFetched] = useState<ScryfallCard | null>(null);
  const [results, setResults] = useState<ScryfallCard[]>([]);
  const [loading, setLoading] = useState(false);

  const handleLookup = async () => {
    setLoading(true); setFetched(null);
    const data = await fetchScryfallById(cardId);
    setFetched(data);
    setLoading(false);
    if (!data || data.object === "error") addToast("Card not found", "error");
  };

  const handleSearch = async () => {
    setLoading(true);
    const data = await searchScryfallEldrazi();
    setResults(data.slice(0, 12));
    setLoading(false);
  };

  return (
    <div className="space-y-5">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
        {/* header */}
        <div className="flex items-center gap-3 mb-5">
          <span className="font-bold text-zinc-200 text-sm tracking-wide" style={{ fontFamily: "'Cinzel Decorative', serif" }}>
            Scryfall API Explorer
          </span>
          <span className="font-mono text-[9px] bg-violet-500/20 text-violet-300 border border-violet-500/40 px-2 py-0.5 rounded uppercase tracking-wider">
            Live API
          </span>
          <span className="text-zinc-600 text-xs font-mono">GET /cards/cardmarket/:id</span>
        </div>

        {/* tabs */}
        <div className="flex gap-0 border-b border-zinc-800 mb-5">
          {(["lookup", "search"] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-5 py-2.5 text-sm font-semibold capitalize tracking-wide border-b-2 transition-colors
                ${tab === t ? "border-violet-500 text-violet-300" : "border-transparent text-zinc-500 hover:text-zinc-300"}`}>
              {t === "lookup" ? "Card Lookup by ID" : "Eldrazi Search"}
            </button>
          ))}
        </div>

        {tab === "lookup" && (
          <div>
            <div className="flex items-center gap-3 flex-wrap mb-4">
              <span className="font-mono text-[11px] text-zinc-600">api.scryfall.com/cards/cardmarket/</span>
              <input
                value={cardId}
                onChange={e => setCardId(e.target.value)}
                className="w-36 bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 font-mono text-sm text-zinc-200 focus:outline-none focus:border-violet-500 transition-colors"
              />
              <button
                onClick={handleLookup}
                disabled={loading}
                className="px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                {loading ? "Fetching…" : "→ Fetch"}
              </button>
            </div>

            {loading && <Spinner label="FETCHING FROM SCRYFALL" />}

            {fetched && fetched.object !== "error" && (
              <div className="flex gap-6 mt-4 items-start">
                {fetched.image_uris && (
                  <img src={fetched.image_uris.normal} alt={fetched.name}
                    className="w-48 rounded-xl border border-zinc-700 shadow-2xl shadow-violet-900/30 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <div className="text-lg font-black text-violet-300 mb-1" style={{ fontFamily: "'Cinzel Decorative', serif" }}>
                    {fetched.name}
                  </div>
                  <div className="text-zinc-500 text-sm mb-4">{fetched.type_line}</div>
                  {fetched.oracle_text && (
                    <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-4 text-sm text-zinc-300 leading-relaxed mb-4 whitespace-pre-line">
                      {fetched.oracle_text}
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    {([
                      ["Set",    fetched.set_name],
                      ["Rarity", fetched.rarity],
                      ["EUR",    `€${fetched.prices?.eur ?? "N/A"}`],
                      ["USD",    `$${fetched.prices?.usd ?? "N/A"}`],
                      ...(fetched.mana_cost ? [["Mana", fetched.mana_cost]] : []),
                      ...(fetched.power ? [["P/T", `${fetched.power}/${fetched.toughness}`]] : []),
                    ] as [string, string][]).map(([k, v]) => (
                      <div key={k} className="bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3">
                        <div className="font-mono text-[9px] uppercase tracking-widest text-zinc-600 mb-1">{k}</div>
                        <div className={`text-sm font-bold capitalize ${["EUR","USD"].includes(k) ? "text-amber-400" : "text-zinc-200"}`}>{v}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {fetched?.object === "error" && (
              <div className="mt-4 font-mono text-xs text-red-400 bg-red-900/10 border border-red-800/30 rounded-xl p-4">
                API Error: {fetched.details}
              </div>
            )}
          </div>
        )}

        {tab === "search" && (
          <div>
            <button onClick={handleSearch} disabled={loading}
              className="mb-5 flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors">
              {loading ? <><Spinner inline /> Searching…</> : "🔍 Search Eldrazi on Scryfall"}
            </button>

            {!loading && results.length === 0 && (
              <div className="py-10 text-center font-mono text-xs text-zinc-600">
                Click search to pull Eldrazi cards from Scryfall API
              </div>
            )}

            {results.length > 0 && (
              <div className="grid grid-cols-4 gap-4">
                {results.map(card => (
                  <div key={card.id}
                    className="bg-zinc-800 border border-zinc-700 rounded-xl overflow-hidden cursor-pointer hover:border-violet-500 hover:-translate-y-1 transition-all shadow-lg hover:shadow-violet-900/20">
                    {card.image_uris && <img src={card.image_uris.small} alt={card.name} className="w-full" />}
                    <div className="p-3">
                      <div className="text-xs font-semibold text-zinc-200 mb-1 leading-snug">{card.name}</div>
                      <div className="font-mono text-[10px] text-amber-400">${card.prices?.usd ?? "—"}</div>
                      <div className="font-mono text-[9px] text-zinc-600 mt-0.5">{card.set_name}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* cross-reference */}
      <Table title="Inventory × Scryfall Cross-Reference" headers={CROSS_HEADERS}>
        {inventory.slice(0, 5).map(item => (
          <tr key={item.id} className="border-b border-zinc-800/50 hover:bg-violet-500/5 transition-colors">
            <td className="px-4 py-3">
              <div className="flex items-center gap-3">
                <img src={item.img} alt={item.name}
                  className="w-9 h-12 rounded object-cover border border-zinc-700 flex-shrink-0"
                  onError={e => (e.currentTarget.style.display = "none")} />
                <div>
                  <div className="text-sm font-semibold text-zinc-200">{item.name}</div>
                  <div className="font-mono text-[10px] text-zinc-600">{item.set}</div>
                </div>
              </div>
            </td>
            <td className="px-4 py-3 text-sm font-bold text-zinc-200">{item.quantity}</td>
            <td className="px-4 py-3 font-mono text-amber-400 text-sm">${item.price.toFixed(2)}</td>
            <td className="px-4 py-3 font-mono text-zinc-600 text-sm">—</td>
            <td className="px-4 py-3 font-mono text-zinc-600 text-sm">—</td>
            <td className="px-4 py-3 text-xs font-semibold text-emerald-400">✓ In Vault</td>
          </tr>
        ))}
      </Table>
    </div>
  );
}

// ── inline helpers ──────────────────────────────────────────
function Spinner({ label, inline }: { label?: string; inline?: boolean }) {
  if (inline) return <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />;
  return (
    <div className="flex items-center justify-center gap-3 py-10 text-zinc-600 font-mono text-xs">
      <div className="w-4 h-4 border-2 border-zinc-700 border-t-violet-500 rounded-full animate-spin" />
      {label}
    </div>
  );
}
