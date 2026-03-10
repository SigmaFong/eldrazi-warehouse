// App.tsx  (monolith entry — replaces expo-router for simplicity)
// Function 7.1 — professional functional component structure, Starter Template
// Function 7.3 — complex navigation, cross-screen state management

import React, { useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Platform,
  StatusBar, SafeAreaView,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator }    from '@react-navigation/bottom-tabs';
import { GestureHandlerRootView }      from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import { useNetwork }             from './src/hooks/useNetwork';

import LoginScreen    from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import InventoryScreen from './src/screens/InventoryScreen';
import OrdersScreen    from './src/screens/OrdersScreen';
import QueueScreen     from './src/screens/QueueScreen';

import { colors, font } from './src/utils/theme';

SplashScreen.preventAutoHideAsync();

// ── Navigator types ───────────────────────────────────────────────────────
const Stack  = createNativeStackNavigator();
const Tab    = createBottomTabNavigator();

// ── Tab Icons ─────────────────────────────────────────────────────────────
const TAB_ICONS: Record<string, string> = {
  Dashboard: '⬡',
  Inventory: '🃏',
  Orders:    '📦',
  Sync:      '↑',
};

// ── Bottom Tab navigator (logged-in) ─────────────────────────────────────
function AppTabs() {
  const { queueLength } = useNetwork();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle:  styles.tabBar,
        tabBarActiveTintColor:   colors.violetLight,
        tabBarInactiveTintColor: colors.textDisabled,
        tabBarLabelStyle:        styles.tabLabel,
        tabBarIcon: ({ color, focused }) => (
          <View style={[styles.tabIconWrap, focused && styles.tabIconActive]}>
            <Text style={[styles.tabIcon, { color }]}>
              {TAB_ICONS[route.name] ?? '·'}
            </Text>
            {/* Queue badge (Function 7.5) */}
            {route.name === 'Sync' && queueLength > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{queueLength}</Text>
              </View>
            )}
          </View>
        ),
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen}
        options={{ title: 'Dashboard' }} />
      <Tab.Screen name="Inventory" component={InventoryScreen}
        options={{ title: 'Inventory' }} />
      <Tab.Screen name="Orders"    component={OrdersScreen}
        options={{ title: 'Orders' }} />
      <Tab.Screen name="Sync"      component={QueueScreen}
        options={{ title: 'Sync Queue' }} />
    </Tab.Navigator>
  );
}

// ── Root navigator — auth gate ────────────────────────────────────────────
function RootNavigator() {
  const { user, loading, logout } = useAuth();

  useEffect(() => {
    if (!loading) SplashScreen.hideAsync();
  }, [loading]);

  if (loading) return null;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
      {user ? (
        <Stack.Screen name="Main" options={{ headerShown: false }}>
          {() => (
            <View style={styles.appShell}>
              <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
              {/* ── Global top header with logout ── */}
              <SafeAreaView style={styles.header}>
                <View style={styles.headerLeft}>
                  <Text style={styles.appTitle}>⬡ ELDRAZI VAULT</Text>
                  <Text style={styles.appSub}>Warehouse · Mobile</Text>
                </View>
                <View style={styles.headerRight}>
                  <View style={styles.userInfo}>
                    <Text style={styles.userName} numberOfLines={1}>{user.name}</Text>
                    <Text style={styles.userRole}>{user.role?.toUpperCase()}</Text>
                  </View>
                  <TouchableOpacity onPress={logout} style={styles.logoutBtn} activeOpacity={0.7}>
                    <Text style={styles.logoutText}>X</Text>
                  </TouchableOpacity>
                </View>
              </SafeAreaView>
              <View style={{ flex: 1 }}>
                <AppTabs />
              </View>
            </View>
          )}
        </Stack.Screen>
      ) : (
        <Stack.Screen name="Login" component={LoginScreen} />
      )}
    </Stack.Navigator>
  );
}

// ── App root ─────────────────────────────────────────────────────────────
export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <NavigationContainer
          theme={{
            dark:   true,
            colors: {
              primary:      colors.violetLight,
              background:   colors.bg,
              card:         colors.bgCard,
              text:         colors.textPrimary,
              border:       colors.border,
              notification: colors.violetLight,
            },
          }}
        >
          <RootNavigator />
        </NavigationContainer>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  appShell:       { flex: 1, backgroundColor: colors.bg },
  // Top header
  header:         { backgroundColor: 'rgba(9,9,11,0.95)', paddingHorizontal: 20,
                     paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0,
                     paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: colors.border,
                     flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerLeft:     { flex: 1 },
  appTitle:       { fontSize: font.sizes.md, fontWeight: '900', color: colors.textPrimary,
                     fontFamily: font.mono, letterSpacing: 2 },
  appSub:         { fontSize: font.sizes.xs, color: colors.textMuted, fontFamily: font.mono },
  headerRight:    { flexDirection: 'row', alignItems: 'center'},
  userInfo:       { alignItems: 'flex-end' },
  userName:       { fontSize: font.sizes.xs, fontWeight: '700', color: colors.textPrimary, maxWidth: 100 },
  userRole:       { fontSize: 9, color: colors.violetLight, fontFamily: font.mono, letterSpacing: 1 },
  logoutBtn:      { width: 34, height: 34, borderRadius: 17, borderWidth: 1,
                     borderColor: 'rgba(239,68,68,0.4)', backgroundColor: 'rgba(239,68,68,0.08)',
                     alignItems: 'center', justifyContent: 'center' },
  logoutText:     { fontSize: 16, color: '#f87171' },
  // Bottom tab bar
  tabBar:         {
    backgroundColor: 'rgba(18,18,20,0.97)',
    borderTopColor:   colors.border,
    borderTopWidth:   1,
    height:           62,
    paddingBottom:    10,
  },
  tabLabel:       { fontSize: 9, fontFamily: font.mono, letterSpacing: 0.5 },
  tabIconWrap:    { position: 'relative', alignItems: 'center', justifyContent: 'center',
                     width: 32, height: 28 },
  tabIconActive:  {},
  tabIcon:        { fontSize: 18, lineHeight: 22 },
  // Queue badge
  badge:          { position: 'absolute', top: -4, right: -8, backgroundColor: colors.violetLight,
                     borderRadius: 8, minWidth: 16, height: 16, alignItems: 'center',
                     justifyContent: 'center', paddingHorizontal: 3 },
  badgeText:      { fontSize: 9, color: '#fff', fontWeight: '900', fontFamily: font.mono },
});