import User           from "../models/User.js";
import TokenBlacklist from "../models/TokenBlacklist.js";
import { createAndSendToken, verifyToken } from "../utils/jwt.js";
import { AppError, catchAsync, sendSuccess } from "../utils/apiHelpers.js";

// ── Register (Module 5.1) ─────────────────────────────────────────────────
export const register = catchAsync(async (req, res, next) => {
  const { name, email, password, role } = req.body;

  // Prevent privilege escalation: only admins can create admin/manager roles
  const safeRole =
    req.user?.role === "admin" ? role : "viewer";

  const newUser = await User.create({ name, email, password, role: safeRole });

  createAndSendToken(newUser, 201, res);
});

// ── Login (Module 5.2) ────────────────────────────────────────────────────
export const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError("Please provide email and password.", 400));
  }

  // Fetch password + brute-force fields (normally excluded by select:false)
  const user = await User.findOne({ email }).select("+password +loginAttempts +lockUntil +active");

  if (!user) {
    return next(new AppError("Invalid email or password.", 401));
  }

  // Brute force check (Module 5.5)
  if (user.isLocked()) {
    const retryAfterSec = Math.ceil((user.lockUntil - Date.now()) / 1000);
    return next(new AppError(`Account locked. Try again in ${retryAfterSec}s.`, 429));
  }

  const isCorrect = await user.correctPassword(password);

  if (!isCorrect) {
    await user.incrementLoginAttempts();
    return next(new AppError("Invalid email or password.", 401));
  }

  if (!user.active) {
    return next(new AppError("This account has been deactivated.", 401));
  }

  // Successful login — reset brute force counter
  await user.resetLoginAttempts();

  createAndSendToken(user, 200, res);
});

// ── Logout via token blacklisting (Module 5.5) ────────────────────────────
export const logout = catchAsync(async (req, res, next) => {
  const token = req.token; // attached by protect middleware

  // Decode to get expiry (so TTL index can clean it up automatically)
  const decoded    = verifyToken(token);
  const expiresAt  = new Date(decoded.exp * 1000);

  await TokenBlacklist.create({ token, expiresAt });

  // Clear cookie
  res.cookie("jwt", "loggedout", {
    expires:  new Date(Date.now() + 1000),
    httpOnly: true,
  });

  res.status(200).json({ status: "success", message: "Logged out successfully." });
});

// ── Get current user (Module 5.3) ─────────────────────────────────────────
export const getMe = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  sendSuccess(res, 200, { user });
});

// ── Update password ───────────────────────────────────────────────────────
export const updatePassword = catchAsync(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select("+password");
  if (!(await user.correctPassword(currentPassword))) {
    return next(new AppError("Current password is incorrect.", 401));
  }

  user.password = newPassword;
  await user.save();

  createAndSendToken(user, 200, res);
});
