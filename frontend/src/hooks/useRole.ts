import { useAuth } from "../context/AuthContext";
import type { UserRole } from "../types";

const PERMISSIONS = {
  // Inventory
  canEditInventory:   ["admin", "manager"] as UserRole[],
  canDeleteInventory: ["admin"]            as UserRole[],  // soft-delete — admin only

  // Orders
  canCreateOrder:       ["admin", "manager"] as UserRole[],
  canCancelOrder:       ["admin"]            as UserRole[],
  canChangeOrderStatus: ["admin", "manager"] as UserRole[],

  // Distributors
  canCreateDistributor: ["admin"]            as UserRole[],
  canEditDistributor:   ["admin", "manager"] as UserRole[],
  canDeleteDistributor: ["admin"]            as UserRole[],

  // Scryfall
  canSyncPrices: ["admin", "manager"] as UserRole[],

  // Pages
  canSeeDashboard:  ["admin", "manager", "viewer"] as UserRole[],
  canSeeSystemInfo: ["admin"]                      as UserRole[],

  isDistributor: ["distributor"] as UserRole[],
} as const;

export type Permission = keyof typeof PERMISSIONS;

export function useRole() {
  const { user } = useAuth();
  const role = user?.role ?? "viewer";

  const can = (permission: Permission): boolean =>
    (PERMISSIONS[permission] as readonly string[]).includes(role);

  const is = (r: UserRole): boolean => role === r;

  return { role, can, is };
}