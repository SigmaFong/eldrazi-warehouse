// src/screens/InventoryScreen.tsx
// Function 7.3 — real API with search + filter, maintaining state across navigation
// Function 7.4 — cache-first loading, offline graceful fallback

import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, Modal, Image, ScrollView,
  RefreshControl, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNetwork } from '../hooks/useNetwork';
import api, { getCache, setCache } from '../services/api';
import {
  GlassCard, RarityBadge, OfflineBanner, Loader, EmptyState, SectionHeader,
} from '../components';
import { colors, spacing, font, rarity as rarityTheme, glass } from '../utils/theme';

const { width } = Dimensions.get('window');
type Rarity = 'all' | 'mythic' | 'rare' | 'uncommon' | 'common';
const CACHE_KEY = 'inventory_list';

export default function InventoryScreen() {
  const { isOnline, queueLength, syncing } = useNetwork();

  const [cards,      setCards]      = useState<any[]>([]);
  const [filtered,   setFiltered]   = useState<any[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search,     setSearch]     = useState('');
  const [rarity,     setRarity]     = useState<Rarity>('all');
  const [selected,   setSelected]   = useState<any | null>(null);
  const [fromCache,  setFromCache]  = useState(false);

  const load = useCallback(async (force = false) => {
    if (!force) {
      const cached = await getCache<any[]>(CACHE_KEY);
      if (cached) { setCards(cached); setFiltered(cached); setFromCache(true); setLoading(false); }
      if (!isOnline) return;
    }
    try {
      const { data } = await api.get('/cards?limit=100&sort=name');
      const list = data.data.cards;
      await setCache(CACHE_KEY, list, 5 * 60 * 1000);
      setCards(list);
      setFiltered(list);
      setFromCache(false);
    } catch (err: any) {
      // keep cached if available
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isOnline]);

  useEffect(() => { load(); }, []);

  // Filter logic
  useEffect(() => {
    let result = cards;
    if (rarity !== 'all') result = result.filter(c => c.rarity === rarity);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(c =>
        c.name.toLowerCase().includes(q) || c.set?.toLowerCase().includes(q)
      );
    }
    setFiltered(result);
  }, [cards, search, rarity]);

  const onRefresh = useCallback(() => { setRefreshing(true); load(true); }, [load]);

  if (loading) return <Loader label="LOADING INVENTORY" />;

  const RARITIES: Rarity[] = ['all', 'mythic', 'rare', 'uncommon', 'common'];

  return (
    <View style={styles.bg}>
      {(!isOnline || queueLength > 0) && (
        <OfflineBanner queueLength={queueLength} syncing={syncing} />
      )}

      {/* Search bar (Function 7.2 — glass input) */}
      <View style={styles.searchArea}>
        <View style={[glass.input, styles.searchWrap]}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search cards or set…"
            placeholderTextColor={colors.textDisabled}
            style={styles.searchInput}
          />
          {search !== '' && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Text style={styles.searchClear}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Rarity filter tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}
        contentContainerStyle={styles.filterContent}>
        {RARITIES.map(r => {
          const active = rarity === r;
          const theme  = r !== 'all' ? rarityTheme[r as keyof typeof rarityTheme] : null;
          return (
            <TouchableOpacity key={r} onPress={() => setRarity(r)} style={styles.filterBtn} activeOpacity={0.7}>
              <View style={[
                styles.filterPill,
                active && { backgroundColor: theme?.bg ?? 'rgba(139,92,246,0.15)',
                             borderColor: theme?.border ?? 'rgba(139,92,246,0.4)' },
              ]}>
                <Text style={[
                  styles.filterText,
                  active && { color: theme?.text ?? colors.violetLight },
                ]}>
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Cache tag */}
      {fromCache && (
        <Text style={styles.cacheTag}>⚡ cached · pull to refresh</Text>
      )}

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={item => item._id ?? item.cardId}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.violetLight} />}
        ListEmptyComponent={<EmptyState icon="🃏" message="No cards found" />}
        ListHeaderComponent={
          <SectionHeader
            title="Card Inventory"
            subtitle={`${filtered.length} of ${cards.length} cards`}
          />
        }
        renderItem={({ item }) => {
          const avail = (item.quantity ?? 0) - (item.reserved ?? 0);
          return (
            <TouchableOpacity onPress={() => setSelected(item)} activeOpacity={0.75}>
              <GlassCard style={styles.cardRow}>
                {item.img ? (
                  <Image source={{ uri: item.img }} style={styles.thumb} />
                ) : (
                  <View style={[styles.thumb, styles.thumbFallback]}>
                    <Text style={{ color: colors.textDisabled, fontSize: 10 }}>⬡</Text>
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
                  <View style={styles.row}>
                    <RarityBadge value={item.rarity} />
                    <Text style={styles.setCode}>{item.set}</Text>
                  </View>
                  <Text style={styles.location}>{item.location}</Text>
                </View>
                <View style={styles.cardRight}>
                  <Text style={styles.price}>${item.price?.toFixed(2)}</Text>
                  <Text style={[styles.avail, avail < 5 && { color: colors.amber }]}>
                    {avail} avail
                  </Text>
                  <Text style={styles.cond}>{item.condition}</Text>
                </View>
              </GlassCard>
            </TouchableOpacity>
          );
        }}
      />

      {/* ── Card Detail Modal ── */}
      <Modal visible={!!selected} animationType="slide" transparent onRequestClose={() => setSelected(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            {selected && <CardDetailSheet card={selected} onClose={() => setSelected(null)} />}
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ── Card Detail Sheet (Function 7.2 — glassmorphism) ─────────────────────
function CardDetailSheet({ card, onClose }: { card: any; onClose: () => void }) {
  const avail = (card.quantity ?? 0) - (card.reserved ?? 0);
  const rarityT = rarityTheme[card.rarity as keyof typeof rarityTheme] ?? rarityTheme.common;

  return (
    <LinearGradient colors={['#18181b', '#09090b']} style={styles.sheet}>
      {/* Pull handle */}
      <View style={styles.handle} />

      {/* Card image + basic info */}
      <View style={styles.sheetHero}>
        {card.img ? (
          <Image source={{ uri: card.img }} style={styles.heroImg} resizeMode="contain" />
        ) : (
          <View style={[styles.heroImg, styles.heroFallback]}>
            <Text style={{ color: colors.textDisabled, fontSize: 32 }}>⬡</Text>
          </View>
        )}
        <View style={styles.heroInfo}>
          <Text style={styles.heroName}>{card.name}</Text>
          <View style={[styles.rarityStrip, { backgroundColor: rarityT.bg, borderColor: rarityT.border }]}>
            <Text style={[styles.rarityText, { color: rarityT.text }]}>{card.rarity}</Text>
          </View>
          <Text style={styles.heroSet}>{card.set}</Text>
          <Text style={styles.heroPrice}>${card.price?.toFixed(2)}</Text>
        </View>
      </View>

      {/* Stats grid */}
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <View style={styles.statsGrid}>
          {[
            ['Quantity', card.quantity],
            ['Reserved', card.reserved ?? 0],
            ['Available', avail],
            ['Condition', card.condition],
            ['Location', card.location],
            ['Card ID', card.cardId],
          ].map(([label, value]) => (
            <GlassCard key={label as string} style={styles.statCell}>
              <Text style={styles.statCellLabel}>{label}</Text>
              <Text style={[styles.statCellValue,
                label === 'Available' && avail < 5 && { color: colors.amber }
              ]}>
                {value}
              </Text>
            </GlassCard>
          ))}
        </View>

        <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
          <Text style={styles.closeBtnText}>Close</Text>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  bg:           { flex: 1, backgroundColor: colors.bg },
  // Search
  searchArea:   { paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: spacing.xs },
  searchWrap:   { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.sm, gap: spacing.xs },
  searchIcon:   { fontSize: 14, marginRight: 4 },
  searchInput:  { flex: 1, color: colors.textPrimary, fontSize: font.sizes.base, paddingVertical: 12 },
  searchClear:  { color: colors.textMuted, fontSize: 14, padding: 4 },
  // Filters
  filterScroll: { maxHeight: 44 },
  filterContent:{ paddingHorizontal: spacing.md, gap: spacing.xs, flexDirection: 'row' },
  filterBtn:    { marginRight: spacing.xs },
  filterPill:   { borderRadius: 20, borderWidth: 1, borderColor: colors.border,
                   paddingHorizontal: 14, paddingVertical: 6 },
  filterText:   { fontSize: font.sizes.xs, fontWeight: '700', color: colors.textMuted,
                   textTransform: 'capitalize' },
  cacheTag:     { fontSize: font.sizes.xs, color: colors.textDisabled, fontFamily: font.mono,
                   textAlign: 'center', paddingVertical: 4 },
  // List
  listContent:  { padding: spacing.md, paddingBottom: 100 },
  cardRow:      { flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
                   marginBottom: spacing.sm, padding: spacing.sm + 2 },
  thumb:        { width: 38, height: 52, borderRadius: 6, borderWidth: 1, borderColor: colors.border },
  thumbFallback:{ backgroundColor: colors.bgCard, alignItems: 'center', justifyContent: 'center' },
  cardName:     { fontSize: font.sizes.sm, fontWeight: '700', color: colors.textPrimary, marginBottom: 4 },
  row:          { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  setCode:      { fontSize: font.sizes.xs, color: colors.textDisabled, fontFamily: font.mono, marginLeft: 6 },
  location:     { fontSize: font.sizes.xs, color: colors.violetLight, fontFamily: font.mono },
  cardRight:    { alignItems: 'flex-end', gap: 3 },
  price:        { fontSize: font.sizes.sm, fontWeight: '800', color: colors.amber, fontFamily: font.mono },
  avail:        { fontSize: font.sizes.xs, color: colors.textMuted, fontFamily: font.mono },
  cond:         { fontSize: font.sizes.xs, color: colors.textDisabled, fontFamily: font.mono },
  // Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.7)' },
  modalSheet:   { height: '85%', borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden' },
  // Sheet
  sheet:        { flex: 1, padding: spacing.md },
  handle:       { width: 40, height: 4, backgroundColor: colors.border, borderRadius: 2,
                   alignSelf: 'center', marginBottom: spacing.md },
  sheetHero:    { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg },
  heroImg:      { width: width * 0.28, height: width * 0.4, borderRadius: 10,
                   borderWidth: 1, borderColor: colors.border },
  heroFallback: { backgroundColor: colors.bgCard, alignItems: 'center', justifyContent: 'center' },
  heroInfo:     { flex: 1, justifyContent: 'center', gap: spacing.xs },
  heroName:     { fontSize: font.sizes.md, fontWeight: '900', color: colors.textPrimary, lineHeight: 22 },
  rarityStrip:  { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4,
                   alignSelf: 'flex-start' },
  rarityText:   { fontSize: font.sizes.xs, fontWeight: '800', textTransform: 'capitalize',
                   fontFamily: font.mono },
  heroSet:      { fontSize: font.sizes.sm, color: colors.textMuted, fontFamily: font.mono },
  heroPrice:    { fontSize: font.sizes.xl, fontWeight: '900', color: colors.amber, fontFamily: font.mono },
  // Stats
  statsGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  statCell:     { width: (width - spacing.md * 2 - spacing.sm * 2) / 3 - spacing.sm, padding: spacing.sm },
  statCellLabel:{ fontSize: font.sizes.xs, color: colors.textMuted, fontFamily: font.mono,
                   textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 },
  statCellValue:{ fontSize: font.sizes.md, fontWeight: '800', color: colors.textPrimary },
  // Close
  closeBtn:     { borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 14,
                   alignItems: 'center', marginBottom: spacing.xl },
  closeBtnText: { color: colors.textMuted, fontWeight: '600' },
});
