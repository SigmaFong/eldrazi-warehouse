// src/screens/DashboardScreen.tsx
// Function 7.3 — real API data, cross-screen state
// Function 7.4 — caching with TTL, graceful offline fallback

import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  RefreshControl, TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { useNetwork } from '../hooks/useNetwork';
import api, { getCache, setCache } from '../services/api';
import { GlassCard, StatCard, OfflineBanner, Loader, SectionHeader } from '../components';
import { colors, spacing, font, status as statusTheme } from '../utils/theme';

interface Stats {
  totalCards:    number;
  totalValue:    number;
  totalOrders:   number;
  pendingOrders: number;
  lowStock:      number;
  ordersByStatus:{ _id: string; count: number; totalValue: number }[];
}

const CACHE_KEY = 'dashboard_stats';

export default function DashboardScreen() {
  const { user } = useAuth();
  const { isOnline, queueLength, syncing } = useNetwork();

  const [stats,      setStats]      = useState<Stats | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fromCache,  setFromCache]  = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  const load = useCallback(async (force = false) => {
    setError(null);
    // Function 7.4 — try cache first if offline or not forcing
    if (!force) {
      const cached = await getCache<Stats>(CACHE_KEY);
      if (cached) {
        setStats(cached);
        setFromCache(true);
        setLoading(false);
        if (!isOnline) return; // stay on cache if offline
      }
    }

    if (!isOnline && !force) return;

    try {
      // Parallel fetch: inventory stats + order stats
      const [invRes, orderRes] = await Promise.all([
        api.get('/cards/stats'),
        api.get('/orders/stats'),
      ]);

      // /cards/stats returns: { data: { byRarity: [...], overall: { totalCards, totalValue } } }
      const overall  = invRes.data.data.overall  ?? {};
      const byRarity = invRes.data.data.byRarity ?? [];

      const totalCards = overall.totalCards ?? byRarity.reduce((s: number, x: any) => s + (x.count ?? 0), 0);
      const totalValue = overall.totalValue ?? byRarity.reduce((s: number, x: any) => s + (x.totalValue ?? 0), 0);

      // /orders/stats returns: { data: { stats: [{ _id, count, totalValue }] } }
      const orderData: { _id: string; count: number; totalValue: number }[]
        = orderRes.data.data.stats ?? [];

      const totalOrders   = orderData.reduce((s, x) => s + x.count, 0);
      const pendingOrders = orderData.find(x => x._id === 'pending')?.count ?? 0;

      const built: Stats = {
        totalCards,
        totalValue:     +totalValue.toFixed(2),
        lowStock:       0,
        totalOrders,
        pendingOrders,
        ordersByStatus: orderData,
      };

      await setCache(CACHE_KEY, built, 3 * 60 * 1000); // 3-min TTL
      setStats(built);
      setFromCache(false);
    } catch (err: any) {
      setError(err.message);
      // keep cached data visible if available
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isOnline]);

  useEffect(() => { load(); }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load(true);
  }, [load]);

  if (loading) return <Loader label="LOADING DASHBOARD" />;

  return (
    <ScrollView
      style={styles.bg}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.violetLight} />}
    >
      {/* Offline banner (Function 7.4) */}
      {(!isOnline || queueLength > 0) && (
        <OfflineBanner queueLength={queueLength} syncing={syncing} />
      )}

      {/* Cache indicator */}
      {fromCache && isOnline && (
        <View style={styles.cacheBanner}>
          <Text style={styles.cacheText}>⚡ Showing cached data · Pull to refresh</Text>
        </View>
      )}

      {/* Welcome */}
      <LinearGradient
        colors={['rgba(139,92,246,0.12)', 'transparent']}
        style={styles.welcome}
      >
        <View>
          <Text style={styles.welcomeGreet}>Welcome back,</Text>
          <Text style={styles.welcomeName}>{user?.name}</Text>
        </View>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{user?.role?.toUpperCase()}</Text>
        </View>
      </LinearGradient>

      {/* Error */}
      {error && (
        <GlassCard style={styles.errorCard}>
          <Text style={styles.errorText}>⚠ {error}</Text>
        </GlassCard>
      )}

      {stats && (
        <>
          {/* Stat grid */}
          <SectionHeader title="Overview" subtitle="Live from Eldrazi Warehouse" />
          <View style={styles.statGrid}>
            <StatCard label="Total Cards" value={String(stats.totalCards)} />
            <StatCard label="Vault Value" value={`$${stats.totalValue.toFixed(0)}`} accent />
          </View>
          <View style={styles.statGrid}>
            <StatCard label="Total Orders" value={String(stats.totalOrders)} />
            <StatCard label="Pending" value={String(stats.pendingOrders)}
              sub={stats.pendingOrders > 0 ? 'Needs attention' : 'All clear'} />
          </View>
          {stats.lowStock > 0 && (
            <GlassCard style={styles.alertCard} violet>
              <Text style={styles.alertIcon}>⚠</Text>
              <View>
                <Text style={styles.alertTitle}>{stats.lowStock} cards low on stock</Text>
                <Text style={styles.alertSub}>Check inventory for details</Text>
              </View>
            </GlassCard>
          )}

          {/* Order status breakdown */}
          <SectionHeader title="Order Status" />
          <GlassCard>
            {stats.ordersByStatus.map((s, i) => {
              const theme = statusTheme[s._id as keyof typeof statusTheme];
              const pct   = stats.totalOrders > 0 ? s.count / stats.totalOrders : 0;
              return (
                <View key={s._id}>
                  {i > 0 && <View style={styles.divider} />}
                  <View style={styles.statusRow}>
                    <View style={[styles.statusDot, { backgroundColor: theme?.text ?? colors.textMuted }]} />
                    <Text style={styles.statusName}>{s._id}</Text>
                    <View style={styles.statusBarWrap}>
                      <View style={[styles.statusBar, {
                        width: `${Math.round(pct * 100)}%`,
                        backgroundColor: theme?.text ?? colors.textMuted,
                      }]} />
                    </View>
                    <Text style={[styles.statusCount, { color: theme?.text ?? colors.textMuted }]}>
                      {s.count}
                    </Text>
                  </View>
                </View>
              );
            })}
          </GlassCard>

        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  bg:           { flex: 1, backgroundColor: colors.bg },
  content:      { padding: spacing.md, paddingBottom: spacing.xxl },
  // Cache/offline
  cacheBanner:  { backgroundColor: 'rgba(245,158,11,0.1)', borderRadius: 10, padding: 8,
                   marginBottom: spacing.sm, borderWidth: 1, borderColor: 'rgba(245,158,11,0.2)' },
  cacheText:    { color: colors.amber, fontSize: font.sizes.xs, fontFamily: font.mono, textAlign: 'center' },
  // Welcome
  welcome:      { borderRadius: 16, padding: spacing.md, flexDirection: 'row',
                   alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.lg,
                   borderWidth: 1, borderColor: 'rgba(139,92,246,0.2)' },
  welcomeGreet: { fontSize: font.sizes.sm, color: colors.textMuted },
  welcomeName:  { fontSize: font.sizes.lg, fontWeight: '800', color: colors.textPrimary, marginTop: 2 },
  roleBadge:    { backgroundColor: 'rgba(139,92,246,0.2)', borderWidth: 1,
                   borderColor: 'rgba(139,92,246,0.4)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  roleText:     { fontSize: font.sizes.xs, color: colors.violetLight, fontFamily: font.mono,
                   fontWeight: '700', letterSpacing: 1 },
  // Stats
  statGrid:     { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  // Alert
  alertCard:    { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  alertIcon:    { fontSize: 20 },
  alertTitle:   { fontSize: font.sizes.sm, fontWeight: '700', color: colors.amber },
  alertSub:     { fontSize: font.sizes.xs, color: colors.textMuted, marginTop: 2 },
  // Status breakdown
  divider:      { height: 1, backgroundColor: colors.border, marginVertical: 8 },
  statusRow:    { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  statusDot:    { width: 8, height: 8, borderRadius: 4 },
  statusName:   { fontSize: font.sizes.sm, color: colors.textSecond, textTransform: 'capitalize',
                   width: 80 },
  statusBarWrap:{ flex: 1, height: 6, backgroundColor: colors.border, borderRadius: 3, overflow: 'hidden' },
  statusBar:    { height: '100%', borderRadius: 3, opacity: 0.7 },
  statusCount:  { fontSize: font.sizes.sm, fontFamily: font.mono, fontWeight: '700', width: 24,
                   textAlign: 'right' },
  // Error
  errorCard:    { marginBottom: spacing.md },
  errorText:    { color: '#f87171', fontSize: font.sizes.sm },
});