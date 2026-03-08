import { Router } from "express";
import {
  getAllOrders, getOrder, createOrder,
  updateOrderStatus, softDeleteOrder, getOrderStats,
} from "../controllers/orderController.js";
import { protect, restrictTo } from "../middleware/auth.js";

const router = Router();

router.use(protect);

router.get("/stats", restrictTo("admin","manager"), getOrderStats);

router.route("/")
  .get(getAllOrders)
  .post(restrictTo("admin","manager"), createOrder);

router.route("/:id")
  .get(getOrder)
  .delete(restrictTo("admin"), softDeleteOrder);

router.patch("/:id/status", restrictTo("admin","manager"), updateOrderStatus);

export default router;
