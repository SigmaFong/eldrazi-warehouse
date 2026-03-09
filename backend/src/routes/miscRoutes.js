import { Router } from "express";
import { getSystemInfo, healthCheck } from "../controllers/systemController.js";
import { fetchByCardmarketId, fetchByFuzzyName, searchScryfall, syncPriceToInventory } from "../controllers/scryfallController.js";
import { protect, restrictTo } from "../middleware/auth.js";
import { getCircuitState } from "../middleware/circuitBreaker.js";

// ── System ────────────────────────────────────────────────────────────────
export const systemRouter = Router();

systemRouter.get("/health",  healthCheck);
systemRouter.get("/info",    protect, restrictTo("admin"), getSystemInfo);
systemRouter.get("/circuit", protect, restrictTo("admin"), getCircuitState);

// ── Scryfall Proxy ────────────────────────────────────────────────────────
export const scryfallRouter = Router();

scryfallRouter.use(protect);
scryfallRouter.get("/named",              fetchByFuzzyName);
scryfallRouter.get("/cardmarket/:id",     fetchByCardmarketId);
scryfallRouter.get("/search",             searchScryfall);
scryfallRouter.post("/sync/:cardId",      restrictTo("admin","manager"), syncPriceToInventory);