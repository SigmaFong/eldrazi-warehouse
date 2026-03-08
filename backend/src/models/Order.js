import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    card:     { type: mongoose.Schema.Types.ObjectId, ref: "Card", required: true },
    cardId:   { type: String, required: true },   // denormalised for quick display
    cardName: { type: String, required: true },
    qty:      { type: Number, required: true, min: [1, "Quantity must be at least 1"] },
    price:    { type: Number, required: true, min: [0, "Price cannot be negative"] },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      unique: true,
    },
    distributor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Distributor",
      required: [true, "Distributor is required"],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: {
      type: [orderItemSchema],
      validate: {
        validator: (v) => v.length > 0,
        message: "Order must have at least one item",
      },
    },
    status: {
      type: String,
      enum: {
        values: ["pending", "processing", "shipped", "delivered", "cancelled"],
        message: "{VALUE} is not a valid status",
      },
      default: "pending",
    },
    total: { type: Number, min: 0 },

    // Soft delete (Module 4.2)
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date,    default: null },

    notes: { type: String, trim: true },
  },
  {
    timestamps: true,
    toJSON:   { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ── Auto-generate orderId before save ─────────────────────────────────────
orderSchema.pre("save", async function (next) {
  if (this.isNew) {
    const count   = await mongoose.model("Order").countDocuments();
    this.orderId  = `ORD-${String(2400 + count + 1).padStart(4, "0")}`;
  }
  next();
});

// ── Auto-calculate total before save (Module 4.3) ────────────────────────
orderSchema.pre("save", function (next) {
  if (this.isModified("items")) {
    this.total = +this.items
      .reduce((sum, item) => sum + item.price * item.qty, 0)
      .toFixed(2);
  }
  next();
});

// ── Exclude soft-deleted by default ──────────────────────────────────────
orderSchema.pre(/^find/, function (next) {
  if (!this.getOptions().includeDeleted) {
    this.where({ isDeleted: false });
  }
  next();
});

// ── Indexes ───────────────────────────────────────────────────────────────
orderSchema.index({ distributor: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });

const Order = mongoose.model("Order", orderSchema);
export default Order;
