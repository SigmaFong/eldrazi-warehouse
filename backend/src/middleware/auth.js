import { promisify } from "util";
import jwt from "jsonwebtoken";
import User           from "../models/User.js";
import TokenBlacklist from "../models/TokenBlacklist.js";
import { AppError, catchAsync } from "../utils/apiHelpers.js";

// ── Protect: verify JWT + check user status (Module 5.3) ─────────────────
export const protect = catchAsync(async (req, res, next) => {
  // 1) Get token from cookie or Authorization header
  let token;
  if (req.cookies?.jwt) {
    token = req.cookies.jwt;
  } else if (req.headers.authorization?.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return next(new AppError("You are not logged in. Please log in to get access.", 401));
  }

  // 2) Check token blacklist (logout invalidation — Module 5.5)
  const isBlacklisted = await TokenBlacklist.findOne({ token });
  if (isBlacklisted) {
    return next(new AppError("Token has been invalidated. Please log in again.", 401));
  }

  // 3) Verify token signature
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 4) Check user still exists
  const currentUser = await User.findById(decoded.id).select("+active +loginAttempts +lockUntil");
  if (!currentUser) {
    return next(new AppError("The user belonging to this token no longer exists.", 401));
  }

  // 5) Check user is not deactivated
  if (!currentUser.active) {
    return next(new AppError("This account has been deactivated.", 401));
  }

  // 6) Check if password was changed after token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(new AppError("Password was recently changed. Please log in again.", 401));
  }

  req.user  = currentUser;
  req.token = token;
  next();
});

// ── RBAC Factory Function (Module 5.4) ────────────────────────────────────
// Usage: restrictTo("admin", "manager")
export const restrictTo = (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("You do not have permission to perform this action.", 403)
      );
    }
    next();
  };
