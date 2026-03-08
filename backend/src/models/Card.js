import mongoose from "mongoose";

const cardSchema = new mongoose.Schema(
  {
    cardId: {
      type: String,
      required: [true, "cardId is required"],
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, "Card name is required"],
      trim: true,
    },
    set: {
      type: String,
      required: [true, "Set code is required"],
      uppercase: true,
      trim: true,
    },
    rarity: {
      type: String,
      required: true,
      enum: {
        values: ["mythic", "rare", "uncommon", "common"],
        message: "{VALUE} is not a valid rarity",
      },
    },
    quantity: {
      type: Number,
      required: true,
      min: [0, "Quantity cannot be negative"],
      default: 0,
    },
    reserved: {
      type: Number,
      default: 0,
      min: [0, "Reserved cannot be negative"],
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    location: {
      type: String,
      required: [true, "Location is required"],
      trim: true,
    },
    condition: {
      type: String,
      enum: {
        values: ["NM", "LP", "MP", "HP", "DMG"],
        message: "{VALUE} is not a valid condition",
      },
      default: "NM",
    },
    img: { type: String, trim: true },

    // Soft delete (Module 4.2)
    deletedAt: { type: Date, default: null },
    isDeleted: { type: Boolean, default: false },

    // Scryfall metadata cache
    scryfallId:      { type: String },
    scryfallPriceUsd:{ type: Number },
    scryfallPriceEur:{ type: Number },
    lastScryfallSync:{ type: Date },
  },
  {
    timestamps: true,
    toJSON:   { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ── Virtual: available quantity (Module 4.5) ──────────────────────────────
cardSchema.virtual("available").get(function () {
  return this.quantity - this.reserved;
});

// ── Virtual: total value ──────────────────────────────────────────────────
cardSchema.virtual("totalValue").get(function () {
  return +(this.quantity * this.price).toFixed(2);
});

// ── Query middleware: exclude soft-deleted by default (Module 4.2) ────────
cardSchema.pre(/^find/, function (next) {
  if (!this.getOptions().includeDeleted) {
    this.where({ isDeleted: false });
  }
  next();
});

// ── Indexes ───────────────────────────────────────────────────────────────
cardSchema.index({ name: "text" });
cardSchema.index({ rarity: 1 });
cardSchema.index({ location: 1 });
cardSchema.index({ isDeleted: 1 });

const Card = mongoose.model("Card", cardSchema);
export default Card;
