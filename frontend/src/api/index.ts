import axiosInstance from "./axiosInstance";
import type { CardInventory, Order, Distributor, ScryfallCard } from "../../types";

// ── Inventory ─────────────────────────────────────────────────────────────
export async function getInventory(): Promise<CardInventory[]> {
  const { data } = await axiosInstance.get("/cards");
  return data.data.cards;
}

export async function updateInventory(
  id: string,
  patch: Partial<CardInventory>
): Promise<CardInventory> {
  const { data } = await axiosInstance.patch(`/cards/${id}`, patch);
  return data.data.card;
}

// ── Orders ────────────────────────────────────────────────────────────────
export async function getOrders(): Promise<Order[]> {
  const { data } = await axiosInstance.get("/orders");
  return data.data.orders;
}

export async function createOrder(
  payload: Omit<Order, "id" | "date">
): Promise<Order> {
  const { data } = await axiosInstance.post("/orders", payload);
  return data.data.order;
}

// ── Distributors ──────────────────────────────────────────────────────────
export async function getDistributors(): Promise<Distributor[]> {
  const { data } = await axiosInstance.get("/distributors");
  return data.data.distributors;
}

// ── Scryfall ──────────────────────────────────────────────────────────────
export async function fetchScryfallById(
  cardmarketId: string
): Promise<ScryfallCard | null> {
  try {
    const { data } = await axiosInstance.get(`/scryfall/cardmarket/${cardmarketId}`);
    return data.data.card;
  } catch {
    return null;
  }
}

export async function searchScryfallEldrazi(): Promise<ScryfallCard[]> {
  try {
    const { data } = await axiosInstance.get("/scryfall/search");
    return data.data.cards;
  } catch {
    return [];
  }
}
