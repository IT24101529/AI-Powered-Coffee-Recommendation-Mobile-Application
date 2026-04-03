import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  StatusBar,
  RefreshControl,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { BASE_URL } from '../../config/api';
import colors from '../../theme/colors';
import { fonts, fontSizes } from '../../theme/typography';
import spacing, { borderRadius } from '../../theme/spacing';

// ─── Constants ────────────────────────────────────────────────────────────────
const STATUS_SEQUENCE = ['Pending', 'Brewing', 'Ready'];

const STATUS_COLORS = {
  Pending: '#F57C00',
  Brewing: '#1565C0',
  Ready:   '#2E7D32',
};

const STATUS_BG = {
  Pending: 'rgba(245,124,0,0.12)',
  Brewing: 'rgba(21,101,192,0.12)',
  Ready:   'rgba(46,125,50,0.12)',
};

const STATUS_ICONS = {
  All:     '📋',
  Pending: '⏳',
  Brewing: '☕',
  Ready:   '✅',
};

const FILTER_TABS = ['All', 'Pending', 'Brewing', 'Ready'];

const ADMIN_TABS = [
  { key: 'Dashboard',  icon: '📊' },
  { key: 'Products',   icon: '☕' },
  { key: 'Orders',     icon: '📦' },
  { key: 'Rewards',    icon: '🎁' },
  { key: 'Promotions', icon: '🏷️' },
];

// ─── Admin BottomNavBar ───────────────────────────────────────────────────────
function AdminBottomNavBar({ activeTab, onTabPress }) {
  return (
    <View style={navStyles.bar}>
      {ADMIN_TABS.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            style={navStyles.tab}
            onPress={() => onTabPress && onTabPress(tab.key)}
            activeOpacity={0.7}
          >
            <Text style={navStyles.icon}>{tab.icon}</Text>
            <Text style={[navStyles.label, isActive ? navStyles.labelActive : navStyles.labelInactive]}>
              {tab.key}
            </Text>
            {isActive ? <View style={navStyles.activeDot} /> : null}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const navStyles = StyleSheet.create({
  bar: {
    height: 60,
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.08)',
    backgroundColor: '#FFFFFF',
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 6 },
  icon: { fontSize: 16, lineHeight: 20 },
  label: { fontFamily: fonts.semiBold, fontSize: 9, marginTop: 2 },
  labelActive: { color: colors.primary },
  labelInactive: { color: '#9E9E9E' },
  activeDot: {
    width: 4, height: 4, borderRadius: 2,
    backgroundColor: colors.primary, marginTop: 2,
  },
});

// ─── Status Filter Tabs ───────────────────────────────────────────────────────
function StatusFilterTabs({ activeFilter, onFilterChange, counts }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={tabStyles.container}
    >
      {FILTER_TABS.map((tab) => {
        const isActive = activeFilter === tab;
        const count = counts[tab] ?? 0;
        return (
          <TouchableOpacity
            key={tab}
            style={[tabStyles.tab, isActive && tabStyles.tabActive]}
            onPress={() => onFilterChange(tab)}
            activeOpacity={0.8}
          >
            <Text style={tabStyles.tabIcon}>{STATUS_ICONS[tab]}</Text>
            <Text style={[tabStyles.tabLabel, isActive && tabStyles.tabLabelActive]}>
              {tab}
            </Text>
            <View style={[tabStyles.badge, isActive && tabStyles.badgeActive]}>
              <Text style={[tabStyles.badgeText, isActive && tabStyles.badgeTextActive]}>
                {count}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const tabStyles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.pill,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(98,55,30,0.15)',
    gap: spacing.xs,
  },
  tabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabIcon: { fontSize: 14 },
  tabLabel: {
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.sm,
    color: colors.dark,
  },
  tabLabelActive: { color: '#fff' },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(98,55,30,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeActive: { backgroundColor: 'rgba(255,255,255,0.25)' },
  badgeText: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.xs,
    color: colors.primary,
  },
  badgeTextActive: { color: '#fff' },
});

// ─── Status Dropdown ──────────────────────────────────────────────────────────
function StatusDropdown({ currentStatus, onSelect, disabled }) {
  const [open, setOpen] = useState(false);
  const nextStatuses = STATUS_SEQUENCE.filter((s) => s !== currentStatus);

  return (
    <View style={dropStyles.wrapper}>
      <TouchableOpacity
        style={[dropStyles.trigger, disabled && dropStyles.triggerDisabled]}
        onPress={() => !disabled && setOpen((o) => !o)}
        activeOpacity={0.8}
      >
        <View style={[dropStyles.dot, { backgroundColor: STATUS_COLORS[currentStatus] }]} />
        <Text style={dropStyles.triggerText}>{currentStatus}</Text>
        {!disabled && <Text style={dropStyles.chevron}>{open ? '▲' : '▼'}</Text>}
      </TouchableOpacity>
      {open && (
        <View style={dropStyles.menu}>
          {nextStatuses.map((s) => (
            <TouchableOpacity
              key={s}
              style={dropStyles.option}
              onPress={() => { onSelect(s); setOpen(false); }}
              activeOpacity={0.8}
            >
              <View style={[dropStyles.dot, { backgroundColor: STATUS_COLORS[s] }]} />
              <Text style={dropStyles.optionText}>{s}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const dropStyles = StyleSheet.create({
  wrapper: { position: 'relative', zIndex: 10 },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: borderRadius.input,
    borderWidth: 1,
    borderColor: 'rgba(98,55,30,0.2)',
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: spacing.xs + 2,
    gap: spacing.xs,
  },
  triggerDisabled: { opacity: 0.5 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  triggerText: {
    flex: 1,
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.sm,
    color: colors.dark,
  },
  chevron: { fontSize: 10, color: colors.primary },
  menu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: borderRadius.input,
    borderWidth: 1,
    borderColor: 'rgba(98,55,30,0.15)',
    marginTop: 2,
    shadowColor: colors.dark,
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 20,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(98,55,30,0.06)',
  },
  optionText: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    color: colors.dark,
  },
});

// ─── Order Card ───────────────────────────────────────────────────────────────
function OrderCard({ order, onStatusUpdate, updating }) {
  const [selectedStatus, setSelectedStatus] = useState(order.orderStatus);
  const nextStatus = STATUS_SEQUENCE[STATUS_SEQUENCE.indexOf(order.orderStatus) + 1] ?? null;
  const isReady = order.orderStatus === 'Ready';

  const customerName = order.userId?.name ?? 'Customer';
  const orderNum = order._id?.slice(-6).toUpperCase() ?? '------';
  const timestamp = order.createdAt
    ? new Date(order.createdAt).toLocaleString('en-US', {
        month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    : '—';
  const method = order.fulfillmentMethod ?? 'Pickup';

  const handleMarkNext = () => {
    if (!nextStatus) return;
    onStatusUpdate(order._id, nextStatus);
  };

  const handleDropdownSelect = (status) => {
    setSelectedStatus(status);
    onStatusUpdate(order._id, status);
  };

  return (
    <View style={cardStyles.card}>
      {/* Status badge */}
      <View style={[cardStyles.statusBadge, { backgroundColor: STATUS_BG[order.orderStatus] }]}>
        <View style={[cardStyles.statusDot, { backgroundColor: STATUS_COLORS[order.orderStatus] }]} />
        <Text style={[cardStyles.statusText, { color: STATUS_COLORS[order.orderStatus] }]}>
          {order.orderStatus}
        </Text>
      </View>

      {/* Order info row */}
      <View style={cardStyles.infoRow}>
        <View style={cardStyles.infoLeft}>
          <Text style={cardStyles.orderNum}>#{orderNum}</Text>
          <Text style={cardStyles.customerName}>{customerName}</Text>
        </View>
        <Text style={cardStyles.timestamp}>{timestamp}</Text>
      </View>

      {/* Fulfillment method */}
      <View style={cardStyles.methodRow}>
        <Text style={cardStyles.methodIcon}>{method === 'Delivery' ? '🚚' : '🏪'}</Text>
        <Text style={cardStyles.methodLabel}>{method}</Text>
        <Text style={cardStyles.itemCount}>
          {order.items?.length ?? 0} item{order.items?.length !== 1 ? 's' : ''}
        </Text>
        <Text style={cardStyles.totalAmount}>
          ${(order.totalAmount ?? 0).toFixed(2)}
        </Text>
      </View>

      {/* Status dropdown + action button */}
      {!isReady && (
        <View style={cardStyles.actionsRow}>
          <View style={cardStyles.dropdownWrap}>
            <StatusDropdown
              currentStatus={selectedStatus}
              onSelect={handleDropdownSelect}
              disabled={updating}
            />
          </View>
          <TouchableOpacity
            style={[cardStyles.markBtn, updating && cardStyles.markBtnDisabled]}
            onPress={handleMarkNext}
            activeOpacity={0.85}
            disabled={updating}
          >
            {updating ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={cardStyles.markBtnText}>
                Mark as {nextStatus}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {isReady && (
        <View style={cardStyles.completedRow}>
          <Text style={cardStyles.completedText}>✅ Order Complete</Text>
        </View>
      )}
    </View>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: borderRadius.cardLg,
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    shadowColor: colors.dark,
    shadowOpacity: 0.07,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.pill,
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontFamily: fonts.bold, fontSize: fontSizes.xs, letterSpacing: 0.4 },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  infoLeft: { flex: 1 },
  orderNum: {
    fontFamily: fonts.extraBold,
    fontSize: fontSizes.base,
    color: colors.dark,
    letterSpacing: 0.5,
  },
  customerName: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    color: '#8B6A55',
    marginTop: 2,
  },
  timestamp: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    color: '#A0856E',
    textAlign: 'right',
  },
  methodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: 'rgba(98,55,30,0.07)',
  },
  methodIcon: { fontSize: 14 },
  methodLabel: {
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.sm,
    color: colors.dark,
    flex: 1,
  },
  itemCount: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    color: '#A0856E',
  },
  totalAmount: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.sm,
    color: colors.primary,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dropdownWrap: { flex: 1 },
  markBtn: {
    flex: 1,
    height: 40,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  markBtnDisabled: { opacity: 0.6 },
  markBtnText: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.sm,
    color: '#fff',
  },
  completedRow: {
    alignItems: 'center',
    paddingVertical: spacing.xs,
    backgroundColor: 'rgba(46,125,50,0.08)',
    borderRadius: borderRadius.card,
  },
  completedText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.sm,
    color: '#2E7D32',
  },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function AdminOrdersScreen({ navigation }) {
  const { user, token } = useAuth();

  const [orders, setOrders]           = useState([]);
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');
  const [updatingId, setUpdatingId]   = useState(null);

  const authHeader = { headers: { Authorization: `Bearer ${token}` } };

  // ── Fetch all orders ──────────────────────────────────────────────────────
  const fetchOrders = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/api/orders`, authHeader);
      setOrders(res.data ?? []);
    } catch (err) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to load orders.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // ── Pull-to-refresh ───────────────────────────────────────────────────────
  const handleRefresh = () => {
    setRefreshing(true);
    fetchOrders(true);
  };

  // ── Status update ─────────────────────────────────────────────────────────
  const handleStatusUpdate = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    try {
      await axios.put(
        `${BASE_URL}/api/orders/${orderId}/status`,
        { orderStatus: newStatus },
        authHeader
      );
      // Optimistic update
      setOrders((prev) =>
        prev.map((o) => (o._id === orderId ? { ...o, orderStatus: newStatus } : o))
      );
    } catch (err) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to update status.');
    } finally {
      setUpdatingId(null);
    }
  };

  // ── Filtered orders ───────────────────────────────────────────────────────
  const filteredOrders = activeFilter === 'All'
    ? orders
    : orders.filter((o) => o.orderStatus === activeFilter);

  // ── Tab counts ────────────────────────────────────────────────────────────
  const counts = {
    All:     orders.length,
    Pending: orders.filter((o) => o.orderStatus === 'Pending').length,
    Brewing: orders.filter((o) => o.orderStatus === 'Brewing').length,
    Ready:   orders.filter((o) => o.orderStatus === 'Ready').length,
  };

  // ── Admin tab navigation ──────────────────────────────────────────────────
  const handleAdminTabPress = (tab) => {
    const routeMap = {
      Dashboard:  'AdminDashboard',
      Products:   'AdminProducts',
      Orders:     'AdminOrders',
      Rewards:    'AdminRewards',
      Promotions: 'AdminPromotions',
    };
    const route = routeMap[tab];
    if (route) navigation.navigate(route);
  };

  // ── Today's date label ────────────────────────────────────────────────────
  const todayLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.cream} />

      {/* ── TopAppBar ── */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Order Processing</Text>
        <View style={styles.avatarCircle}>
          {user?.profileImageUrl ? (
            <Text style={styles.avatarInitial}>
              {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
            </Text>
          ) : (
            <Text style={styles.avatarInitial}>
              {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
            </Text>
          )}
        </View>
      </View>

      {/* ── Dashboard Header ── */}
      <View style={styles.dashHeader}>
        <Text style={styles.dashLabel}>Management Console</Text>
        <Text style={styles.dashHeading}>Order Processing</Text>
        <View style={styles.dateRow}>
          <Text style={styles.dateIcon}>📅</Text>
          <Text style={styles.dateText}>{todayLabel}</Text>
        </View>
      </View>

      {/* ── Status Filter Tabs ── */}
      <StatusFilterTabs
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        counts={counts}
      />

      {/* ── Order List ── */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading orders...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <OrderCard
              order={item}
              onStatusUpdate={handleStatusUpdate}
              updating={updatingId === item._id}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📭</Text>
              <Text style={styles.emptyTitle}>No orders found</Text>
              <Text style={styles.emptySubtitle}>
                {activeFilter === 'All'
                  ? 'No orders have been placed yet.'
                  : `No ${activeFilter} orders at the moment.`}
              </Text>
            </View>
          }
        />
      )}

      {/* ── FAB ── */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => Alert.alert('Add Manual Order', 'Manual order entry coming soon.')}
        activeOpacity={0.85}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      {/* ── Admin BottomNavBar ── */}
      <AdminBottomNavBar activeTab="Orders" onTabPress={handleAdminTabPress} />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.cream },

  // TopAppBar
  topBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.cream,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(98,55,30,0.1)',
  },
  backBtn: { width: 40, alignItems: 'flex-start', justifyContent: 'center' },
  backIcon: { fontSize: 22, color: colors.dark },
  topBarTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: fonts.bold,
    fontSize: fontSizes.base,
    color: colors.dark,
    letterSpacing: 0.5,
  },
  avatarCircle: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  avatarInitial: { fontFamily: fonts.bold, fontSize: fontSizes.base, color: '#fff' },

  // Dashboard Header
  dashHeader: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: colors.cream,
  },
  dashLabel: {
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.xs,
    color: colors.primary,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  dashHeading: {
    fontFamily: fonts.extraBold,
    fontSize: fontSizes['2xl'],
    color: colors.dark,
    marginBottom: spacing.xs,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  dateIcon: { fontSize: 13 },
  dateText: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    color: '#8B6A55',
  },

  // List
  listContent: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl + 60, // room for FAB + nav
  },

  // Loading
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  loadingText: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    color: '#8B6A55',
  },

  // Empty state
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing['4xl'],
    paddingHorizontal: spacing.lg,
  },
  emptyIcon: { fontSize: 48, marginBottom: spacing.md },
  emptyTitle: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.lg,
    color: colors.dark,
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    color: '#8B6A55',
    textAlign: 'center',
    lineHeight: 20,
  },

  // FAB
  fab: {
    position: 'absolute',
    bottom: 76,
    right: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.dark,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  fabIcon: {
    fontSize: 28,
    color: '#fff',
    lineHeight: 32,
    marginTop: -2,
  },
});
