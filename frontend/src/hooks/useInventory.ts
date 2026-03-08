import { useState, useEffect, useCallback } from "react";
import type { CardInventory } from "../../types";
import { getInventory, updateInventory } from "../api";

export function useInventory() {
  const [inventory, setInventory] = useState<CardInventory[]>([]);
  const [loading,   setLoading]   = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await getInventory();
    setInventory(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const update = useCallback(async (id: string, patch: Partial<CardInventory>) => {
    await updateInventory(id, patch);
    await load();
  }, [load]);

  return { inventory, loading, reload: load, update };
}
