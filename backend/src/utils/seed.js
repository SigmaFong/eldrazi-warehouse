import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import Card        from "../models/Card.js";
import Distributor from "../models/Distributor.js";
import User        from "../models/User.js";

const cards = [
  { cardId:"emrakul-aeons-torn",      name:"Emrakul, the Aeons Torn",      set:"UMA", rarity:"mythic",   quantity:12, reserved:2, price:89.99, location:"VAULT-A1", condition:"NM", img:"https://cards.scryfall.io/normal/front/d/4/d4c5f485-3665-4d7d-94d3-e1c956ef2498.jpg" },
  { cardId:"ulamog-infinite-gyre",    name:"Ulamog, the Infinite Gyre",    set:"MM2", rarity:"mythic",   quantity:8,  reserved:1, price:34.99, location:"VAULT-A2", condition:"NM", img:"https://cards.scryfall.io/normal/front/9/e/9e1b9ee9-d08d-450c-9be4-c5f97de63d5e.jpg" },
  { cardId:"kozilek-butcher",         name:"Kozilek, Butcher of Truth",    set:"MM2", rarity:"mythic",   quantity:6,  reserved:0, price:29.99, location:"VAULT-A3", condition:"LP", img:"https://cards.scryfall.io/normal/front/b/7/b74d0cd6-dc30-4e03-8e37-ad4279c1e7e0.jpg" },
  { cardId:"emrakul-promised-end",    name:"Emrakul, the Promised End",    set:"EMN", rarity:"mythic",   quantity:15, reserved:3, price:44.99, location:"SHELF-B1", condition:"NM", img:"https://cards.scryfall.io/normal/front/f/3/f3e85fe3-e39e-4c2d-a0b8-0af6d1b1f4b5.jpg" },
  { cardId:"ulamog-ceaseless-hunger", name:"Ulamog, the Ceaseless Hunger", set:"BFZ", rarity:"mythic",   quantity:20, reserved:4, price:27.99, location:"SHELF-B2", condition:"NM", img:"https://cards.scryfall.io/normal/front/b/f/bf0d1f73-e92e-4ad2-ae7d-6c0e18bdc6d5.jpg" },
  { cardId:"it-that-betrays",         name:"It That Betrays",              set:"ROE", rarity:"rare",     quantity:30, reserved:0, price:4.99,  location:"SHELF-C1", condition:"MP", img:"https://cards.scryfall.io/normal/front/5/a/5af5571a-1e27-4db3-8c66-29c979a2c6a3.jpg" },
  { cardId:"eldrazi-temple",          name:"Eldrazi Temple",               set:"MM2", rarity:"uncommon", quantity:48, reserved:8, price:3.49,  location:"SHELF-D1", condition:"NM", img:"https://cards.scryfall.io/normal/front/d/3/d34f5bb8-9ec6-4cb1-bb24-e99e66eac6e3.jpg" },
  { cardId:"eye-of-ugin",             name:"Eye of Ugin",                  set:"MM2", rarity:"rare",     quantity:22, reserved:2, price:7.99,  location:"SHELF-D2", condition:"NM", img:"https://cards.scryfall.io/normal/front/a/9/a9bcd44f-df0e-485e-8c2b-0d31a2ac5291.jpg" },
];

const distributors = [
  { name:"Tokyo Card Exchange",   country:"Japan",       tier:"Gold",   creditLimit:50000, balance:12450, contact:"tanaka@tce.jp"   },
  { name:"Seoul MTG Hub",         country:"South Korea", tier:"Silver", creditLimit:25000, balance:4200,  contact:"kim@seoulhub.kr" },
  { name:"Bangkok Planeswalkers", country:"Thailand",    tier:"Bronze", creditLimit:10000, balance:890,   contact:"chai@bkkmtg.th"  },
  { name:"Singapore CardDen",     country:"Singapore",   tier:"Gold",   creditLimit:40000, balance:8750,  contact:"lim@cardden.sg"  },
];

const users = [
  { name:"Admin User",   email:"admin@eldrazi.com",   password:"Admin1234!", role:"admin"       },
  { name:"Manager",      email:"manager@eldrazi.com", password:"Manage1234!", role:"manager"     },
  { name:"Tokyo Dist",   email:"tanaka@tce.jp",       password:"Dist1234!",   role:"distributor" },
];

const seed = async () => {
  await connectDB();

  console.log("🗑  Clearing existing data...");
  await Promise.all([Card.deleteMany(), Distributor.deleteMany(), User.deleteMany()]);

  console.log("🌱 Seeding cards...");
  await Card.insertMany(cards);

  console.log("🌱 Seeding distributors...");
  await Distributor.insertMany(distributors);

  console.log("🌱 Seeding users...");
  // Use .create() so password hashing middleware runs
  for (const u of users) {
    await User.create(u);
  }

  console.log("✅ Seed complete!");
  await mongoose.disconnect();
  process.exit(0);
};

seed().catch(err => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
