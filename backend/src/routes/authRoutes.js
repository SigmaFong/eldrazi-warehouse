import { Router } from "express";
import { register, login, logout, getMe, updatePassword } from "../controllers/authController.js";
import { protect, restrictTo } from "../middleware/auth.js";

const router = Router();

router.post("/register", protect, restrictTo("admin"), register); // admin-only registration
router.post("/login",  login);
router.post("/logout", protect, logout);

router.get( "/me",              protect, getMe);
router.patch("/update-password",protect, updatePassword);

export default router;
