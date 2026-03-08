import Distributor from "../models/Distributor.js";
import { AppError, catchAsync, sendSuccess } from "../utils/apiHelpers.js";

// ── GET /api/distributors ─────────────────────────────────────────────────
export const getAllDistributors = catchAsync(async (req, res) => {
  const { tier, country, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (tier)    filter.tier    = tier;
  if (country) filter.country = { $regex: country, $options: "i" };

  const skip  = (Number(page) - 1) * Number(limit);
  const total = await Distributor.countDocuments(filter);

  const distributors = await Distributor.find(filter)
    .sort("-creditLimit")
    .skip(skip)
    .limit(Number(limit));

  sendSuccess(res, 200, { distributors }, { total, page: Number(page) });
});

// ── GET /api/distributors/:id ─────────────────────────────────────────────
export const getDistributor = catchAsync(async (req, res, next) => {
  const dist = await Distributor.findById(req.params.id);
  if (!dist) return next(new AppError("Distributor not found.", 404));
  sendSuccess(res, 200, { distributor: dist });
});

// ── POST /api/distributors ────────────────────────────────────────────────
export const createDistributor = catchAsync(async (req, res) => {
  const dist = await Distributor.create(req.body);
  sendSuccess(res, 201, { distributor: dist });
});

// ── PATCH /api/distributors/:id ───────────────────────────────────────────
export const updateDistributor = catchAsync(async (req, res, next) => {
  const dist = await Distributor.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!dist) return next(new AppError("Distributor not found.", 404));
  sendSuccess(res, 200, { distributor: dist });
});

// ── DELETE /api/distributors/:id — soft delete (Module 4.2) ──────────────
export const softDeleteDistributor = catchAsync(async (req, res, next) => {
  const dist = await Distributor.findByIdAndUpdate(
    req.params.id,
    { isDeleted: true, deletedAt: new Date(), active: false },
    { new: true }
  );
  if (!dist) return next(new AppError("Distributor not found.", 404));
  res.status(204).json({ status: "success", data: null });
});
