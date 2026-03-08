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

export type Rarity = "mythic" | "rare" | "uncommon" | "common";
export type Condition = "NM" | "LP" | "MP" | "HP" | "DMG";
export type OrderStatus = "pending" | "processing" | "shipped" | "delivered";
export type DistributorTier = "Gold" | "Silver" | "Bronze";
export type Page = "dashboard" | "inventory" | "orders" | "distributors" | "scryfall";
export type ToastType = "success" | "error";

export interface CardInventory {
  id: string;
  cardId: string;
  name: string;
  set: string;
  rarity: Rarity;
  quantity: number;
  reserved: number;
  price: number;
  location: string;
  condition: Condition;
  img: string;
}

export interface OrderItem {
  cardId: string;
  qty: number;
  price: number;
}

export interface Order {
  id: string;
  distributor: string;
  items: OrderItem[];
  status: OrderStatus;
  date: string;
  total: number;
}

export interface Distributor {
  id: string;
  name: string;
  country: string;
  tier: DistributorTier;
  creditLimit: number;
  balance: number;
  contact: string;
  activeOrders: number;
}

export interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

export interface ScryfallCard {
  id: string;
  name: string;
  type_line: string;
  oracle_text?: string;
  mana_cost?: string;
  power?: string;
  toughness?: string;
  rarity: string;
  set_name: string;
  object: string;
  details?: string;
  image_uris?: {
    small: string;
    normal: string;
    large: string;
  };
  prices?: {
    usd?: string;
    eur?: string;
  };
}
