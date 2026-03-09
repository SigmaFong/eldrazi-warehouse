import Order       from "../models/Order.js";
import Card        from "../models/Card.js";
import Distributor from "../models/Distributor.js";
import { AppError, catchAsync, sendSuccess } from "../utils/apiHelpers.js";

// ── GET /api/orders ───────────────────────────────────────────────────────
export const getAllOrders = catchAsync(async (req, res) => {
  const { page = 1, limit = 20, status, distributor } = req.query;

  const filter = {};
  if (status)      filter.status      = status;
  if (distributor) filter.distributor = distributor;

  // Distributors only see their own orders (RBAC enforcement)
  if (req.user.role === "distributor") {
    const dist = await Distributor.findOne({ contact: req.user.email });
    if (dist) filter.distributor = dist._id;
  }

  const skip  = (Number(page) - 1) * Number(limit);
  const total = await Order.countDocuments(filter);

  const orders = await Order.find(filter)
    .populate("distributor", "name country tier")
    .populate("createdBy",   "name email")
    .sort("-createdAt")
    .skip(skip)
    .limit(Number(limit));

  sendSuccess(res, 200, { orders }, {
    results:    orders.length,
    total,
    page:       Number(page),
    totalPages: Math.ceil(total / Number(limit)),
  });
});

// ── GET /api/orders/:id ───────────────────────────────────────────────────
export const getOrder = catchAsync(async (req, res, next) => {
  const order = await Order.findById(req.params.id)
    .populate("distributor", "name country tier creditLimit balance")
    .populate("createdBy",   "name email");
  if (!order) return next(new AppError("Order not found.", 404));
  sendSuccess(res, 200, { order });
});

// ── POST /api/orders ──────────────────────────────────────────────────────
// Uses manual rollback instead of MongoDB transactions.
// Transactions require a replica set — this approach works on standalone MongoDB.
export const createOrder = catchAsync(async (req, res, next) => {
  const { distributorId, items, notes } = req.body;

  // ── 1. Validate distributor ───────────────────────────────────────────
  const dist = await Distributor.findById(distributorId);
  if (!dist) return next(new AppError("Distributor not found.", 404));

  // ── 2. Validate all cards upfront before touching anything ───────────
  const resolvedItems = [];
  let total = 0;

  for (const item of items) {
    const card = await Card.findById(item.cardId);
    if (!card) return next(new AppError(`Card ${item.cardId} not found.`, 404));

    const available = card.quantity - card.reserved;
    if (available < item.qty) {
      return next(new AppError(
        `Insufficient stock for "${card.name}". Available: ${available}, requested: ${item.qty}.`,
        400
      ));
    }

    resolvedItems.push({
      card:     card._id,
      cardId:   card.cardId,
      cardName: card.name,
      qty:      item.qty,
      price:    card.price,
    });

    total += card.price * item.qty;
  }

  // ── 3. Check credit limit ─────────────────────────────────────────────
  if (dist.balance + total > dist.creditLimit) {
    return next(new AppError(
      `Order total $${total.toFixed(2)} exceeds available credit ($${(dist.creditLimit - dist.balance).toFixed(2)}).`,
      400
    ));
  }

  // ── 4. Reserve stock (track for rollback on failure) ──────────────────
  const reservedCards = [];
  try {
    for (const item of resolvedItems) {
      await Card.findByIdAndUpdate(item.card, { $inc: { reserved: item.qty } });
      reservedCards.push({ cardId: item.card, qty: item.qty });
    }

    // ── 5. Create the order ─────────────────────────────────────────────
    const order = await Order.create({
      distributor: dist._id,
      createdBy:   req.user._id,
      items:       resolvedItems,
      notes,
    });

    // ── 6. Update distributor balance ───────────────────────────────────
    await Distributor.findByIdAndUpdate(dist._id, { $inc: { balance: total } });

    // ── 7. Populate and return ──────────────────────────────────────────
    const populated = await Order.findById(order._id)
      .populate("distributor", "name country tier")
      .populate("createdBy",   "name email");

    sendSuccess(res, 201, { order: populated });

  } catch (err) {
    // ── Manual rollback: un-reserve any cards already incremented ───────
    for (const { cardId, qty } of reservedCards) {
      await Card.findByIdAndUpdate(cardId, { $inc: { reserved: -qty } }).catch(() => {});
    }
    throw err;
  }
});

// ── PATCH /api/orders/:id/status ──────────────────────────────────────────
export const updateOrderStatus = catchAsync(async (req, res, next) => {
  const { status } = req.body;
  const order = await Order.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true, runValidators: true }
  ).populate("distributor", "name country");

  if (!order) return next(new AppError("Order not found.", 404));
  sendSuccess(res, 200, { order });
});

// ── DELETE /api/orders/:id — soft delete (Module 4.2) ────────────────────
export const softDeleteOrder = catchAsync(async (req, res, next) => {
  const order = await Order.findByIdAndUpdate(
    req.params.id,
    { isDeleted: true, deletedAt: new Date(), status: "cancelled" },
    { new: true }
  );
  if (!order) return next(new AppError("Order not found.", 404));
  res.status(204).json({ status: "success", data: null });
});

// ── GET /api/orders/stats — aggregation (Module 4.5) ─────────────────────
export const getOrderStats = catchAsync(async (req, res) => {
  const stats = await Order.aggregate([
    { $match: { isDeleted: false } },
    {
      $group: {
        _id:        "$status",
        count:      { $sum: 1 },
        totalValue: { $sum: "$total" },
      },
    },
    { $sort: { count: -1 } },
  ]);

  sendSuccess(res, 200, { stats });
});