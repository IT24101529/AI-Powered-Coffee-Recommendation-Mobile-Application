import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image,
  ActivityIndicator, Alert, RefreshControl, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { BASE_URL } from '../config/api';
import TopAppBar from '../components/ui/TopAppBar';
import BottomNavBar from '../components/ui/BottomNavBar';
import colors from '../theme/colors';
import spacing, { borderRadius } from '../theme/spacing';
import { fonts, fontSizes } from '../theme/typography';

const TAX_RATE = 0.08;
const POLL_INTERVAL_MS = 30000;
const STORE_PHONE = 'tel:+1234567890';
const STORE_MAPS_URL = 'https://www.google.com/maps/search/?api=1&query=Ember+Coffee+Co+123+Brew+Street+KL';
const STATUS_STEPS = ['Pending', 'Brewing', 'Ready'];
const STATUS_META = {
  Pending: { icon: '📋', label: 'Order Placed',      message: 'Your order has been received',  color: '#F39C12' },
  Brewing: { icon: '☕', label: 'Brewing',            message: "We're crafting your order",     color: colors.primary },
  Ready:   { icon: '✅', label: 'Ready for Pickup',  message: 'Your order is ready!',           color: '#27AE60' },
};
const ESTIMATED_TIMES = { Pending: '15–20 min', Brewing: '5–10 min', Ready: 'Ready now' };

// ─── Progress Tracker ────────────────────────────────────────────────────────
function ProgressTracker({ orderStatus }) {
  const currentIdx = STATUS_STEPS.indexOf(orderStatus);
  return (
    <View style={styles.progressContainer}>
      {STATUS_STEPS.map((step, idx) => {
        const meta = STATUS_META[step];
        const isCompleted = idx < currentIdx;
        const isActive    = idx === currentIdx;
        const isPending   = idx > currentIdx;
        return (
          <View key={step} style={styles.progressStepWrapper}>
            {idx > 0 && (
              <View style={[
                styles.connectorLine,
                (isCompleted || isActive) ? styles.connectorLineActive : styles.connectorLinePending,
              ]} />
            )}
            <View style={[
              styles.statusCard,
              isActive  && styles.statusCardActive,
              isPending && styles.statusCardPending,
            ]}>
              <View style={[
                styles.statusIconCircle,
                isCompleted && styles.statusIconCompleted,
                isActive    && { backgroundColor: meta.color },
                isPending   && styles.statusIconPending,
              ]}>
                <Text style={styles.statusIconText}>{meta.icon}</Text>
              </View>
              <View style={styles.statusCardInfo}>
                <Text style={[styles.statusCardLabel, isPending && styles.statusCardLabelMuted]}>
                  {meta.label}
                </Text>
                <Text style={[styles.statusCardDesc, isPending && styles.statusCardDescMuted]}>
                  {meta.message}
                </Text>
              </View>
              {isCompleted && <Text style={styles.statusCheckmark}>✓</Text>}
              {isActive && (
                <View style={styles.activePill}>
                  <Text style={styles.activePillText}>Active</Text>
                </View>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

// ─── Admin: advance status button ────────────────────────────────────────────
function AdminStatusControl({ order, onUpdated }) {
  const [updating, setUpdating] = useState(false);
  const currentIdx = STATUS_STEPS.indexOf(order.orderStatus);
  const nextStatus = STATUS_STEPS[currentIdx + 1];
  if (!nextStatus) return null;

  const handleAdvance = async () => {
    setUpdating(true);
    try {
      await axios.put(`${BASE_URL}/api/orders/${order._id}/status`, { orderStatus: nextStatus });
      onUpdated();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to update status.');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <TouchableOpacity
      style={[styles.advanceBtn, updating && styles.advanceBtnDisabled]}
      onPress={handleAdvance}
      disabled={updating}
      activeOpacity={0.8}
    >
      {updating
        ? <ActivityIndicator size="small" color="#fff" />
        : <Text style={styles.advanceBtnText}>Mark as {nextStatus}</Text>}
    </TouchableOpacity>
  );
}

// ─── Admin order card ─────────────────────────────────────────────────────────
function AdminOrderCard({ order, onUpdated }) {
  const meta     = STATUS_META[order.orderStatus] || STATUS_META.Pending;
  const subtotal = order.items.reduce((s, i) => s + i.price * i.quantity, 0);
  return (
    <View style={styles.adminOrderCard}>
      <View style={styles.adminOrderHeader}>
        <View>
          <Text style={styles.adminOrderNum}>
            Order #{String(order._id).slice(-6).toUpperCase()}
          </Text>
          <Text style={styles.adminOrderDate}>
            {new Date(order.createdAt).toLocaleDateString('en-MY', {
              day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
            })}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: meta.color + '22' }]}>
          <Text style={[styles.statusBadgeText, { color: meta.color }]}>
            {order.orderStatus}
          </Text>
        </View>
      </View>
      <Text style={styles.adminOrderItems}>
        {order.items.length} item{order.items.length !== 1 ? 's' : ''} · Rs. {subtotal.toFixed(2)}
      </Text>
      <AdminStatusControl order={order} onUpdated={onUpdated} />
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function OrderTrackingScreen({ navigation, route }) {
  const { user } = useAuth();
  const isAdmin  = user?.role === 'admin';

  const [orders,      setOrders]      = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [error,       setError]       = useState(null);
  const pollRef = useRef(null);

  // The most recent customer order (non-admin view)
  const latestOrder = orders[0] || null;

  const fetchOrders = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const endpoint = isAdmin ? `${BASE_URL}/api/orders` : `${BASE_URL}/api/orders/my`;
      const { data } = await axios.get(endpoint);
      // Sort newest first
      const sorted = [...(data || [])].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
      setOrders(sorted);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load orders.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAdmin]);

  // Initial load + 30s polling
  useEffect(() => {
    fetchOrders();
    pollRef.current = setInterval(() => fetchOrders(true), POLL_INTERVAL_MS);
    return () => clearInterval(pollRef.current);
  }, [fetchOrders]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchOrders(true);
  }, [fetchOrders]);

  const handleShare = () => {
    if (!latestOrder) return;
    Alert.alert('Share', `Order #${String(latestOrder._id).slice(-6).toUpperCase()} — ${latestOrder.orderStatus}`);
  };

  const handleCall = () => Linking.openURL(STORE_PHONE).catch(() => Alert.alert('Error', 'Unable to open phone dialler.'));
  const handleDirections = () => Linking.openURL(STORE_MAPS_URL).catch(() => Alert.alert('Error', 'Unable to open maps.'));

  const handleTabPress = (tab) => {
    const map = { Home: 'Home', Menu: 'Menu', Rewards: 'Rewards', Orders: 'Orders', Profile: 'Profile' };
    if (map[tab]) navigation.navigate(map[tab]);
  };

  // ── Render helpers ──────────────────────────────────────────────────────────

  const renderOrderItems = (order) => {
    const subtotal = order.items.reduce((s, i) => s + i.price * i.quantity, 0);
    const tax      = subtotal * TAX_RATE;
    const total    = subtotal + tax;
    return (
      <View style={styles.orderDetailsCard}>
        <Text style={styles.sectionHeading}>Your Order</Text>
        {order.items.map((item, idx) => (
          <View key={idx} style={styles.orderItem}>
            {item.productImageUrl
              ? <Image source={{ uri: item.productImageUrl }} style={styles.itemThumb} />
              : <View style={[styles.itemThumb, styles.itemThumbPlaceholder]}>
                  <Text style={styles.itemThumbIcon}>☕</Text>
                </View>
            }
            <View style={styles.itemInfo}>
              <Text style={styles.itemName} numberOfLines={1}>
                {item.productName || `Item ${idx + 1}`}
              </Text>
              <Text style={styles.itemQty}>Qty: {item.quantity}</Text>
            </View>
            <Text style={styles.itemPrice}>Rs. {(item.price * item.quantity).toFixed(2)}</Text>
          </View>
        ))}
        <View style={styles.divider} />
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Subtotal</Text>
          <Text style={styles.summaryValue}>Rs. {subtotal.toFixed(2)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Tax (8%)</Text>
          <Text style={styles.summaryValue}>Rs. {tax.toFixed(2)}</Text>
        </View>
        <View style={[styles.summaryRow, styles.summaryTotal]}>
          <Text style={styles.summaryTotalLabel}>Total</Text>
          <Text style={styles.summaryTotalValue}>Rs. {total.toFixed(2)}</Text>
        </View>
      </View>
    );
  };

  // ── Loading / Error states ──────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <TopAppBar title="Order Tracking" onBack={() => navigation.goBack()} />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading orders…</Text>
        </View>
        <BottomNavBar activeTab="Orders" onTabPress={handleTabPress} />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <TopAppBar title="Order Tracking" onBack={() => navigation.goBack()} />
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => fetchOrders()}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
        <BottomNavBar activeTab="Orders" onTabPress={handleTabPress} />
      </SafeAreaView>
    );
  }

  // ── Admin view ──────────────────────────────────────────────────────────────
  if (isAdmin) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <TopAppBar
          title="Order Tracking"
          onBack={() => navigation.goBack()}
          rightElement={
            <TouchableOpacity onPress={() => fetchOrders(true)}>
              <Text style={styles.refreshIcon}>↻</Text>
            </TouchableOpacity>
          }
        />
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        >
          <Text style={styles.adminHeading}>All Orders</Text>
          <Text style={styles.adminSubheading}>{orders.length} order{orders.length !== 1 ? 's' : ''} total</Text>
          {orders.length === 0
            ? <Text style={styles.emptyText}>No orders yet.</Text>
            : orders.map((order) => (
                <AdminOrderCard key={order._id} order={order} onUpdated={() => fetchOrders(true)} />
              ))
          }
        </ScrollView>
        <BottomNavBar activeTab="Orders" onTabPress={handleTabPress} />
      </SafeAreaView>
    );
  }

  // ── Customer view ───────────────────────────────────────────────────────────
  if (!latestOrder) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <TopAppBar title="Order Tracking" onBack={() => navigation.goBack()} />
        <View style={styles.centered}>
          <Text style={styles.emptyIcon}>☕</Text>
          <Text style={styles.emptyHeading}>No orders yet</Text>
          <Text style={styles.emptySubtext}>Place your first order to track it here.</Text>
          <TouchableOpacity
            style={styles.startOrderingBtn}
            onPress={() => navigation.navigate('Menu')}
            activeOpacity={0.8}
          >
            <Text style={styles.startOrderingBtnText}>Start Ordering</Text>
          </TouchableOpacity>
        </View>
        <BottomNavBar activeTab="Orders" onTabPress={handleTabPress} />
      </SafeAreaView>
    );
  }

  const meta      = STATUS_META[latestOrder.orderStatus] || STATUS_META.Pending;
  const orderNum  = String(latestOrder._id).slice(-6).toUpperCase();
  const estTime   = ESTIMATED_TIMES[latestOrder.orderStatus] || '—';

  return (
    <SafeAreaView style={styles.safeArea}>
      <TopAppBar
        title="Order Tracking"
        onBack={() => navigation.goBack()}
        rightElement={
          <TouchableOpacity onPress={handleShare} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.shareIcon}>⬆</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero status ── */}
        <View style={styles.heroCard}>
          <Text style={styles.heroOrderLabel}>Order #{orderNum} • In Progress</Text>
          <Text style={styles.heroStatusMessage}>{meta.message}</Text>
          <View style={styles.heroEstRow}>
            <Text style={styles.clockIcon}>🕐</Text>
            <Text style={styles.heroEstText}>Estimated: {estTime}</Text>
          </View>
        </View>

        {/* ── Progress tracker ── */}
        <ProgressTracker orderStatus={latestOrder.orderStatus} />

        {/* ── Order details ── */}
        {renderOrderItems(latestOrder)}

        {/* ── Interaction grid ── */}
        <View style={styles.interactionGrid}>
          <TouchableOpacity style={styles.interactionBtn} onPress={handleCall} activeOpacity={0.8}>
            <Text style={styles.interactionIcon}>📞</Text>
            <Text style={styles.interactionLabel}>Call Store</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.interactionBtn} onPress={handleDirections} activeOpacity={0.8}>
            <Text style={styles.interactionIcon}>🗺</Text>
            <Text style={styles.interactionLabel}>Get Directions</Text>
          </TouchableOpacity>
        </View>

        {/* ── Map snippet ── */}
        <TouchableOpacity style={styles.mapCard} onPress={handleDirections} activeOpacity={0.9}>
          <View style={styles.mapPlaceholder}>
            <Text style={styles.mapPlaceholderIcon}>📍</Text>
            <View style={styles.mapOverlay}>
              <Text style={styles.mapStoreName}>Ember Coffee Co.</Text>
              <Text style={styles.mapStoreAddress}>123 Brew Street, Kuala Lumpur</Text>
            </View>
          </View>
        </TouchableOpacity>

        <View style={{ height: spacing.xl }} />
      </ScrollView>

      <BottomNavBar activeTab="Orders" onTabPress={handleTabPress} />
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  loadingText: {
    marginTop: spacing.sm,
    fontFamily: fonts.regular,
    fontSize: fontSizes.md,
    color: colors.dark,
    opacity: 0.6,
  },
  errorText: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.md,
    color: '#E74C3C',
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  retryBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.pill,
  },
  retryBtnText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.md,
    color: '#fff',
  },

  // ── Share / refresh icons ──
  shareIcon: {
    fontSize: 20,
    color: colors.dark,
  },
  refreshIcon: {
    fontSize: 22,
    color: colors.primary,
    fontWeight: 'bold',
  },

  // ── Hero card ──
  heroCard: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.cardLg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  heroOrderLabel: {
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.sm,
    color: 'rgba(255,255,255,0.75)',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  heroStatusMessage: {
    fontFamily: fonts.extraBold,
    fontSize: fontSizes['2xl'],
    color: '#fff',
    marginBottom: spacing.sm,
  },
  heroEstRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  clockIcon: {
    fontSize: 14,
  },
  heroEstText: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    color: 'rgba(255,255,255,0.85)',
  },

  // ── Progress tracker ──
  progressContainer: {
    backgroundColor: '#fff',
    borderRadius: borderRadius.card,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  progressStepWrapper: {
    flexDirection: 'column',
  },
  connectorLine: {
    width: 2,
    height: 20,
    marginLeft: 23,
    marginVertical: 2,
  },
  connectorLineActive: {
    backgroundColor: colors.primary,
  },
  connectorLinePending: {
    backgroundColor: '#E0E0E0',
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: borderRadius.card,
    gap: spacing.sm,
  },
  statusCardActive: {
    backgroundColor: colors.accent + '44',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  statusCardPending: {
    opacity: 0.45,
  },
  statusIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusIconCompleted: {
    backgroundColor: '#27AE60',
  },
  statusIconPending: {
    backgroundColor: '#E0E0E0',
  },
  statusIconText: {
    fontSize: 20,
  },
  statusCardInfo: {
    flex: 1,
  },
  statusCardLabel: {
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.md,
    color: colors.dark,
  },
  statusCardLabelMuted: {
    color: '#9E9E9E',
  },
  statusCardDesc: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    color: colors.dark,
    opacity: 0.7,
    marginTop: 2,
  },
  statusCardDescMuted: {
    color: '#BDBDBD',
  },
  statusCheckmark: {
    fontSize: 18,
    color: '#27AE60',
    fontWeight: 'bold',
  },
  activePill: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  activePillText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.xs,
    color: '#fff',
  },

  // ── Order details card ──
  orderDetailsCard: {
    backgroundColor: '#fff',
    borderRadius: borderRadius.card,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeading: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.lg,
    color: colors.dark,
    marginBottom: spacing.sm,
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  itemThumb: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.input,
    backgroundColor: colors.accent,
  },
  itemThumbPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemThumbIcon: {
    fontSize: 22,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.md,
    color: colors.dark,
  },
  itemQty: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    color: colors.dark,
    opacity: 0.6,
    marginTop: 2,
  },
  itemPrice: {
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.md,
    color: colors.dark,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.07)',
    marginVertical: spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  summaryLabel: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.md,
    color: colors.dark,
    opacity: 0.7,
  },
  summaryValue: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.md,
    color: colors.dark,
  },
  summaryTotal: {
    marginTop: spacing.xs,
  },
  summaryTotalLabel: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.base,
    color: colors.dark,
  },
  summaryTotalValue: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.base,
    color: colors.primary,
  },

  // ── Interaction grid ──
  interactionGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  interactionBtn: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: borderRadius.card,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  interactionIcon: {
    fontSize: 24,
  },
  interactionLabel: {
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.sm,
    color: colors.dark,
  },

  // ── Map snippet ──
  mapCard: {
    borderRadius: borderRadius.card,
    overflow: 'hidden',
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  mapPlaceholder: {
    height: 140,
    backgroundColor: '#D5E8D4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapPlaceholderIcon: {
    fontSize: 48,
  },
  mapOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  mapStoreName: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.md,
    color: '#fff',
  },
  mapStoreAddress: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },

  // ── Empty state ──
  emptyIcon: {
    fontSize: 56,
    marginBottom: spacing.md,
  },
  emptyHeading: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.xl,
    color: colors.dark,
    marginBottom: spacing.xs,
  },
  emptySubtext: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.md,
    color: colors.dark,
    opacity: 0.6,
    textAlign: 'center',
  },
  startOrderingBtn: {
    marginTop: spacing.lg,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.pill,
  },
  startOrderingBtnText: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.base,
    color: '#fff',
  },

  // ── Admin view ──
  adminHeading: {
    fontFamily: fonts.extraBold,
    fontSize: fontSizes['2xl'],
    color: colors.dark,
    marginBottom: 4,
  },
  adminSubheading: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.md,
    color: colors.dark,
    opacity: 0.6,
    marginBottom: spacing.md,
  },
  emptyText: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.md,
    color: colors.dark,
    opacity: 0.5,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  adminOrderCard: {
    backgroundColor: '#fff',
    borderRadius: borderRadius.card,
    padding: spacing.md,
    marginBottom: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  adminOrderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  adminOrderNum: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.md,
    color: colors.dark,
  },
  adminOrderDate: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    color: colors.dark,
    opacity: 0.55,
    marginTop: 2,
  },
  statusBadge: {
    borderRadius: borderRadius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  statusBadgeText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.sm,
  },
  adminOrderItems: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    color: colors.dark,
    opacity: 0.7,
    marginBottom: spacing.sm,
  },
  advanceBtn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.pill,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  advanceBtnDisabled: {
    opacity: 0.6,
  },
  advanceBtnText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.md,
    color: '#fff',
  },
});
