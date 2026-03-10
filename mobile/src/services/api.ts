// src/services/api.ts
// Function 7.1 — professional structured service layer
// Function 7.3 — real API connectivity with JWT auth
// Function 7.4 — resilience: timeout, retry, offline detection

import axios, { AxiosInstance, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ── Config ────────────────────────────────────────────────────────────────
// Change this to your machine's LAN IP when running on a physical device
// e.g. "http://192.168.1.42:5000/api"
export const API_BASE_URL = 'http://192.168.1.100:5000/api';
export const TOKEN_KEY    = 'eldrazi_token';
export const CACHE_PREFIX = 'cache_';

// ── Create axios instance ─────────────────────────────────────────────────
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor: attach token ────────────────────────────────────
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// ── Response interceptor: normalise errors ────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string }>) => {
    const message =
      error.response?.data?.message ??
      error.message ??
      'Network error';
    return Promise.reject(new Error(message));
  }
);

export default api;

// ── Cache helpers (Function 7.4) ──────────────────────────────────────────
export interface CacheEntry<T> {
  data:      T;
  timestamp: number;
  ttl:       number; // ms
}

export async function setCache<T>(key: string, data: T, ttlMs = 5 * 60 * 1000) {
  const entry: CacheEntry<T> = { data, timestamp: Date.now(), ttl: ttlMs };
  await AsyncStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
}

export async function getCache<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const entry: CacheEntry<T> = JSON.parse(raw);
    if (Date.now() - entry.timestamp > entry.ttl) return null; // expired
    return entry.data;
  } catch {
    return null;
  }
}

export async function clearCache(key: string) {
  await AsyncStorage.removeItem(CACHE_PREFIX + key);
}

// ── Queue storage (Function 7.5 — offline queue) ─────────────────────────
export const QUEUE_KEY = 'offline_queue';

export interface QueueItem {
  id:        string;
  method:    'GET' | 'POST' | 'PATCH' | 'DELETE';
  endpoint:  string;
  payload?:  unknown;
  label:     string; // human-readable description
  timestamp: number;
}

export async function enqueueRequest(item: Omit<QueueItem, 'id' | 'timestamp'>) {
  const queue = await getQueue();
  const newItem: QueueItem = {
    ...item,
    id:        Date.now().toString(),
    timestamp: Date.now(),
  };
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify([...queue, newItem]));
  return newItem;
}

export async function getQueue(): Promise<QueueItem[]> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export async function removeFromQueue(id: string) {
  const queue = await getQueue();
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue.filter(q => q.id !== id)));
}

export async function clearQueue() {
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify([]));
}
