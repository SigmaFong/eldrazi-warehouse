import mongoose from "mongoose";

const distributorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Distributor name is required"],
      trim: true,
      unique: true,
    },
    country: { type: String, required: true, trim: true },
    contact: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
    },
    tier: {
      type: String,
      enum: { values: ["Gold", "Silver", "Bronze"], message: "{VALUE} is not a valid tier" },
      default: "Bronze",
    },
    creditLimit: {
      type: Number,
      required: true,
      min: [0, "Credit limit cannot be negative"],
    },
    balance: {
      type: Number,
      default: 0,
      min: [0, "Balance cannot be negative"],
    },
    active: { type: Boolean, default: true },

    // Soft delete (Module 4.2)
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date,    default: null },
  },
  {
    timestamps: true,
    toJSON:   { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ── Virtual: credit available ─────────────────────────────────────────────
distributorSchema.virtual("creditAvailable").get(function () {
  return this.creditLimit - this.balance;
});

// ── Virtual: credit used percentage ──────────────────────────────────────
distributorSchema.virtual("creditUsedPct").get(function () {
  return +((this.balance / this.creditLimit) * 100).toFixed(1);
});

// ── Exclude soft-deleted by default ──────────────────────────────────────
distributorSchema.pre(/^find/, function (next) {
  if (!this.getOptions().includeDeleted) {
    this.where({ isDeleted: false });
  }
  next();
});

const Distributor = mongoose.model("Distributor", distributorSchema);
export default Distributor;
