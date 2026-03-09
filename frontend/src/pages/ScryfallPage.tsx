import { useState } from "react";
import type { CardInventory } from "../types";
import { Table }        from "../components/ui/Table";
import { Badge }        from "../components/ui/Badge";
import { useRole }      from "../hooks/useRole";
import axiosInstance    from "../api/axiosInstance";

interface ScryfallPageProps {
  inventory: CardInventory[];
  addToast:  (msg: string, type?: "success" | "error") => void;
  onReload?: () => void;
}

// ── Scryfall card shape (backend transformed) ─────────────────────────────
interface ScryfallResult {
  scryfallId:      string;
  name:            string;
  typeLine:        string;
  oracleText?:     string;
  manaCost?:       string;
  cmc?:            number;
  colors?:         string[];
  power?:          string;
  toughness?:      string;
  rarity:          string;
  set:             string;
  setName:         string;
  collectorNumber? :string;
  artist?:         string;
  imageUris?:      { small: string; normal: string; large: string };
  prices:          { usd: number | null; usdFoil: number | null; eur: number | null; eurFoil: number | null; tix: number | null };
  legalities?:     Record<string, string>;
  edhrecRank?:     number;
  cardmarketId?:   number;
}

// Legality formats to show
const SHOW_FORMATS = ["commander", "modern", "legacy", "vintage", "pioneer", "pauper"] as const;

const RARITY_COLOR: Record<string, string> = {
  mythic:   "text-orange-400",
  rare:     "text-yellow-400",
  uncommon: "text-blue-400",
  common:   "text-zinc-400",
};

const LEGAL_STYLE: Record<string, string> = {
  legal:     "bg-emerald-900/30 border-emerald-700/40 text-emerald-400",
  not_legal: "bg-zinc-800/50    border-zinc-700/40    text-zinc-600",
  banned:    "bg-red-900/30     border-red-700/40     text-red-400",
  restricted:"bg-amber-900/30   border-amber-700/40   text-amber-400",
};

type Tab = "lookup" | "search";
const CROSS_HEADERS = ["Card", "Local Qty", "Local Price", "Scryfall USD", "Diff", ""];

export function ScryfallPage({ inventory, addToast, onReload }: ScryfallPageProps) {
  const { can } = useRole();

  const [tab,       setTab]      = useState<Tab>("lookup");
  const [query,     setQuery]    = useState("");
  const [fetched,   setFetched]  = useState<ScryfallResult | null>(null);
  const [searchQ,   setSearchQ]  = useState("is:colorless type:eldrazi");
  const [results,   setResults]  = useState<ScryfallResult[]>([]);
  const [loading,   setLoading]  = useState(false);
  const [syncing,   setSyncing]  = useState<string | null>(null);
  const [crossData, setCrossData]= useState<Record<string, ScryfallResult>>({});
  const [crossLoading, setCrossLoading] = useState(false);

  // ── Fuzzy name lookup ─────────────────────────────────────────────────
  const handleLookup = async () => {
    const q = query.trim();
    if (!q) { addToast("Enter a card name", "error"); return; }
    setLoading(true);
    setFetched(null);
    try {
      const { data } = await axiosInstance.get(`/scryfall/named?fuzzy=${encodeURIComponent(q)}`);
      setFetched(data.data.card);
    } catch (err: any) {
      addToast(err?.response?.data?.message ?? "Card not found", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleLookup();
  };

  // ── Scryfall search ───────────────────────────────────────────────────
  const handleSearch = async () => {
    setLoading(true);
    try {
      const { data } = await axiosInstance.get(`/scryfall/search?q=${encodeURIComponent(searchQ)}&order=edhrec`);
      setResults(data.data.cards.slice(0, 12));
    } catch (err: any) {
      addToast(err?.response?.data?.message ?? "Search failed", "error");
    } finally {
      setLoading(false);
    }
  };

  // ── Sync a single card's price to inventory ───────────────────────────
  const handleSync = async (cardId: string, cardName: string) => {
    setSyncing(cardId);
    try {
      const { data } = await axiosInstance.post(`/scryfall/sync/${cardId}`);
      const { newPrice, eur } = data.data.synced ?? {};
      addToast(
        `${cardName} synced → $${newPrice?.toFixed(2) ?? "?"}${eur ? ` / €${eur.toFixed(2)}` : ""}`,
        "success"
      );
      onReload?.();   // re-fetch inventory so table shows updated price
    } catch (err: any) {
      addToast(err?.response?.data?.message ?? "Sync failed — card may not exist on Scryfall", "error");
    } finally {
      setSyncing(null);
    }
  };

  // ── Fetch Scryfall prices for entire inventory (cross-ref) ────────────
  const handleFetchCrossRef = async () => {
    setCrossLoading(true);
    const result: Record<string, ScryfallResult> = {};
    for (const item of inventory) {
      try {
        const { data } = await axiosInstance.get(
          `/scryfall/named?fuzzy=${encodeURIComponent(item.name)}`
        );
        result[item.cardId] = data.data.card;
      } catch {
        // skip cards not found on Scryfall
      }
    }
    setCrossData(result);
    setCrossLoading(false);
    addToast(`Fetched Scryfall prices for ${Object.keys(result).length} cards`, "success");
  };

  return (
    <div className="space-y-5">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">

        {/* ── Header ── */}
        <div className="flex items-center gap-3 mb-5">
          <span className="font-bold text-zinc-200 text-sm tracking-wide" style={{ fontFamily: "'Cinzel Decorative', serif" }}>
            Scryfall API Explorer
          </span>
          <span className="font-mono text-[9px] bg-violet-500/20 text-violet-300 border border-violet-500/40 px-2 py-0.5 rounded uppercase tracking-wider">
            Live API
          </span>
          <span className="text-zinc-600 text-xs font-mono">api.scryfall.com/cards/named?fuzzy=</span>
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-0 border-b border-zinc-800 mb-5">
          {(["lookup", "search"] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-5 py-2.5 text-sm font-semibold capitalize tracking-wide border-b-2 transition-colors
                ${tab === t ? "border-violet-500 text-violet-300" : "border-transparent text-zinc-500 hover:text-zinc-300"}`}>
              {t === "lookup" ? "Fuzzy Name Lookup" : "Custom Search"}
            </button>
          ))}
        </div>

        {/* ── Lookup tab ── */}
        {tab === "lookup" && (
          <div>
            {/* Search bar */}
            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-[11px] text-zinc-600 select-none">
                  fuzzy=
                </span>
                <input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="emrakul aeons torn"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl pl-14 pr-4 py-2.5 font-mono text-sm text-zinc-200 focus:outline-none focus:border-violet-500 transition-colors"
                />
              </div>
              <button onClick={handleLookup} disabled={loading}
                className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors shadow-lg shadow-violet-900/30">
                {loading ? <><Spinner inline /> Fetching…</> : "→ Fetch"}
              </button>
            </div>

            {/* Quick-fill from inventory */}
            {inventory.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap mb-5">
                <span className="font-mono text-[10px] text-zinc-600 uppercase tracking-widest">Quick fill:</span>
                {inventory.slice(0, 6).map(item => (
                  <button key={item.cardId}
                    onClick={() => setQuery(item.name)}
                    className="font-mono text-[10px] px-2 py-1 border border-zinc-700 text-zinc-500 rounded-lg hover:border-violet-500 hover:text-violet-400 transition-colors">
                    {item.name.split(",")[0]}
                  </button>
                ))}
              </div>
            )}

            {loading && <Spinner label="FETCHING FROM SCRYFALL" />}

            {/* ── Card result ── */}
            {fetched && (
              <div className="flex gap-6 items-start">
                {/* Card image */}
                <div className="flex-shrink-0">
                  {fetched.imageUris ? (
                    <img src={fetched.imageUris.normal} alt={fetched.name}
                      className="w-52 rounded-2xl border border-zinc-700 shadow-2xl shadow-violet-900/40" />
                  ) : (
                    <div className="w-52 h-72 bg-zinc-800 border border-zinc-700 rounded-2xl flex items-center justify-center text-zinc-600 text-xs font-mono">
                      No image
                    </div>
                  )}
                  {/* Purchase links */}
                  <div className="mt-3 space-y-1.5">
                    {fetched.cardmarketId && (
                      <a href={`https://www.cardmarket.com/en/Magic/Products/Search?searchString=${encodeURIComponent(fetched.name)}`}
                        target="_blank" rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-[11px] font-semibold text-zinc-400 hover:border-violet-500 hover:text-violet-300 transition-colors">
                        🛒 Cardmarket
                      </a>
                    )}
                    <a href={`https://scryfall.com/search?q=${encodeURIComponent(`!"${fetched.name}"`)}`}
                      target="_blank" rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-[11px] font-semibold text-zinc-400 hover:border-violet-500 hover:text-violet-300 transition-colors">
                      ⬡ View on Scryfall
                    </a>
                  </div>
                </div>

                {/* Card details */}
                <div className="flex-1 min-w-0">
                  {/* Name + type */}
                  <div className="mb-4">
                    <h2 className="text-xl font-black text-violet-300 leading-tight" style={{ fontFamily: "'Cinzel Decorative', serif" }}>
                      {fetched.name}
                    </h2>
                    <div className="text-zinc-500 text-sm mt-1">{fetched.typeLine}</div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`text-xs font-bold capitalize ${RARITY_COLOR[fetched.rarity] ?? "text-zinc-400"}`}>
                        {fetched.rarity}
                      </span>
                      <span className="text-zinc-700">·</span>
                      <span className="font-mono text-xs text-zinc-500">{fetched.set} #{fetched.collectorNumber}</span>
                      <span className="text-zinc-700">·</span>
                      <span className="text-xs text-zinc-500">{fetched.setName}</span>
                    </div>
                  </div>

                  {/* Oracle text */}
                  {fetched.oracleText && (
                    <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-4 text-sm text-zinc-300 leading-relaxed mb-4 whitespace-pre-line">
                      {fetched.oracleText}
                    </div>
                  )}

                  {/* Stats grid */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {[
                      ["Mana",     fetched.manaCost   ?? "—"],
                      ["CMC",      fetched.cmc        ?? "—"],
                      ["P/T",      fetched.power ? `${fetched.power}/${fetched.toughness}` : "—"],
                      ["USD",      fetched.prices.usd != null     ? `$${fetched.prices.usd.toFixed(2)}`     : "—"],
                      ["USD Foil", fetched.prices.usdFoil != null ? `$${fetched.prices.usdFoil.toFixed(2)}` : "—"],
                      ["EUR",      fetched.prices.eur != null     ? `€${fetched.prices.eur.toFixed(2)}`     : "—"],
                      ["EDHREC",   fetched.edhrecRank ? `#${fetched.edhrecRank}` : "—"],
                      ["Artist",   fetched.artist     ?? "—"],
                      ["MTGO tix", fetched.prices.tix != null     ? fetched.prices.tix.toFixed(2)           : "—"],
                    ].map(([k, v]) => (
                      <div key={k} className="bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5">
                        <div className="font-mono text-[9px] uppercase tracking-widest text-zinc-600 mb-0.5">{k}</div>
                        <div className={`text-sm font-bold ${["USD","USD Foil","EUR"].includes(k) ? "text-amber-400 font-mono" : "text-zinc-200"}`}>
                          {v}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Legalities */}
                  {fetched.legalities && (
                    <div className="mb-4">
                      <div className="font-mono text-[10px] uppercase tracking-widest text-zinc-600 mb-2">Format Legality</div>
                      <div className="flex flex-wrap gap-1.5">
                        {SHOW_FORMATS.map(fmt => {
                          const status = fetched.legalities![fmt] ?? "not_legal";
                          return (
                            <span key={fmt}
                              className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${LEGAL_STYLE[status] ?? LEGAL_STYLE.not_legal}`}>
                              {fmt}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Sync to inventory — admin/manager only */}
                  {can("canSyncPrices") && (() => {
                    const match = inventory.find(i =>
                      i.name.toLowerCase() === fetched.name.toLowerCase() ||
                      i.name.toLowerCase().includes(fetched.name.toLowerCase().split(",")[0])
                    );
                    return match ? (
                      <div className="flex items-center gap-3 p-3 bg-emerald-900/10 border border-emerald-700/30 rounded-xl">
                        <div>
                          <div className="text-xs font-semibold text-emerald-300">Found in inventory</div>
                          <div className="text-[10px] font-mono text-zinc-500 mt-0.5">
                            Current price: <span className="text-amber-400">${match.price.toFixed(2)}</span>
                            {fetched.prices.usd != null && (
                              <> · Scryfall: <span className="text-amber-400">${fetched.prices.usd.toFixed(2)}</span></>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleSync(match.cardId, match.name)}
                          disabled={syncing === match.cardId}
                          className="ml-auto flex items-center gap-2 px-4 py-2 text-xs font-semibold border border-emerald-700/50 text-emerald-400 rounded-xl hover:bg-emerald-900/20 transition-colors disabled:opacity-50"
                        >
                          {syncing === match.cardId
                            ? <><Spinner inline /> Syncing…</>
                            : "↻ Sync Price to Inventory"}
                        </button>
                      </div>
                    ) : (
                      <div className="p-3 bg-zinc-800/50 border border-zinc-700/50 rounded-xl text-[11px] font-mono text-zinc-600">
                        This card is not in your inventory
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Search tab ── */}
        {tab === "search" && (
          <div>
            <div className="flex gap-3 mb-5">
              <input
                value={searchQ}
                onChange={e => setSearchQ(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSearch()}
                placeholder="is:colorless type:eldrazi"
                className="flex-1 bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-2.5 font-mono text-sm text-zinc-200 focus:outline-none focus:border-violet-500 transition-colors"
              />
              <button onClick={handleSearch} disabled={loading}
                className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors shadow-lg shadow-violet-900/30">
                {loading ? <><Spinner inline /> Searching…</> : "🔍 Search"}
              </button>
            </div>

            {/* Quick preset buttons */}
            <div className="flex flex-wrap gap-2 mb-5">
              {[
                ["Eldrazi Colorless", "is:colorless type:eldrazi"],
                ["Mythic Eldrazi",    "type:eldrazi rarity:mythic"],
                ["Eldrazi Titans",    "type:eldrazi+titan"],
                ["Eldrazi Lands",     "type:land o:eldrazi"],
              ].map(([label, q]) => (
                <button key={label}
                  onClick={() => { setSearchQ(q); }}
                  className="font-mono text-[10px] px-3 py-1.5 border border-zinc-700 text-zinc-500 rounded-lg hover:border-violet-500 hover:text-violet-400 transition-colors">
                  {label}
                </button>
              ))}
            </div>

            {loading && <Spinner label="SEARCHING SCRYFALL" />}

            {!loading && results.length === 0 && (
              <div className="py-10 text-center font-mono text-xs text-zinc-600">
                Enter a query and click Search to fetch from Scryfall
              </div>
            )}

            {results.length > 0 && (
              <div className="grid grid-cols-4 gap-4">
                {results.map(card => (
                  <div key={card.scryfallId}
                    onClick={() => { setQuery(card.name); setTab("lookup"); handleLookup(); }}
                    className="bg-zinc-800 border border-zinc-700 rounded-xl overflow-hidden cursor-pointer hover:border-violet-500 hover:-translate-y-1 transition-all shadow-lg hover:shadow-violet-900/20 group">
                    {card.imageUris
                      ? <img src={card.imageUris.small} alt={card.name} className="w-full" />
                      : <div className="w-full h-32 bg-zinc-700 flex items-center justify-center text-zinc-500 text-xs">No image</div>
                    }
                    <div className="p-3">
                      <div className="text-xs font-semibold text-zinc-200 mb-1 leading-snug group-hover:text-violet-300 transition-colors">
                        {card.name}
                      </div>
                      <div className={`text-[10px] font-bold capitalize mb-1 ${RARITY_COLOR[card.rarity] ?? "text-zinc-400"}`}>
                        {card.rarity}
                      </div>
                      <div className="font-mono text-[10px] text-amber-400">
                        {card.prices.usd != null ? `$${card.prices.usd.toFixed(2)}` : "—"}
                      </div>
                      <div className="font-mono text-[9px] text-zinc-600 mt-0.5">{card.setName}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Inventory × Scryfall Cross-Reference ── */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="font-bold text-zinc-200 text-sm tracking-wide" style={{ fontFamily: "'Cinzel Decorative', serif" }}>
            Inventory × Scryfall Cross-Reference
          </div>
          {can("canSyncPrices") && (
            <div className="flex items-center gap-2">
              <button onClick={handleFetchCrossRef} disabled={crossLoading}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold border border-zinc-700 text-zinc-400 rounded-lg hover:border-violet-500 hover:text-violet-300 transition-colors disabled:opacity-50">
                {crossLoading ? <><Spinner inline /> Fetching…</> : "↻ Fetch Scryfall Prices"}
              </button>
            </div>
          )}
        </div>

        <Table title="" headers={CROSS_HEADERS}>
          {inventory.map(item => {
            const sf       = crossData[item.cardId];
            const sfUsd    = sf?.prices.usd;
            const diff     = sfUsd != null ? sfUsd - item.price : null;
            const diffColor = diff == null ? "" : diff > 0.5 ? "text-emerald-400" : diff < -0.5 ? "text-red-400" : "text-zinc-500";

            return (
              <tr key={item.cardId} className="border-b border-zinc-800/50 hover:bg-violet-500/5 transition-colors">
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
                <td className="px-4 py-3 text-sm font-bold text-zinc-200">{item.quantity}</td>
                <td className="px-4 py-3 font-mono text-amber-400 text-sm">${item.price.toFixed(2)}</td>
                <td className="px-4 py-3 font-mono text-sm">
                  {sfUsd != null ? <span className="text-amber-400">${sfUsd.toFixed(2)}</span> : <span className="text-zinc-600">—</span>}
                </td>
                <td className="px-4 py-3 font-mono text-sm">
                  {diff != null
                    ? <span className={`font-bold ${diffColor}`}>{diff > 0 ? "+" : ""}{diff.toFixed(2)}</span>
                    : <span className="text-zinc-600">—</span>}
                </td>
                <td className="px-4 py-3">
                  {can("canSyncPrices") && (
                    <button
                      onClick={() => handleSync(item.cardId, item.name)}
                      disabled={syncing === item.cardId}
                      className="text-[11px] px-2.5 py-1 border border-emerald-800/40 text-emerald-500 rounded-lg hover:bg-emerald-900/20 transition-colors disabled:opacity-40 font-semibold whitespace-nowrap">
                      {syncing === item.cardId ? "…" : "↻ Sync"}
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </Table>
      </div>
    </div>
  );
}

function Spinner({ label, inline }: { label?: string; inline?: boolean }) {
  if (inline) return <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />;
  return (
    <div className="flex items-center justify-center gap-3 py-10 text-zinc-600 font-mono text-xs">
      <div className="w-4 h-4 border-2 border-zinc-700 border-t-violet-500 rounded-full animate-spin" />
      {label}
    </div>
  );
}