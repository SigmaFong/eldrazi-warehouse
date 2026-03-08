import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false, // never leak password in API responses (Module 5.1)
    },
    role: {
      type: String,
      enum: ["admin", "manager", "distributor", "viewer"],
      default: "viewer",
    },
    active: {
      type: Boolean,
      default: true,
      select: false,
    },
    // brute force protection (Module 5.5)
    loginAttempts: { type: Number, default: 0, select: false },
    lockUntil:     { type: Date,   default: null, select: false },

    passwordChangedAt: Date,
  },
  { timestamps: true }
);

// ── Auto hash password before save (Module 5.1) ──────────────────────────
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// ── Track password change time ────────────────────────────────────────────
userSchema.pre("save", function (next) {
  if (!this.isModified("password") || this.isNew) return next();
  this.passwordChangedAt = new Date(Date.now() - 1000);
  next();
});

// ── Instance method: verify password (Module 5.2) ────────────────────────
userSchema.methods.correctPassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// ── Instance method: check if password changed after JWT issued ───────────
userSchema.methods.changedPasswordAfter = function (jwtTimestamp) {
  if (this.passwordChangedAt) {
    const changedAt = Math.floor(this.passwordChangedAt.getTime() / 1000);
    return jwtTimestamp < changedAt;
  }
  return false;
};

// ── Instance method: brute force lockout check (Module 5.5) ──────────────
userSchema.methods.isLocked = function () {
  return this.lockUntil && this.lockUntil > Date.now();
};

userSchema.methods.incrementLoginAttempts = async function () {
  const MAX_ATTEMPTS  = 5;
  const LOCK_DURATION = 15 * 60 * 1000; // 15 minutes

  this.loginAttempts += 1;
  if (this.loginAttempts >= MAX_ATTEMPTS) {
    this.lockUntil = new Date(Date.now() + LOCK_DURATION);
  }
  await this.save({ validateBeforeSave: false });
};

userSchema.methods.resetLoginAttempts = async function () {
  this.loginAttempts = 0;
  this.lockUntil     = null;
  await this.save({ validateBeforeSave: false });
};

const User = mongoose.model("User", userSchema);
export default User;
