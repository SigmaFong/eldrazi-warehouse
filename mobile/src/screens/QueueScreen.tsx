// src/screens/QueueScreen.tsx
// Function 7.5 — Queue Sync system for offline operation
// Shows all pending queued requests, allows manual sync, clear queue

import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNetwork } from '../hooks/useNetwork';
import { getQueue, clearQueue, QueueItem } from '../services/api';
import { GlassCard, OfflineBanner, EmptyState, SectionHeader, QueueRow } from '../components';
import { colors, spacing, font, glass } from '../utils/theme';

export default function QueueScreen() {
  const { isOnline, queueLength, syncing, syncQueue, refreshQueueLength } = useNetwork();

  const [queue,      setQueue]      = useState<QueueItem[]>([]);
  const [loading,    setLoading]    = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastSync,   setLastSync]   = useState<Date | null>(null);

  const loadQueue = useCallback(async () => {
    const q = await getQueue();
    setQueue(q);
  }, []);

  useEffect(() => { loadQueue(); }, [queueLength]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadQueue();
    setRefreshing(false);
  }, [loadQueue]);

  const handleSync = useCallback(async () => {
    if (!isOnline) {
      Alert.alert('Offline', 'Connect to internet to sync queued requests.');
      return;
    }
    setLoading(true);
    const results = await syncQueue();
    await loadQueue();
    setLastSync(new Date());
    setLoading(false);
    const succeeded = results?.filter(r => r.success).length ?? 0;
    const failed    = results?.filter(r => !r.success).length ?? 0;
    Alert.alert(
      'Sync Complete',
      `${succeeded} request${succeeded !== 1 ? 's' : ''} synced${failed > 0 ? `, ${failed} failed` : ''}.`
    );
  }, [isOnline, syncQueue, loadQueue]);

  const handleClearQueue = useCallback(() => {
    Alert.alert(
      'Clear Queue',
      'This will discard all queued offline requests permanently.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All', style: 'destructive',
          onPress: async () => {
            await clearQueue();
            await loadQueue();
            await refreshQueueLength();
          },
        },
      ]
    );
  }, [loadQueue, refreshQueueLength]);

  // Group queue by method type
  const grouped = {
    POST:   queue.filter(q => q.method === 'POST'),
    PATCH:  queue.filter(q => q.method === 'PATCH'),
    DELETE: queue.filter(q => q.method === 'DELETE'),
  };

  return (
    <View style={styles.bg}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.violetLight} />}
      >
        {/* Network status card */}
        <GlassCard violet={isOnline} style={styles.statusCard}>
          <LinearGradient
            colors={isOnline
              ? ['rgba(16,185,129,0.15)', 'rgba(16,185,129,0.05)']
              : ['rgba(239,68,68,0.15)', 'rgba(239,68,68,0.05)']}
            style={styles.statusGrad}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          >
            <View style={[styles.statusDot, { backgroundColor: isOnline ? colors.emerald : colors.red }]} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.statusTitle, { color: isOnline ? colors.emerald : colors.red }]}>
                {isOnline ? 'Online' : 'Offline'}
              </Text>
              <Text style={styles.statusSub}>
                {isOnline ? 'All requests will be sent immediately' : 'Requests are being queued locally'}
              </Text>
            </View>
            <View style={styles.queueCountBadge}>
              <Text style={styles.queueCountNum}>{queue.length}</Text>
              <Text style={styles.queueCountLabel}>queued</Text>
            </View>
          </LinearGradient>
        </GlassCard>

        {/* How it works info */}
        <GlassCard style={styles.infoCard}>
          <Text style={styles.infoTitle}>⬡ Queue Sync System</Text>
          <Text style={styles.infoBody}>
            When the device goes offline, write operations (create, update, delete) are stored locally
            in this queue. When connectivity is restored, requests are automatically replayed in order.
            You can also trigger a manual sync below.
          </Text>
        </GlassCard>

        {/* Sync actions */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            onPress={handleSync}
            disabled={syncing || loading || queue.length === 0}
            style={[styles.syncBtn, (syncing || loading || queue.length === 0) && styles.syncBtnDisabled]}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={syncing || loading || queue.length === 0 ? ['#27272a', '#18181b'] : ['#7c3aed', '#6d28d9']}
              style={styles.syncBtnGrad}
            >
              <Text style={styles.syncBtnText}>
                {syncing || loading ? '⟳ Syncing…' : `↑ Sync Now (${queue.length})`}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleClearQueue}
            disabled={queue.length === 0}
            style={[styles.clearBtn, queue.length === 0 && { opacity: 0.4 }]}
            activeOpacity={0.7}
          >
            <Text style={styles.clearBtnText}>✕ Clear</Text>
          </TouchableOpacity>
        </View>

        {lastSync && (
          <Text style={styles.lastSync}>
            Last sync: {lastSync.toLocaleTimeString()}
          </Text>
        )}

        {/* Queue items */}
        {queue.length === 0 ? (
          <EmptyState icon="✓" message={`Queue is empty${isOnline ? '' : '\nGo offline and perform actions to see them here'}`} />
        ) : (
          <>
            {Object.entries(grouped).map(([method, items]) =>
              items.length > 0 ? (
                <View key={method} style={{ marginBottom: spacing.md }}>
                  <SectionHeader
                    title={method === 'POST' ? 'Create Requests' : method === 'PATCH' ? 'Update Requests' : 'Delete Requests'}
                    subtitle={`${items.length} pending`}
                  />
                  {items.map(item => <QueueRow key={item.id} item={item} />)}
                </View>
              ) : null
            )}
          </>
        )}

        {/* Demo: add dummy queue item for testing */}
        <GlassCard style={styles.demoCard}>
          <Text style={styles.demoTitle}>Testing Offline Queue</Text>
          <Text style={styles.demoBody}>
            To test: Enable airplane mode on your device, then try creating an order or editing
            inventory from the app. Actions will appear here as queued requests.
            Re-enable network to trigger auto-sync.
          </Text>
        </GlassCard>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  bg:           { flex: 1, backgroundColor: colors.bg },
  content:      { padding: spacing.md, paddingBottom: 100 },
  // Status card
  statusCard:   { marginBottom: spacing.md, padding: 0, overflow: 'hidden' },
  statusGrad:   { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderRadius: 16 },
  statusDot:    { width: 10, height: 10, borderRadius: 5 },
  statusTitle:  { fontSize: font.sizes.md, fontWeight: '800' },
  statusSub:    { fontSize: font.sizes.xs, color: colors.textMuted, marginTop: 2 },
  queueCountBadge: { alignItems: 'center', padding: spacing.sm },
  queueCountNum:   { fontSize: font.sizes.xl, fontWeight: '900', color: colors.violetLight, fontFamily: font.mono },
  queueCountLabel: { fontSize: font.sizes.xs, color: colors.textMuted, fontFamily: font.mono },
  // Info
  infoCard:     { marginBottom: spacing.md },
  infoTitle:    { fontSize: font.sizes.sm, fontWeight: '800', color: colors.violetLight, marginBottom: 8 },
  infoBody:     { fontSize: font.sizes.sm, color: colors.textSecond, lineHeight: 20 },
  // Actions
  actionRow:    { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xs },
  syncBtn:      { flex: 1, borderRadius: 12, overflow: 'hidden' },
  syncBtnDisabled: { opacity: 0.5 },
  syncBtnGrad:  { padding: 14, alignItems: 'center' },
  syncBtnText:  { color: '#fff', fontWeight: '800', fontSize: font.sizes.sm },
  clearBtn:     { borderWidth: 1, borderColor: 'rgba(239,68,68,0.4)', borderRadius: 12,
                   paddingHorizontal: spacing.md, alignItems: 'center', justifyContent: 'center' },
  clearBtnText: { color: '#f87171', fontWeight: '700', fontSize: font.sizes.sm },
  lastSync:     { fontSize: font.sizes.xs, color: colors.textDisabled, fontFamily: font.mono,
                   textAlign: 'center', marginBottom: spacing.md },
  // Demo
  demoCard:     { marginTop: spacing.lg },
  demoTitle:    { fontSize: font.sizes.sm, fontWeight: '700', color: colors.amber, marginBottom: 8 },
  demoBody:     { fontSize: font.sizes.sm, color: colors.textMuted, lineHeight: 20 },
});
