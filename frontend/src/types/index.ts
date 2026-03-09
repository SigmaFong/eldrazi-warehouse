export type UserRole = "admin" | "manager" | "distributor" | "viewer";

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export type Rarity        = "mythic" | "rare" | "uncommon" | "common";
export type Condition     = "NM" | "LP" | "MP" | "HP" | "DMG";
export type OrderStatus   = "pending" | "processing" | "shipped" | "delivered" | "cancelled";
export type DistributorTier = "Gold" | "Silver" | "Bronze";

// ✅ "system" added here
export type Page        = "dashboard" | "inventory" | "orders" | "distributors" | "scryfall" | "system";
export type ToastType   = "success" | "error";

export interface CardInventory {
  _id:       string;
  id:        string;
  cardId:    string;
  name:      string;
  set:       string;
  rarity:    Rarity;
  quantity:  number;
  reserved:  number;
  price:     number;
  location:  string;
  condition: Condition;
  img:       string;
}

export interface OrderItem {
  cardId:   string;
  cardName: string;
  qty:      number;
  price:    number;
}

export interface OrderDistributor {
  _id:     string;
  name:    string;
  country: string;
  tier:    DistributorTier;
}

export interface Order {
  _id:         string;
  id:          string;
  orderId:     string;
  distributor: OrderDistributor;
  createdBy:   { _id: string; name: string; email: string } | string;
  items:       OrderItem[];
  status:      OrderStatus;
  total:       number;
  createdAt:   string;
  notes?:      string;
}

export interface Distributor {
  _id:             string;
  id:              string;
  name:            string;
  country:         string;
  tier:            DistributorTier;
  creditLimit:     number;
  balance:         number;
  contact:         string;
  active:          boolean;
  creditAvailable: number;
  creditUsedPct:   number;
}

export interface Toast {
  id:      number;
  message: string;
  type:    ToastType;
}

export interface ScryfallCard {
  id:           string;
  name:         string;
  type_line:    string;
  oracle_text?: string;
  mana_cost?:   string;
  power?:       string;
  toughness?:   string;
  rarity:       string;
  set_name:     string;
  object:       string;
  details?:     string;
  image_uris?: { small: string; normal: string; large: string };
  prices?:     { usd?: string; eur?: string };
}