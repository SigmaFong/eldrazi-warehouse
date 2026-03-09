import Card from "../models/Card.js";
import { AppError, catchAsync, sendSuccess } from "../utils/apiHelpers.js";

const SCRYFALL_BASE = "https://api.scryfall.com";

// ── GET /api/scryfall/cardmarket/:id ──────────────────────────────────────
export const fetchByCardmarketId = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const response = await fetch(`${SCRYFALL_BASE}/cards/cardmarket/${id}`);

  if (!response.ok) {
    return next(new AppError(`Scryfall returned ${response.status} for ID: ${id}`, response.status));
  }

  const data = await response.json();

  // Transform & normalise (Module 3.5)
  const transformed = {
    scryfallId:  data.id,
    name:        data.name,
    typeLine:    data.type_line,
    oracleText:  data.oracle_text,
    manaCost:    data.mana_cost,
    cmc:         data.cmc,
    colors:      data.colors,
    power:       data.power,
    toughness:   data.toughness,
    rarity:      data.rarity,
    set:         data.set?.toUpperCase(),
    setName:     data.set_name,
    imageUris:   data.image_uris,
    prices: {
      usd:    data.prices?.usd    ? +data.prices.usd    : null,
      usdFoil:data.prices?.usd_foil ? +data.prices.usd_foil : null,
      eur:    data.prices?.eur    ? +data.prices.eur    : null,
    },
    legalities:  data.legalities,
    edhrec_rank: data.edhrec_rank,
    raw:         data,
  };

  sendSuccess(res, 200, { card: transformed });
});

// ── GET /api/scryfall/named?fuzzy=emrakul+aeons+torn ─────────────────────
export const fetchByFuzzyName = catchAsync(async (req, res, next) => {
  const { fuzzy } = req.query;
  if (!fuzzy) return next(new AppError("Query param 'fuzzy' is required.", 400));

  const response = await fetch(
    `${SCRYFALL_BASE}/cards/named?fuzzy=${encodeURIComponent(fuzzy)}`
  );

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    return next(new AppError(errData.details ?? `No card found for "${fuzzy}"`, response.status));
  }

  const data = await response.json();

  const transformed = {
    scryfallId:  data.id,
    name:        data.name,
    typeLine:    data.type_line,
    oracleText:  data.oracle_text,
    manaCost:    data.mana_cost,
    cmc:         data.cmc,
    colors:      data.colors,
    power:       data.power,
    toughness:   data.toughness,
    rarity:      data.rarity,
    set:         data.set?.toUpperCase(),
    setName:     data.set_name,
    collectorNumber: data.collector_number,
    artist:      data.artist,
    imageUris:   data.image_uris,
    prices: {
      usd:     data.prices?.usd      ? +data.prices.usd      : null,
      usdFoil: data.prices?.usd_foil ? +data.prices.usd_foil : null,
      eur:     data.prices?.eur      ? +data.prices.eur      : null,
      eurFoil: data.prices?.eur_foil ? +data.prices.eur_foil : null,
      tix:     data.prices?.tix      ? +data.prices.tix      : null,
    },
    legalities:  data.legalities,
    edhrecRank:  data.edhrec_rank,
    cardmarketId: data.cardmarket_id,
    tcgplayerId:  data.tcgplayer_id,
    raw:         data,
  };

  sendSuccess(res, 200, { card: transformed });
});

// ── GET /api/scryfall/search?q= ───────────────────────────────────────────
export const searchScryfall = catchAsync(async (req, res, next) => {
  const { q = "is:colorless type:eldrazi", order = "edhrec", page = 1 } = req.query;
  const response = await fetch(
    `${SCRYFALL_BASE}/cards/search?q=${encodeURIComponent(q)}&order=${order}&page=${page}`
  );

  if (!response.ok) {
    return next(new AppError("Scryfall search failed.", response.status));
  }

  const data = await response.json();

  // Transform array (Module 3.5)
  const cards = (data.data ?? []).map(c => ({
    scryfallId: c.id,
    name:       c.name,
    typeLine:   c.type_line,
    rarity:     c.rarity,
    set:        c.set?.toUpperCase(),
    setName:    c.set_name,
    imageUris:  c.image_uris,
    prices:     { usd: c.prices?.usd ? +c.prices.usd : null, eur: c.prices?.eur ? +c.prices.eur : null },
  }));

  sendSuccess(res, 200, { cards }, {
    total:    data.total_cards,
    hasMore:  data.has_more,
    nextPage: data.next_page,
  });
});

// ── POST /api/scryfall/sync/:cardId — sync price to inventory ─────────────
export const syncPriceToInventory = catchAsync(async (req, res, next) => {
  const card = await Card.findOne({ cardId: req.params.cardId });
  if (!card) return next(new AppError("Card not found in inventory.", 404));

  // Use fuzzy match — handles cards with commas and special characters
  const response = await fetch(
    `${SCRYFALL_BASE}/cards/named?fuzzy=${encodeURIComponent(card.name)}`
  );
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    return next(new AppError(errData.details ?? "Could not find card on Scryfall.", 502));
  }

  const data = await response.json();

  const usd = data.prices?.usd ? +data.prices.usd : null;
  const eur = data.prices?.eur ? +data.prices.eur : null;

  if (!usd) return next(new AppError("Scryfall has no USD price for this card.", 422));

  // Update both the live price and the cache fields
  card.price            = usd;          // ← this is what the inventory actually shows
  card.scryfallId       = data.id;
  card.scryfallPriceUsd = usd;
  card.scryfallPriceEur = eur ?? card.scryfallPriceEur;
  card.lastScryfallSync = new Date();

  await card.save({ validateBeforeSave: false });

  sendSuccess(res, 200, {
    card,
    synced: {
      name:      card.name,
      oldPrice:  card.price,           // note: already updated above, returned for reference
      newPrice:  usd,
      eur:       eur,
      scryfallId:data.id,
      syncedAt:  card.lastScryfallSync,
    },
  });
});