import mongoose from "mongoose";

// Stores invalidated JWTs (logout / password change)
// Documents auto-expire via MongoDB TTL index
const tokenBlacklistSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    unique: true,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
});

// MongoDB TTL index — auto-deletes expired tokens (Module 5.5)
tokenBlacklistSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const TokenBlacklist = mongoose.model("TokenBlacklist", tokenBlacklistSchema);
export default TokenBlacklist;
