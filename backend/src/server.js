import "dotenv/config";
import express      from "express";
import cors         from "cors";
import cookieParser from "cookie-parser";
import morgan       from "morgan";

import connectDB        from "./config/db.js";
import circuitBreaker   from "./middleware/circuitBreaker.js";
import globalErrorHandler from "./middleware/errorHandler.js";
import { AppError }     from "./utils/apiHelpers.js";

import authRoutes        from "./routes/authRoutes.js";
import cardRoutes        from "./routes/cardRoutes.js";
import orderRoutes       from "./routes/orderRoutes.js";
import distributorRoutes from "./routes/distributorRoutes.js";
import { systemRouter, scryfallRouter } from "./routes/miscRoutes.js";

// ── Connect DB ────────────────────────────────────────────────────────────
await connectDB();

const app = express();

// ── Global Middleware (Module 3.1) ────────────────────────────────────────
app.use(cors({
  origin:      process.env.CLIENT_URL,
  credentials: true,               // allow cookies cross-origin
}));
app.use(cookieParser());
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));          // HTTP request logger (Module 3.1)
}

// ── Circuit Breaker (Module 3.3) ──────────────────────────────────────────
app.use("/api", circuitBreaker);

// ── Routes ────────────────────────────────────────────────────────────────
app.use("/api/auth",         authRoutes);
app.use("/api/cards",        cardRoutes);
app.use("/api/orders",       orderRoutes);
app.use("/api/distributors", distributorRoutes);
app.use("/api/system",       systemRouter);
app.use("/api/scryfall",     scryfallRouter);

// ── 404 Handler ───────────────────────────────────────────────────────────
app.all("*", (req, res, next) => {
  next(new AppError(`Route ${req.originalUrl} not found.`, 404));
});

// ── Global Error Handler ──────────────────────────────────────────────────
app.use(globalErrorHandler);

// ── Start Server ──────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`
  ⬡  Eldrazi Warehouse API
  ✅  Server running on http://localhost:${PORT}
  🌍  Environment: ${process.env.NODE_ENV}
  `);
});

// Unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.error("💥 UNHANDLED REJECTION:", err.name, err.message);
  process.exit(1);
});
