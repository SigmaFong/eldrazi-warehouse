import { Router } from "express";
import {
  getAllCards, getCard, createCard, updateCard,
  softDeleteCard, hardDeleteCard, getDeletedCards,
  restoreCard, reserveStock, getInventoryStats,
} from "../controllers/cardController.js";
import { protect, restrictTo } from "../middleware/auth.js";

const router = Router();

// All card routes require authentication
router.use(protect);

router.get( "/stats",   getInventoryStats);
router.get( "/deleted", restrictTo("admin"), getDeletedCards);

router.route("/")
  .get(getAllCards)
  .post(restrictTo("admin", "manager"), createCard);

router.route("/:id")
  .get(getCard)
  .patch(restrictTo("admin", "manager"), updateCard)
  .delete(restrictTo("admin", "manager"), softDeleteCard);

router.patch("/:id/reserve",  restrictTo("admin","manager"), reserveStock);
router.delete("/:id/hard",    restrictTo("admin"), hardDeleteCard);
router.patch( "/:id/restore", restrictTo("admin"), restoreCard);

export default router;
