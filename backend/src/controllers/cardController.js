import Card from "../models/Card.js";
import { AppError, catchAsync, sendSuccess } from "../utils/apiHelpers.js";

// ── GET /api/cards  — list with pagination, filter, search (Module 4.4) ──
export const getAllCards = catchAsync(async (req, res) => {
  const {
    page     = 1,
    limit    = 20,
    rarity,
    condition,
    location,
    search,
    sort     = "-createdAt",
  } = req.query;

  const filter = {};
  if (rarity)    filter.rarity    = rarity;
  if (condition) filter.condition = condition;
  if (location)  filter.location  = { $regex: location, $options: "i" };
  if (search)    filter.$text     = { $search: search };

  const skip  = (Number(page) - 1) * Number(limit);
  const total = await Card.countDocuments(filter);

  const cards = await Card.find(filter)
    .sort(sort)
    .skip(skip)
    .limit(Number(limit));

  sendSuccess(res, 200, { cards }, {
    results:    cards.length,
    total,
    page:       Number(page),
    totalPages: Math.ceil(total / Number(limit)),
  });
});

// ── GET /api/cards/:id ────────────────────────────────────────────────────
export const getCard = catchAsync(async (req, res, next) => {
  const card = await Card.findById(req.params.id);
  if (!card) return next(new AppError("Card not found.", 404));
  sendSuccess(res, 200, { card });
});

// ── POST /api/cards ───────────────────────────────────────────────────────
export const createCard = catchAsync(async (req, res) => {
  const card = await Card.create(req.body);
  sendSuccess(res, 201, { card });
});

// ── PATCH /api/cards/:id ──────────────────────────────────────────────────
export const updateCard = catchAsync(async (req, res, next) => {
  // Atomic update — prevents data inconsistency (Module 4.3)
  const card = await Card.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );
  if (!card) return next(new AppError("Card not found.", 404));
  sendSuccess(res, 200, { card });
});

// ── PATCH /api/cards/:id/reserve — atomic reservation ────────────────────
export const reserveStock = catchAsync(async (req, res, next) => {
  const { qty } = req.body;
  if (!qty || qty < 1) return next(new AppError("Quantity must be at least 1.", 400));

  // Atomic $inc — safe against race conditions (Module 4.3)
  const card = await Card.findOneAndUpdate(
    { _id: req.params.id, quantity: { $gte: req.body.qty + 0 } },
    { $inc: { reserved: qty } },
    { new: true, runValidators: true }
  );

  if (!card) return next(new AppError("Insufficient stock or card not found.", 400));
  sendSuccess(res, 200, { card });
});

// ── DELETE /api/cards/:id — soft delete (Module 4.2) ─────────────────────
export const softDeleteCard = catchAsync(async (req, res, next) => {
  const card = await Card.findByIdAndUpdate(
    req.params.id,
    { isDeleted: true, deletedAt: new Date() },
    { new: true }
  );
  if (!card) return next(new AppError("Card not found.", 404));
  res.status(204).json({ status: "success", data: null });
});

// ── DELETE /api/cards/:id/hard — permanent remove (Module 4.2) ───────────
export const hardDeleteCard = catchAsync(async (req, res, next) => {
  const card = await Card.findByIdAndDelete(req.params.id);
  if (!card) return next(new AppError("Card not found.", 404));
  res.status(204).json({ status: "success", data: null });
});

// ── GET /api/cards/deleted — view soft-deleted (Module 4.2) ──────────────
export const getDeletedCards = catchAsync(async (req, res) => {
  const cards = await Card.find({ isDeleted: true }).setOptions({ includeDeleted: true });
  sendSuccess(res, 200, { cards }, { results: cards.length });
});

// ── PATCH /api/cards/:id/restore — undo soft delete ──────────────────────
export const restoreCard = catchAsync(async (req, res, next) => {
  const card = await Card.findByIdAndUpdate(
    req.params.id,
    { isDeleted: false, deletedAt: null },
    { new: true }
  ).setOptions({ includeDeleted: true });
  if (!card) return next(new AppError("Card not found.", 404));
  sendSuccess(res, 200, { card });
});

// ── GET /api/cards/stats — aggregation pipeline (Module 4.5) ─────────────
export const getInventoryStats = catchAsync(async (req, res) => {
  const stats = await Card.aggregate([
    { $match: { isDeleted: false } },
    {
      $group: {
        _id:          "$rarity",
        count:        { $sum: 1 },
        totalQty:     { $sum: "$quantity" },
        totalReserved:{ $sum: "$reserved" },
        avgPrice:     { $avg: "$price" },
        totalValue:   { $sum: { $multiply: ["$quantity", "$price"] } },
      },
    },
    { $sort: { totalValue: -1 } },
  ]);

  const overall = await Card.aggregate([
    { $match: { isDeleted: false } },
    {
      $group: {
        _id:        null,
        totalCards: { $sum: 1 },
        totalQty:   { $sum: "$quantity" },
        totalValue: { $sum: { $multiply: ["$quantity", "$price"] } },
      },
    },
  ]);

  sendSuccess(res, 200, { byRarity: stats, overall: overall[0] });
});
