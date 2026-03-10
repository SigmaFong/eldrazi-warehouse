// src/components/index.tsx
// Function 7.2 — Glassmorphism frosted glass UI components
// Function 7.4 — offline banner component

import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Image, ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, glass, rarity as rarityTheme, status as statusTheme, spacing, font } from '../utils/theme';

// ── Offline Banner (Function 7.4) ─────────────────────────────────────────
export function OfflineBanner({ queueLength, syncing }: { queueLength: number; syncing: boolean }) {
  return (
    <View style={styles.offlineBanner}>
      <LinearGradient
        colors={['rgba(239,68,68,0.2)', 'rgba(239,68,68,0.08)']}
        style={styles.offlineBannerInner}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
      >
        <Text style={styles.offlineIcon}>⚠</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.offlineTitle}>Offline Mode</Text>
          <Text style={styles.offlineSubtitle}>
            {syncing
              ? 'Syncing queued requests…'
              : `${queueLength} request${queueLength !== 1 ? 's' : ''} queued`}
          </Text>
        </View>
        {syncing && <ActivityIndicator size="small" color={colors.red} />}
      </LinearGradient>
    </View>
  );
}

// ── Glass Card (Function 7.2) ─────────────────────────────────────────────
export function GlassCard({
  children, style, violet = false,
}: { children: React.ReactNode; style?: ViewStyle; violet?: boolean }) {
  return (
    <View style={[violet ? glass.cardViolet : glass.card, styles.glassCard, style]}>
      {children}
    </View>
  );
}

// ── Rarity Badge ──────────────────────────────────────────────────────────
export function RarityBadge({ value }: { value: string }) {
  const theme = rarityTheme[value as keyof typeof rarityTheme] ?? rarityTheme.common;
  return (
    <View style={[styles.badge, { backgroundColor: theme.bg, borderColor: theme.border }]}>
      <Text style={[styles.badgeText, { color: theme.text }]}>{value}</Text>
    </View>
  );
}

// ── Status Badge ──────────────────────────────────────────────────────────
export function StatusBadge({ value }: { value: string }) {
  const theme = statusTheme[value as keyof typeof statusTheme] ?? statusTheme.pending;
  return (
    <View style={[styles.badge, { backgroundColor: theme.bg, borderColor: 'transparent' }]}>
      <Text style={[styles.badgeText, { color: theme.text }]}>{value}</Text>
    </View>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────
export function StatCard({
  label, value, sub, accent = false,
}: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <GlassCard violet={accent} style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, accent && { color: colors.violetLight }]}>{value}</Text>
      {sub && <Text style={styles.statSub}>{sub}</Text>}
    </GlassCard>
  );
}

// ── Card Thumbnail Row ────────────────────────────────────────────────────
export function CardRow({
  item, onPress,
}: { item: any; onPress: () => void }) {
  const avail = (item.quantity ?? 0) - (item.reserved ?? 0);
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.75}>
      <GlassCard style={styles.cardRow}>
        {item.img ? (
          <Image source={{ uri: item.img }} style={styles.cardThumb}
            onError={() => {}} />
        ) : (
          <View style={[styles.cardThumb, styles.cardThumbFallback]}>
            <Text style={{ color: colors.textDisabled, fontSize: 10 }}>—</Text>
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
          <View style={styles.row}>
            <RarityBadge value={item.rarity} />
            <Text style={styles.cardSet}>{item.set}</Text>
          </View>
        </View>
        <View style={styles.cardRight}>
          <Text style={styles.cardPrice}>${item.price?.toFixed(2)}</Text>
          <Text style={[styles.cardAvail, avail < 5 && { color: colors.amber }]}>
            {avail} avail
          </Text>
        </View>
      </GlassCard>
    </TouchableOpacity>
  );
}

// ── Loading Spinner ───────────────────────────────────────────────────────
export function Loader({ label }: { label?: string }) {
  return (
    <View style={styles.loader}>
      <ActivityIndicator size="large" color={colors.violetLight} />
      {label && <Text style={styles.loaderText}>{label}</Text>}
    </View>
  );
}

// ── Empty State ───────────────────────────────────────────────────────────
export function EmptyState({ icon, message }: { icon: string; message: string }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyIcon}>{icon}</Text>
      <Text style={styles.emptyText}>{message}</Text>
    </View>
  );
}

// ── Section Header ────────────────────────────────────────────────────────
export function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {subtitle && <Text style={styles.sectionSub}>{subtitle}</Text>}
    </View>
  );
}

// ── Queue Item Row (Function 7.5) ─────────────────────────────────────────
export function QueueRow({ item }: { item: any }) {
  return (
    <GlassCard style={styles.queueRow}>
      <View style={[styles.queueMethod, { backgroundColor: methodColor(item.method) }]}>
        <Text style={styles.queueMethodText}>{item.method}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.queueLabel} numberOfLines={1}>{item.label}</Text>
        <Text style={styles.queueEndpoint} numberOfLines={1}>{item.endpoint}</Text>
      </View>
      <Text style={styles.queueTime}>{new Date(item.timestamp).toLocaleTimeString()}</Text>
    </GlassCard>
  );
}

function methodColor(m: string) {
  if (m === 'POST')   return 'rgba(16,185,129,0.2)';
  if (m === 'PATCH')  return 'rgba(139,92,246,0.2)';
  if (m === 'DELETE') return 'rgba(239,68,68,0.2)';
  return 'rgba(63,63,70,0.3)';
}

const styles = StyleSheet.create({
  // Offline
  offlineBanner:      { marginHorizontal: spacing.md, marginBottom: spacing.sm },
  offlineBannerInner: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
                         padding: spacing.sm + 4, borderRadius: 12,
                         borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)' },
  offlineIcon:        { fontSize: 16 },
  offlineTitle:       { color: '#f87171', fontWeight: '700', fontSize: font.sizes.sm },
  offlineSubtitle:    { color: colors.textMuted, fontSize: font.sizes.xs, marginTop: 1 },
  // Glass
  glassCard:          { padding: spacing.md },
  // Badge
  badge:              { borderRadius: 6, borderWidth: 1, paddingHorizontal: 7, paddingVertical: 2,
                         alignSelf: 'flex-start' },
  badgeText:          { fontSize: font.sizes.xs, fontWeight: '700', textTransform: 'capitalize',
                         fontFamily: font.mono },
  // Stats
  statCard:           { flex: 1, minWidth: 100 },
  statLabel:          { fontSize: font.sizes.xs, color: colors.textMuted, fontFamily: font.mono,
                         textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  statValue:          { fontSize: font.sizes.xl, fontWeight: '900', color: colors.textPrimary, marginBottom: 2 },
  statSub:            { fontSize: font.sizes.xs, color: colors.textDisabled },
  // Card row
  cardRow:            { flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
                         marginBottom: spacing.sm, padding: spacing.sm + 4 },
  cardThumb:          { width: 36, height: 50, borderRadius: 6, borderWidth: 1,
                         borderColor: colors.border },
  cardThumbFallback:  { backgroundColor: colors.bgCard, alignItems: 'center', justifyContent: 'center' },
  cardName:           { fontSize: font.sizes.sm, fontWeight: '600', color: colors.textPrimary, marginBottom: 4 },
  cardSet:            { fontSize: font.sizes.xs, color: colors.textDisabled, fontFamily: font.mono,
                         marginLeft: spacing.xs },
  cardRight:          { alignItems: 'flex-end' },
  cardPrice:          { fontSize: font.sizes.sm, fontWeight: '700', color: colors.amber, fontFamily: font.mono },
  cardAvail:          { fontSize: font.sizes.xs, color: colors.textMuted, fontFamily: font.mono },
  row:                { flexDirection: 'row', alignItems: 'center' },
  // Loader
  loader:             { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.xl },
  loaderText:         { color: colors.textMuted, fontFamily: font.mono, fontSize: font.sizes.xs,
                         textTransform: 'uppercase', letterSpacing: 2 },
  // Empty
  empty:              { alignItems: 'center', padding: spacing.xl, gap: spacing.md },
  emptyIcon:          { fontSize: 40 },
  emptyText:          { color: colors.textDisabled, fontFamily: font.mono, fontSize: font.sizes.sm,
                         textAlign: 'center' },
  // Section header
  sectionHeader:      { marginBottom: spacing.sm },
  sectionTitle:       { fontSize: font.sizes.md, fontWeight: '800', color: colors.textPrimary },
  sectionSub:         { fontSize: font.sizes.xs, color: colors.textMuted, fontFamily: font.mono,
                         marginTop: 2 },
  // Queue
  queueRow:           { flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
                         marginBottom: spacing.xs, padding: spacing.sm },
  queueMethod:        { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  queueMethodText:    { fontSize: font.sizes.xs, fontWeight: '800', fontFamily: font.mono,
                         color: colors.textPrimary },
  queueLabel:         { fontSize: font.sizes.sm, color: colors.textPrimary, fontWeight: '600' },
  queueEndpoint:      { fontSize: font.sizes.xs, color: colors.textMuted, fontFamily: font.mono },
  queueTime:          { fontSize: font.sizes.xs, color: colors.textDisabled, fontFamily: font.mono },
});
