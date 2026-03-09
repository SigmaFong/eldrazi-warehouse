import "dotenv/config";
import mongoose from "mongoose";
import connectDB  from "../config/db.js";
import Card        from "../models/Card.js";
import Distributor from "../models/Distributor.js";
import User        from "../models/User.js";
import Order       from "../models/Order.js";

// ── Cards ─────────────────────────────────────────────────────────────────
const cards = [
  { cardId:"emrakul-aeons-torn",      name:"Emrakul, the Aeons Torn",      set:"UMA", rarity:"mythic",   quantity:12, reserved:2, price:89.99, location:"VAULT-A1", condition:"NM", img:"https://cards.scryfall.io/large/front/0/e/0e0d989d-7186-40dc-bdfe-cfbb77656bc8.jpg" },
  { cardId:"ulamog-infinite-gyre",    name:"Ulamog, the Infinite Gyre",    set:"MM2", rarity:"mythic",   quantity:8,  reserved:1, price:34.99, location:"VAULT-A2", condition:"NM", img:"https://cards.scryfall.io/large/front/9/4/9464a820-65de-44f2-9895-46a35e8621a0.jpg" },
  { cardId:"kozilek-butcher",         name:"Kozilek, Butcher of Truth",    set:"MM2", rarity:"mythic",   quantity:6,  reserved:0, price:29.99, location:"VAULT-A3", condition:"LP", img:"https://cards.scryfall.io/large/front/d/2/d27cf7b7-7982-46bd-a559-7789c0e74bae.jpg" },
  { cardId:"emrakul-promised-end",    name:"Emrakul, the Promised End",    set:"EMN", rarity:"mythic",   quantity:15, reserved:3, price:44.99, location:"SHELF-B1", condition:"NM", img:"https://cards.scryfall.io/large/front/7/1/71911392-42b0-4b6d-baf7-918a4bd3b924.jpg" },
  { cardId:"ulamog-ceaseless-hunger", name:"Ulamog, the Ceaseless Hunger", set:"BFZ", rarity:"mythic",   quantity:20, reserved:4, price:27.99, location:"SHELF-B2", condition:"NM", img:"https://cards.scryfall.io/large/front/c/7/c74ae706-b3b3-4097-a387-6f6c38a9b603.jpg" },
  { cardId:"it-that-betrays",         name:"It That Betrays",              set:"ROE", rarity:"rare",     quantity:30, reserved:0, price:4.99,  location:"SHELF-C1", condition:"MP", img:"https://cards.scryfall.io/large/front/c/a/ca08b369-783d-4fe4-8fc8-9cd595638550.jpg" },
  { cardId:"eldrazi-temple",          name:"Eldrazi Temple",               set:"MM2", rarity:"uncommon", quantity:48, reserved:8, price:3.49,  location:"SHELF-D1", condition:"NM", img:"https://cards.scryfall.io/large/front/c/b/cbab7e1f-305e-4733-aa70-b27285740925.jpg" },
  { cardId:"eye-of-ugin",             name:"Eye of Ugin",                  set:"MM2", rarity:"rare",     quantity:22, reserved:2, price:7.99,  location:"SHELF-D2", condition:"NM", img:"https://cards.scryfall.io/large/front/d/2/d2d5124b-4d73-4aa9-9331-88e03779ffad.jpg" },
];

// ── Distributors ──────────────────────────────────────────────────────────
const distributors = [
  { name:"Tokyo Card Exchange",   country:"Japan",       tier:"Gold",   creditLimit:50000, balance:12450, contact:"tanaka@tce.jp"   },
  { name:"Seoul MTG Hub",         country:"South Korea", tier:"Silver", creditLimit:25000, balance:4200,  contact:"kim@seoulhub.kr" },
  { name:"Bangkok Planeswalkers", country:"Thailand",    tier:"Bronze", creditLimit:10000, balance:890,   contact:"chai@bkkmtg.th"  },
  { name:"Singapore CardDen",     country:"Singapore",   tier:"Gold",   creditLimit:40000, balance:8750,  contact:"lim@cardden.sg"  },
];

// ── Users ─────────────────────────────────────────────────────────────────
const users = [
  { name:"Admin User",  email:"admin@eldrazi.com",   password:"Admin1234!",  role:"admin"       },
  { name:"Manager",     email:"manager@eldrazi.com", password:"Manage1234!", role:"manager"     },
  { name:"Tokyo Dist",  email:"tanaka@tce.jp",       password:"Dist1234!",   role:"distributor" },
  { name:"KK Viewer",   email:"kk@tcg.ac.th",        password:"Viewer1234!", role:"viewer"      },
];

// ── Seed ──────────────────────────────────────────────────────────────────
const seed = async () => {
  await connectDB();

  console.log("🗑  Clearing existing data...");
  await Promise.all([
    Card.deleteMany(),
    Distributor.deleteMany(),
    User.deleteMany(),
    Order.deleteMany(),
  ]);

  console.log("🌱 Seeding cards...");
  const savedCards = await Card.insertMany(cards);

  console.log("🌱 Seeding distributors...");
  const savedDists = await Distributor.insertMany(distributors);

  console.log("🌱 Seeding users...");
  const savedUsers = [];
  for (const u of users) {
    const created = await User.create(u);
    savedUsers.push(created);
  }

  // ── Lookup helpers ─────────────────────────────────────────────────────
  const cardBySlug = (slug) => savedCards.find(c => c.cardId === slug);
  const distByName = (name) => savedDists.find(d => d.name === name);
  const adminUser  = savedUsers.find(u => u.role === "admin");
  const managerUser= savedUsers.find(u => u.role === "manager");

  // ── Order definitions ─────────────────────────────────────────────────
  // Each uses .create() so pre-save hooks run (orderId, total calculation)
  console.log("🌱 Seeding orders...");

  const orderDefs = [
    // ── Tokyo Card Exchange — Gold partner ─────────────────────────────
    {
      distributor: distByName("Tokyo Card Exchange")._id,
      createdBy:   adminUser._id,
      status:      "delivered",
      notes:       "Q1 flagship shipment — Emrakul restocks",
      items: [
        { card: cardBySlug("emrakul-aeons-torn")._id,   cardId: "emrakul-aeons-torn",   cardName: "Emrakul, the Aeons Torn",   qty: 2, price: 89.99 },
        { card: cardBySlug("ulamog-infinite-gyre")._id, cardId: "ulamog-infinite-gyre", cardName: "Ulamog, the Infinite Gyre", qty: 3, price: 34.99 },
      ],
    },
    {
      distributor: distByName("Tokyo Card Exchange")._id,
      createdBy:   managerUser._id,
      status:      "shipped",
      notes:       "Express reorder — Eldrazi Temple staples",
      items: [
        { card: cardBySlug("eldrazi-temple")._id, cardId: "eldrazi-temple", cardName: "Eldrazi Temple", qty: 12, price: 3.49 },
        { card: cardBySlug("eye-of-ugin")._id,    cardId: "eye-of-ugin",    cardName: "Eye of Ugin",    qty: 4,  price: 7.99 },
      ],
    },
    {
      distributor: distByName("Tokyo Card Exchange")._id,
      createdBy:   adminUser._id,
      status:      "processing",
      notes:       "New season opener",
      items: [
        { card: cardBySlug("emrakul-promised-end")._id,    cardId: "emrakul-promised-end",    cardName: "Emrakul, the Promised End",    qty: 2, price: 44.99 },
        { card: cardBySlug("ulamog-ceaseless-hunger")._id, cardId: "ulamog-ceaseless-hunger", cardName: "Ulamog, the Ceaseless Hunger", qty: 3, price: 27.99 },
        { card: cardBySlug("kozilek-butcher")._id,         cardId: "kozilek-butcher",         cardName: "Kozilek, Butcher of Truth",    qty: 1, price: 29.99 },
      ],
    },

    // ── Seoul MTG Hub — Silver partner ────────────────────────────────
    {
      distributor: distByName("Seoul MTG Hub")._id,
      createdBy:   managerUser._id,
      status:      "delivered",
      notes:       "Monthly bulk — lands and utilities",
      items: [
        { card: cardBySlug("eldrazi-temple")._id, cardId: "eldrazi-temple", cardName: "Eldrazi Temple", qty: 20, price: 3.49 },
        { card: cardBySlug("it-that-betrays")._id,cardId: "it-that-betrays",cardName: "It That Betrays", qty: 5,  price: 4.99 },
      ],
    },
    {
      distributor: distByName("Seoul MTG Hub")._id,
      createdBy:   adminUser._id,
      status:      "pending",
      notes:       "Awaiting payment confirmation",
      items: [
        { card: cardBySlug("ulamog-infinite-gyre")._id, cardId: "ulamog-infinite-gyre", cardName: "Ulamog, the Infinite Gyre", qty: 2, price: 34.99 },
        { card: cardBySlug("eye-of-ugin")._id,          cardId: "eye-of-ugin",          cardName: "Eye of Ugin",              qty: 6, price: 7.99  },
      ],
    },

    // ── Bangkok Planeswalkers — Bronze partner ─────────────────────────
    {
      distributor: distByName("Bangkok Planeswalkers")._id,
      createdBy:   managerUser._id,
      status:      "delivered",
      notes:       "First order — small trial batch",
      items: [
        { card: cardBySlug("it-that-betrays")._id, cardId: "it-that-betrays", cardName: "It That Betrays", qty: 4, price: 4.99 },
        { card: cardBySlug("eldrazi-temple")._id,  cardId: "eldrazi-temple",  cardName: "Eldrazi Temple",  qty: 8, price: 3.49 },
      ],
    },
    {
      distributor: distByName("Bangkok Planeswalkers")._id,
      createdBy:   managerUser._id,
      status:      "pending",
      notes:       "Follow-up order after successful trial",
      items: [
        { card: cardBySlug("ulamog-ceaseless-hunger")._id, cardId: "ulamog-ceaseless-hunger", cardName: "Ulamog, the Ceaseless Hunger", qty: 2, price: 27.99 },
        { card: cardBySlug("eldrazi-temple")._id,          cardId: "eldrazi-temple",          cardName: "Eldrazi Temple",              qty: 6, price: 3.49  },
      ],
    },

    // ── Singapore CardDen — Gold partner ──────────────────────────────
    {
      distributor: distByName("Singapore CardDen")._id,
      createdBy:   adminUser._id,
      status:      "delivered",
      notes:       "Premium vault cards — Gold tier allocation",
      items: [
        { card: cardBySlug("emrakul-aeons-torn")._id,      cardId: "emrakul-aeons-torn",      cardName: "Emrakul, the Aeons Torn",      qty: 3, price: 89.99 },
        { card: cardBySlug("emrakul-promised-end")._id,    cardId: "emrakul-promised-end",    cardName: "Emrakul, the Promised End",    qty: 2, price: 44.99 },
        { card: cardBySlug("ulamog-ceaseless-hunger")._id, cardId: "ulamog-ceaseless-hunger", cardName: "Ulamog, the Ceaseless Hunger", qty: 4, price: 27.99 },
      ],
    },
    {
      distributor: distByName("Singapore CardDen")._id,
      createdBy:   adminUser._id,
      status:      "shipped",
      notes:       "Mid-season restock",
      items: [
        { card: cardBySlug("kozilek-butcher")._id, cardId: "kozilek-butcher", cardName: "Kozilek, Butcher of Truth", qty: 2, price: 29.99 },
        { card: cardBySlug("eye-of-ugin")._id,     cardId: "eye-of-ugin",     cardName: "Eye of Ugin",              qty: 5, price: 7.99  },
        { card: cardBySlug("eldrazi-temple")._id,  cardId: "eldrazi-temple",  cardName: "Eldrazi Temple",           qty: 8, price: 3.49  },
      ],
    },
    {
      distributor: distByName("Singapore CardDen")._id,
      createdBy:   managerUser._id,
      status:      "cancelled",
      notes:       "Customer cancelled — stock returned to vault",
      items: [
        { card: cardBySlug("emrakul-aeons-torn")._id, cardId: "emrakul-aeons-torn", cardName: "Emrakul, the Aeons Torn", qty: 1, price: 89.99 },
      ],
    },
  ];

  // Save one-by-one so orderId pre-save hook increments correctly
  for (const def of orderDefs) {
    await Order.create(def);
  }

  console.log(`✅ Seed complete! (${orderDefs.length} orders created)`);
  await mongoose.disconnect();
  process.exit(0);
};

seed().catch(err => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});