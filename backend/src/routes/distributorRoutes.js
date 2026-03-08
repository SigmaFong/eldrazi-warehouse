import { Router } from "express";
import {
  getAllDistributors, getDistributor, createDistributor,
  updateDistributor, softDeleteDistributor,
} from "../controllers/distributorController.js";
import { protect, restrictTo } from "../middleware/auth.js";

const router = Router();

router.use(protect);

router.route("/")
  .get(getAllDistributors)
  .post(restrictTo("admin"), createDistributor);

router.route("/:id")
  .get(getDistributor)
  .patch(restrictTo("admin","manager"), updateDistributor)
  .delete(restrictTo("admin"), softDeleteDistributor);

export default router;
