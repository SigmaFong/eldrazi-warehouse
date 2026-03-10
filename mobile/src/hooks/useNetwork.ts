// src/hooks/useNetwork.ts
// Function 7.4 — app resilience, unstable network state management

import { useState, useEffect, useCallback } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import api, {
  getQueue, removeFromQueue, clearQueue,
  QueueItem, getCache, setCache,
} from '../services/api';

export interface NetworkStatus {
  isConnected:    boolean;
  isInternetReachable: boolean | null;
  type:           string;
}

export function useNetwork() {
  const [netStatus, setNetStatus] = useState<NetworkStatus>({
    isConnected: true,
    isInternetReachable: true,
    type: 'unknown',
  });
  const [queueLength, setQueueLength] = useState(0);
  const [syncing,     setSyncing]     = useState(false);

  // Subscribe to network changes
  useEffect(() => {
    const unsub = NetInfo.addEventListener((state: NetInfoState) => {
      setNetStatus({
        isConnected:         state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable,
        type:                state.type,
      });
      // Auto-sync queue when back online
      if (state.isConnected && state.isInternetReachable) {
        syncQueue();
      }
    });
    // Initial fetch
    NetInfo.fetch().then((state: NetInfoState) => {
      setNetStatus({
        isConnected:         state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable,
        type:                state.type,
      });
    });
    refreshQueueLength();
    return unsub;
  }, []);

  const refreshQueueLength = useCallback(async () => {
    const q = await getQueue();
    setQueueLength(q.length);
  }, []);

  // Drain queued requests when online (Function 7.5)
  const syncQueue = useCallback(async () => {
    if (syncing) return;
    const queue = await getQueue();
    if (!queue.length) return;
    setSyncing(true);
    const results: { item: QueueItem; success: boolean }[] = [];
    for (const item of queue) {
      try {
        await api.request({ method: item.method, url: item.endpoint, data: item.payload });
        await removeFromQueue(item.id);
        results.push({ item, success: true });
      } catch {
        results.push({ item, success: false });
      }
    }
    await refreshQueueLength();
    setSyncing(false);
    return results;
  }, [syncing]);

  const isOnline = netStatus.isConnected && netStatus.isInternetReachable !== false;

  return { netStatus, isOnline, queueLength, syncing, syncQueue, refreshQueueLength };
}
