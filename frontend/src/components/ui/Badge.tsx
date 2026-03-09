import type { Rarity, Condition, OrderStatus, DistributorTier } from "../../types";

const RARITY_CLS: Record<Rarity, string> = {
  mythic:   "bg-amber-500/20  text-amber-300  border border-amber-500/30",
  rare:     "bg-violet-500/20 text-violet-300 border border-violet-500/30",
  uncommon: "bg-slate-500/20  text-slate-300  border border-slate-500/30",
  common:   "bg-zinc-700/40   text-zinc-400   border border-zinc-600/30",
};

const CONDITION_CLS: Record<Condition, string> = {
  NM:  "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30",
  LP:  "bg-blue-500/20    text-blue-300    border border-blue-500/30",
  MP:  "bg-amber-500/20   text-amber-300   border border-amber-500/30",
  HP:  "bg-red-500/20     text-red-300     border border-red-500/30",
  DMG: "bg-red-800/30     text-red-400     border border-red-700/30",
};

const STATUS_CLS: Record<OrderStatus, string> = {
  pending:    "bg-slate-500/20  text-slate-300   border border-slate-500/30",
  processing: "bg-amber-500/20  text-amber-300   border border-amber-500/30",
  shipped:    "bg-blue-500/20   text-blue-300    border border-blue-500/30",
  delivered:  "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30",
};

const TIER_CLS: Record<DistributorTier, string> = {
  Gold:   "bg-amber-500/20  text-amber-300  border border-amber-500/30",
  Silver: "bg-slate-400/20  text-slate-300  border border-slate-400/30",
  Bronze: "bg-orange-700/20 text-orange-400 border border-orange-600/30",
};

interface BadgeProps {
  variant: "rarity" | "condition" | "status" | "tier";
  value: string;
}

export function Badge({ variant, value }: BadgeProps) {
  const cls =
    variant === "rarity"    ? RARITY_CLS[value as Rarity]           :
    variant === "condition" ? CONDITION_CLS[value as Condition]      :
    variant === "status"    ? STATUS_CLS[value as OrderStatus]       :
    TIER_CLS[value as DistributorTier];

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider font-mono ${cls}`}>
      {value}
    </span>
  );
}
