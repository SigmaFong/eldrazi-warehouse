// src/screens/OrdersScreen.tsx
// Function 7.3 — real API orders, cross-screen data flow, detail navigation
// Function 7.4 — cached orders for offline viewing

import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Modal, ScrollView, RefreshControl, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNetwork } from '../hooks/useNetwork';
import api, { getCache, setCache } from '../services/api';
import {
  GlassCard, StatusBadge, RarityBadge, OfflineBanner,
  Loader, EmptyState, SectionHeader,
} from '../components';
import { colors, spacing, font, status as statusTheme, glass } from '../utils/theme';

const { width } = Dimensions.get('window');
const CACHE_KEY = 'orders_list';
type StatusFilter = 'all' | 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
const STATUS_FLOW = ['pending', 'processing', 'shipped', 'delivered'] as const;
const STATUS_STEP: Record<string, number> = {
  pending: 0, processing: 1, shipped: 2, delivered: 3, cancelled: -1,
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}
function distName(d: any) {
  if (!d) return '—';
  if (typeof d === 'string') return d;
  return d.name ?? '—';
}

export default function OrdersScreen() {
  const { isOnline, queueLength, syncing } = useNetwork();

  const [orders,      setOrders]      = useState<any[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [filter,      setFilter]      = useState<StatusFilter>('all');
  const [selected,    setSelected]    = useState<any | null>(null);
  const [fromCache,   setFromCache]   = useState(false);

  const load = useCallback(async (force = false) => {
    if (!force) {
      const cached = await getCache<any[]>(CACHE_KEY);
      if (cached) { setOrders(cached); setFromCache(true); setLoading(false); }
      if (!isOnline) return;
    }
    try {
      const { data } = await api.get('/orders?limit=50');
      const list = data.data.orders;
      await setCache(CACHE_KEY, list, 3 * 60 * 1000);
      setOrders(list);
      setFromCache(false);
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }, [isOnline]);

  useEffect(() => { load(); }, []);
  const onRefresh = useCallback(() => { setRefreshing(true); load(true); }, [load]);

  const shown = filter === 'all' ? orders : orders.filter(o => o.status === filter);

  if (loading) return <Loader label="LOADING ORDERS" />;

  return (
    <View style={styles.bg}>
      {(!isOnline || queueLength > 0) && (
        <OfflineBanner queueLength={queueLength} syncing={syncing} />
      )}

      {/* Status filter tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        style={styles.filterScroll} contentContainerStyle={styles.filterRow}>
        {(['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'] as StatusFilter[]).map(s => {
          const active = filter === s;
          const theme  = s !== 'all' ? statusTheme[s as keyof typeof statusTheme] : null;
          return (
            <TouchableOpacity key={s} onPress={() => setFilter(s)} activeOpacity={0.7}>
              <View style={[styles.filterPill,
                active && { backgroundColor: theme?.bg ?? 'rgba(139,92,246,0.15)',
                             borderColor: 'rgba(139,92,246,0.4)' }]}>
                <Text style={[styles.filterText, active && { color: theme?.text ?? colors.violetLight }]}>
                  {s === 'all' ? 'All' : s}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {fromCache && (
        <Text style={styles.cacheTag}>⚡ cached · pull to refresh</Text>
      )}

      <FlatList
        data={shown}
        keyExtractor={item => item._id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.violetLight} />}
        ListHeaderComponent={
          <SectionHeader title="Orders" subtitle={`${shown.length} of ${orders.length}`} />
        }
        ListEmptyComponent={<EmptyState icon="📦" message="No orders found" />}
        renderItem={({ item: o }) => (
          <TouchableOpacity onPress={() => setSelected(o)} activeOpacity={0.75}>
            <GlassCard style={styles.orderCard}>
              <View style={styles.orderTop}>
                <Text style={styles.orderId}>{o.orderId}</Text>
                <StatusBadge value={o.status} />
              </View>
              <View style={styles.orderMid}>
                <Text style={styles.distName} numberOfLines={1}>{distName(o.distributor)}</Text>
                <Text style={styles.itemCount}>{o.items?.length} items</Text>
              </View>
              <View style={styles.orderBottom}>
                <Text style={styles.orderDate}>{fmtDate(o.createdAt)}</Text>
                <Text style={styles.orderTotal}>${o.total?.toFixed(2)}</Text>
              </View>
            </GlassCard>
          </TouchableOpacity>
        )}
      />

      {/* ── Order Detail Modal ── */}
      <Modal visible={!!selected} animationType="slide" transparent onRequestClose={() => setSelected(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            {selected && <OrderDetailSheet order={selected} onClose={() => setSelected(null)} />}
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ── Order Detail Sheet ────────────────────────────────────────────────────
function OrderDetailSheet({ order, onClose }: { order: any; onClose: () => void }) {
  const cur = STATUS_STEP[order.status] ?? 0;

  return (
    <LinearGradient colors={['#18181b', '#09090b']} style={styles.sheet}>
      <View style={styles.handle} />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.sheetHeader}>
          <View>
            <Text style={styles.sheetOrderId}>{order.orderId}</Text>
            <Text style={styles.sheetDist}>{distName(order.distributor)}</Text>
          </View>
          <Text style={styles.sheetTotal}>${order.total?.toFixed(2)}</Text>
        </View>

        {/* Progress tracker */}
        <GlassCard style={styles.progressCard}>
          {order.status === 'cancelled' ? (
            <View style={styles.cancelledBanner}>
              <Text style={styles.cancelledText}>✕ Cancelled</Text>
            </View>
          ) : (
            <View style={styles.progressRow}>
              {STATUS_FLOW.map((s, i) => {
                const done   = i <= cur;
                const active = i === cur;
                return (
                  <View key={s} style={styles.stepWrap}>
                    {/* connector left */}
                    <View style={[styles.connector, i === 0 && { opacity: 0 },
                      i <= cur && i > 0 && { backgroundColor: colors.violetLight }]} />
                    {/* dot */}
                    <View style={[styles.dot,
                      active && { backgroundColor: 'rgba(139,92,246,0.2)', borderColor: colors.violetLight,
                                   shadowColor: colors.violetLight, shadowOpacity: 0.8, shadowRadius: 8, elevation: 4 },
                      done && !active && { borderColor: '#6d28d9', backgroundColor: 'rgba(109,40,217,0.3)' },
                    ]}>
                      <Text style={[styles.dotText, (done || active) && { color: colors.violetLight }]}>
                        {done && !active ? '✓' : String(i + 1)}
                      </Text>
                    </View>
                    {/* connector right */}
                    <View style={[styles.connector, i === STATUS_FLOW.length - 1 && { opacity: 0 },
                      i < cur && { backgroundColor: colors.violetLight }]} />
                    {/* label */}
                    <Text style={[styles.stepLabel,
                      active && { color: colors.violetLight },
                      done && !active && { color: '#6d28d9' }]}>
                      {s}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
        </GlassCard>

        {/* Meta */}
        <View style={styles.metaGrid}>
          {[
            ['Date', fmtDate(order.createdAt)],
            ['Items', `${order.items?.length} lines`],
            ['Status', order.status],
            ['Notes', order.notes || '—'],
          ].map(([k, v]) => (
            <GlassCard key={k} style={styles.metaCell}>
              <Text style={styles.metaLabel}>{k}</Text>
              <Text style={styles.metaValue} numberOfLines={2}>{v}</Text>
            </GlassCard>
          ))}
        </View>

        {/* Items */}
        <SectionHeader title={`Items (${order.items?.length})`} />
        {order.items?.map((item: any, i: number) => (
          <GlassCard key={i} style={styles.itemRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemName}>{item.cardName}</Text>
              <Text style={styles.itemId}>{item.cardId}</Text>
            </View>
            <View style={styles.itemRight}>
              <Text style={styles.itemQty}>×{item.qty}</Text>
              <Text style={styles.itemPrice}>${(item.price * item.qty).toFixed(2)}</Text>
            </View>
          </GlassCard>
        ))}

        {/* Total */}
        <GlassCard violet style={styles.totalRow}>
          <Text style={styles.totalLabel}>Order Total</Text>
          <Text style={styles.totalValue}>${order.total?.toFixed(2)}</Text>
        </GlassCard>

        <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
          <Text style={styles.closeBtnText}>Close</Text>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  bg:           { flex: 1, backgroundColor: colors.bg },
  // Filter
  filterScroll: { maxHeight: 46, marginTop: spacing.xs },
  filterRow:    { paddingHorizontal: spacing.md, gap: spacing.xs },
  filterPill:   { borderRadius: 20, borderWidth: 1, borderColor: colors.border,
                   paddingHorizontal: 14, paddingVertical: 7, marginRight: spacing.xs },
  filterText:   { fontSize: font.sizes.xs, fontWeight: '700', color: colors.textMuted,
                   textTransform: 'capitalize' },
  cacheTag:     { fontSize: font.sizes.xs, color: colors.textDisabled, fontFamily: font.mono,
                   textAlign: 'center', paddingVertical: 4 },
  // List
  listContent:  { padding: spacing.md, paddingBottom: 100 },
  orderCard:    { marginBottom: spacing.sm, padding: spacing.sm + 4 },
  orderTop:     { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  orderId:      { fontSize: font.sizes.sm, fontFamily: font.mono, color: colors.violetLight, fontWeight: '700' },
  orderMid:     { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  distName:     { fontSize: font.sizes.sm, fontWeight: '600', color: colors.textPrimary, flex: 1 },
  itemCount:    { fontSize: font.sizes.xs, color: colors.textMuted, fontFamily: font.mono },
  orderBottom:  { flexDirection: 'row', justifyContent: 'space-between' },
  orderDate:    { fontSize: font.sizes.xs, color: colors.textDisabled, fontFamily: font.mono },
  orderTotal:   { fontSize: font.sizes.sm, fontWeight: '800', color: colors.amber, fontFamily: font.mono },
  // Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.75)' },
  modalSheet:   { height: '90%', borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden' },
  // Sheet
  sheet:        { flex: 1, padding: spacing.md },
  handle:       { width: 40, height: 4, backgroundColor: colors.border, borderRadius: 2,
                   alignSelf: 'center', marginBottom: spacing.md },
  sheetHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
                   marginBottom: spacing.md },
  sheetOrderId: { fontSize: font.sizes.lg, fontWeight: '900', color: colors.violetLight, fontFamily: font.mono },
  sheetDist:    { fontSize: font.sizes.sm, color: colors.textSecond, marginTop: 4 },
  sheetTotal:   { fontSize: font.sizes.xxl, fontWeight: '900', color: colors.amber, fontFamily: font.mono },
  // Progress
  progressCard: { marginBottom: spacing.md, padding: spacing.md },
  progressRow:  { flexDirection: 'row', alignItems: 'flex-start' },
  stepWrap:     { flex: 1, alignItems: 'center' },
  connector:    { flex: 1, height: 2, backgroundColor: colors.border, marginTop: 14 },
  dot:          { width: 30, height: 30, borderRadius: 15, borderWidth: 2,
                   borderColor: colors.border, backgroundColor: colors.bgCard,
                   alignItems: 'center', justifyContent: 'center' },
  dotText:      { fontSize: font.sizes.xs, fontWeight: '800', color: colors.textDisabled },
  stepLabel:    { fontSize: 9, color: colors.textDisabled, fontFamily: font.mono,
                   textTransform: 'uppercase', marginTop: 6, letterSpacing: 0.5 },
  cancelledBanner: { backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: 8, padding: 12,
                      alignItems: 'center', borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)' },
  cancelledText:   { color: '#f87171', fontWeight: '700', fontSize: font.sizes.sm },
  // Meta
  metaGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  metaCell:    { width: (width - spacing.md * 2 - spacing.sm) / 2 - spacing.md, padding: spacing.sm },
  metaLabel:   { fontSize: font.sizes.xs, color: colors.textMuted, fontFamily: font.mono,
                  textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  metaValue:   { fontSize: font.sizes.sm, color: colors.textPrimary, fontWeight: '600',
                  textTransform: 'capitalize' },
  // Items
  itemRow:     { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs,
                  padding: spacing.sm },
  itemName:    { fontSize: font.sizes.sm, fontWeight: '600', color: colors.textPrimary },
  itemId:      { fontSize: font.sizes.xs, color: colors.textDisabled, fontFamily: font.mono, marginTop: 2 },
  itemRight:   { alignItems: 'flex-end' },
  itemQty:     { fontSize: font.sizes.sm, color: colors.textSecond, fontFamily: font.mono },
  itemPrice:   { fontSize: font.sizes.sm, fontWeight: '800', color: colors.amber, fontFamily: font.mono },
  // Total
  totalRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                  marginVertical: spacing.sm },
  totalLabel:  { fontSize: font.sizes.sm, color: colors.textMuted, fontFamily: font.mono,
                  textTransform: 'uppercase', letterSpacing: 1 },
  totalValue:  { fontSize: font.sizes.xl, fontWeight: '900', color: colors.amber, fontFamily: font.mono },
  // Close
  closeBtn:    { borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 14,
                  alignItems: 'center', marginVertical: spacing.md },
  closeBtnText:{ color: colors.textMuted, fontWeight: '600' },
});
