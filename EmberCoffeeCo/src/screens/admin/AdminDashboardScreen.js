import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  ActivityIndicator,
  StatusBar,
  Platform,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { BASE_URL } from '../../config/api';
import { BRAND_LOGO_URI } from '../../components/ui/TopAppBar';
import colors from '../../theme/colors';
import { fonts, fontSizes } from '../../theme/typography';
import spacing, { borderRadius } from '../../theme/spacing';

// ─── Admin BottomNavBar (admin variant) ──────────────────────────────────────
const ADMIN_TABS = [
  {
    key: 'Dashboard',
    label: 'Dashboard',
    selected:   'https://res.cloudinary.com/dqjzgnghk/image/upload/v1775210244/dashboard_icon_selected_twkuel.png',
    unselected: 'https://res.cloudinary.com/dqjzgnghk/image/upload/v1775210249/dashboard_icon_non-selected_f59pd7.png',
  },
  {
    key: 'Products',
    label: 'Products',
    selected:   'https://res.cloudinary.com/dqjzgnghk/image/upload/v1775210245/products_icon_selected_mqk0nn.png',
    unselected: 'https://res.cloudinary.com/dqjzgnghk/image/upload/v1775210245/products_icon_non-selected_vhus3q.png',
  },
  {
    key: 'Orders',
    label: 'Orders',
    selected:   'https://res.cloudinary.com/dqjzgnghk/image/upload/v1775210247/orders_icon_selected_lcallq.png',
    unselected: 'https://res.cloudinary.com/dqjzgnghk/image/upload/v1775210248/orders_icon_non-selected_jtq6bc.png',
  },
  {
    key: 'Rewards',
    label: 'Rewards',
    selected:   'https://res.cloudinary.com/dqjzgnghk/image/upload/v1775210246/rewards_icon_selected_xb64mi.png',
    unselected: 'https://res.cloudinary.com/dqjzgnghk/image/upload/v1775210246/rewards_icon_non-selected_a7bi00.png',
  },
  {
    key: 'Promotions',
    label: 'Promos',
    selected:   'https://res.cloudinary.com/dqjzgnghk/image/upload/v1775210245/Promos_icon_opd7er.png',
    unselected: 'https://res.cloudinary.com/dqjzgnghk/image/upload/v1775210245/Promos_icon_opd7er.png',
  },
];

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
            <Image
              source={{ uri: isActive ? tab.selected : tab.unselected }}
              style={navStyles.icon}
              resizeMode="contain"
            />
            <Text style={[navStyles.label, isActive ? navStyles.labelActive : navStyles.labelInactive]}>
              {tab.label}
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
    height: 64,
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.08)',
    backgroundColor: '#FFFFFF',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 6,
  },
  icon: { width: 24, height: 24 },
  label: {
    fontFamily: fonts.semiBold,
    fontSize: 9,
    marginTop: 3,
  },
  labelActive: { color: colors.primary },
  labelInactive: { color: '#9E9E9E' },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
    marginTop: 2,
  },
});

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ title, value, description, trend, linkLabel, onLinkPress, icon }) {
  return (
    <View style={styles.statCard}>
      {icon ? (
        <Text style={styles.statIcon}>{icon}</Text>
      ) : (
        <Text style={styles.statValue}>{value}</Text>
      )}
      <Text style={styles.statTitle}>{title}</Text>
      {description ? <Text style={styles.statDesc}>{description}</Text> : null}
      {trend ? (
        <View style={styles.trendRow}>
          <Text style={styles.trendArrow}>↑</Text>
          <Text style={styles.trendLabel}>{trend}</Text>
        </View>
      ) : null}
      {linkLabel ? (
        <TouchableOpacity onPress={onLinkPress} style={styles.statLink}>
          <Text style={styles.statLinkText}>{linkLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

// ─── Product Card ─────────────────────────────────────────────────────────────
function ProductCard({ product, onEdit, onDelete }) {
  return (
    <View style={styles.productCard}>
      {/* Image with availability badge */}
      <View style={styles.productImageWrap}>
        {product.productImageUrl ? (
          <Image source={{ uri: product.productImageUrl }} style={styles.productImage} />
        ) : (
          <View style={[styles.productImage, styles.productImagePlaceholder]}>
            <Text style={styles.productImagePlaceholderText}>☕</Text>
          </View>
        )}
        <View style={[
          styles.availBadge,
          product.isAvailable ? styles.availBadgeOn : styles.availBadgeOff,
        ]}>
          <Text style={styles.availBadgeText}>
            {product.isAvailable ? 'Available' : 'Unavailable'}
          </Text>
        </View>
      </View>

      {/* Info row */}
      <View style={styles.productInfo}>
        <View style={styles.productMeta}>
          <Text style={styles.productName} numberOfLines={1}>{product.productName}</Text>
          <Text style={styles.productPrice}>${parseFloat(product.price).toFixed(2)}</Text>
        </View>
        {product.description ? (
          <Text style={styles.productDesc} numberOfLines={2}>{product.description}</Text>
        ) : null}

        {/* Action buttons */}
        <View style={styles.productActions}>
          <TouchableOpacity style={styles.editBtn} onPress={() => onEdit(product)} activeOpacity={0.8}>
            <Text style={styles.editBtnText}>✏️ Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteBtn} onPress={() => onDelete(product)} activeOpacity={0.8}>
            <Text style={styles.deleteBtnText}>🗑️ Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
const CATEGORIES = ['All', 'Signature Brews', 'Espresso', 'Tea', 'Iced Drinks', 'Pastries'];

export default function AdminDashboardScreen({ navigation }) {
  const { user, token } = useAuth();

  const [products, setProducts]         = useState([]);
  const [orders, setOrders]             = useState([]);
  const [rewards, setRewards]           = useState([]);
  const [loading, setLoading]           = useState(true);
  const [searchQuery, setSearchQuery]   = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  // Guard: non-admin
  if (!user || user.role !== 'admin') {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.notAuthText}>Admin access required.</Text>
      </SafeAreaView>
    );
  }

  const authHeader = { headers: { Authorization: `Bearer ${token}` } };

  // ── Data fetching ────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [productsRes, ordersRes, rewardsRes] = await Promise.allSettled([
        axios.get(`${BASE_URL}/api/products`, authHeader),
        axios.get(`${BASE_URL}/api/orders`, authHeader),
        axios.get(`${BASE_URL}/api/rewards`, authHeader),
      ]);

      if (productsRes.status === 'fulfilled') setProducts(productsRes.value.data);
      if (ordersRes.status === 'fulfilled')   setOrders(ordersRes.value.data);
      if (rewardsRes.status === 'fulfilled')  setRewards(rewardsRes.value.data);
    } catch (err) {
      Alert.alert('Error', 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // ── Derived stats ────────────────────────────────────────────────────────
  const totalInventory  = products.length;
  const activeOrders    = orders.filter((o) => o.orderStatus === 'Pending' || o.orderStatus === 'Brewing').length;
  const rewardsActive   = rewards.filter((r) => r.isAvailable).length;

  // ── Filtered product list ────────────────────────────────────────────────
  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.productName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      activeCategory === 'All' ||
      p.category?.toLowerCase() === activeCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  // ── Delete handler ───────────────────────────────────────────────────────
  const handleDelete = (product) => {
    Alert.alert(
      'Delete Product',
      `Are you sure you want to delete "${product.productName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete(`${BASE_URL}/api/products/${product._id}`, authHeader);
              fetchAll();
            } catch (err) {
              Alert.alert('Error', err?.response?.data?.message || 'Failed to delete product.');
            }
          },
        },
      ]
    );
  };

  // ── Navigation helpers ───────────────────────────────────────────────────
  const navigateToAddProduct = () => {
    navigation.navigate('AdminAddProduct');
  };

  const navigateToEditProduct = (product) => {
    navigation.navigate('AdminAddProduct', { product });
  };

  const navigateToRewards = () => {
    navigation.navigate('AdminRewards');
  };

  const navigateToTeam = () => {
    navigation.navigate('AdminUserManagement');
  };

  const handleSwitchToCustomer = () => {
    Alert.alert(
      'Switch to Customer Side',
      'Go back to the customer view of the app?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Switch', onPress: () => navigation.navigate('Home') },
      ],
    );
  };

  const handleAdminTabPress = (tab) => {
    const routeMap = {
      Dashboard:  'AdminDashboard',
      Products:   'AdminProducts',
      Orders:     'AdminOrders',
      Rewards:    'AdminRewards',
      Promotions: 'AdminPromotions',
    };
    const route = routeMap[tab];
    if (route && route !== 'AdminDashboard') {
      navigation.navigate(route);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.cream} />

      {/* ── TopAppBar ── */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.hamburger} activeOpacity={0.7}>
          <Text style={styles.hamburgerIcon}>☰</Text>
        </TouchableOpacity>
        <Image source={{ uri: BRAND_LOGO_URI }} style={styles.topBarLogo} resizeMode="contain" />
        <TouchableOpacity style={styles.customerToggleBtn} onPress={handleSwitchToCustomer} activeOpacity={0.8}>
          <Text style={styles.customerToggleText}>☕ Customer</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Dashboard Heading ── */}
        <Text style={styles.dashHeading}>Velvet Roast Dashboard</Text>

        {/* ── Bento Stats Grid ── */}
        {loading ? (
          <ActivityIndicator color={colors.primary} size="large" style={{ marginVertical: 24 }} />
        ) : (
          <View style={styles.statsGrid}>
            {/* Row 1: Total Inventory + Active Orders */}
            <View style={styles.statsRow}>
              <StatCard
                title="Total Inventory"
                value={totalInventory}
                description="Products in catalogue"
              />
              <StatCard
                title="Active Orders"
                value={activeOrders}
                trend="Live orders"
              />
            </View>

            {/* Row 2: Rewards Active + Team & Access */}
            <View style={styles.statsRow}>
              <StatCard
                title="Rewards Active"
                value={rewardsActive}
                linkLabel="Manage Rewards"
                onLinkPress={navigateToRewards}
              />
              <StatCard
                title="Team & Access"
                icon="👥"
                description="Manage your team"
                linkLabel="Manage Team"
                onLinkPress={navigateToTeam}
              />
            </View>
          </View>
        )}

        {/* ── Search & Filter Bar ── */}
        <View style={styles.searchSection}>
          <View style={styles.searchInputWrap}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search products..."
              placeholderTextColor="#A0856E"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} activeOpacity={0.7}>
                <Text style={styles.clearSearch}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Category filter chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.chipsScroll}
            contentContainerStyle={styles.chipsContent}
          >
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.chip, activeCategory === cat && styles.chipActive]}
                onPress={() => setActiveCategory(cat)}
                activeOpacity={0.8}
              >
                <Text style={[styles.chipText, activeCategory === cat && styles.chipTextActive]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ── Product List ── */}
        <View style={styles.productListSection}>
          <Text style={styles.sectionHeading}>
            Products {filteredProducts.length > 0 ? `(${filteredProducts.length})` : ''}
          </Text>

          {loading ? null : filteredProducts.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No products found.</Text>
            </View>
          ) : (
            filteredProducts.map((product) => (
              <ProductCard
                key={product._id}
                product={product}
                onEdit={navigateToEditProduct}
                onDelete={handleDelete}
              />
            ))
          )}
        </View>

        {/* Bottom padding for FAB */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── FAB ── */}
      <TouchableOpacity
        style={styles.fab}
        onPress={navigateToAddProduct}
        activeOpacity={0.85}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      {/* ── Admin BottomNavBar ── */}
      <AdminBottomNavBar activeTab="Dashboard" onTabPress={handleAdminTabPress} />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cream,
  },
  notAuthText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.base,
    color: colors.dark,
  },

  // ── TopAppBar ──
  topBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.cream,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(98,55,30,0.1)',
  },
  hamburger: {
    width: 40,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  hamburgerIcon: {
    fontSize: 22,
    color: colors.dark,
  },
  topBarLogo: {
    flex: 1,
    height: 32,
    alignSelf: 'center',
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  avatarInitial: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.base,
    color: '#fff',
  },
  customerToggleBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    backgroundColor: colors.accent,
    borderRadius: borderRadius.pill,
  },
  customerToggleText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.xs,
    color: colors.primary,
  },
  // ── Scroll ──
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },

  // ── Dashboard Heading ──
  dashHeading: {
    fontFamily: fonts.extraBold,
    fontSize: fontSizes['3xl'],
    color: colors.dark,
    marginBottom: spacing.lg,
  },

  // ── Stats Grid ──
  statsGrid: {
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: borderRadius.card,
    padding: spacing.md,
    shadowColor: colors.dark,
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    minHeight: 100,
    justifyContent: 'center',
  },
  statIcon: {
    fontSize: 28,
    marginBottom: spacing.xs,
  },
  statValue: {
    fontFamily: fonts.extraBold,
    fontSize: fontSizes['4xl'],
    color: colors.primary,
    lineHeight: fontSizes['4xl'] + 4,
  },
  statTitle: {
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.sm,
    color: colors.dark,
    marginTop: 4,
  },
  statDesc: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    color: '#8B6A55',
    marginTop: 2,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 2,
  },
  trendArrow: {
    fontSize: fontSizes.sm,
    color: '#2e7d32',
    fontFamily: fonts.bold,
  },
  trendLabel: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    color: '#2e7d32',
  },
  statLink: {
    marginTop: spacing.xs,
  },
  statLinkText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.xs,
    color: colors.primary,
    textDecorationLine: 'underline',
  },

  // ── Search & Filter ──
  searchSection: {
    marginBottom: spacing.md,
  },
  searchInputWrap: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: borderRadius.input,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(98,55,30,0.15)',
    marginBottom: spacing.sm,
    shadowColor: colors.dark,
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: fontSizes.md,
    color: colors.dark,
  },
  clearSearch: {
    fontSize: 14,
    color: '#A0856E',
    paddingLeft: spacing.sm,
  },
  chipsScroll: {
    flexGrow: 0,
  },
  chipsContent: {
    gap: spacing.sm,
    paddingRight: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.pill,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(98,55,30,0.2)',
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.sm,
    color: colors.dark,
  },
  chipTextActive: {
    color: '#fff',
  },

  // ── Product List ──
  productListSection: {
    marginBottom: spacing.md,
  },
  sectionHeading: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.xl,
    color: colors.dark,
    marginBottom: spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyStateText: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.base,
    color: '#A0856E',
  },

  // ── Product Card ──
  productCard: {
    backgroundColor: '#fff',
    borderRadius: borderRadius.cardLg,
    marginBottom: spacing.md,
    overflow: 'hidden',
    shadowColor: colors.dark,
    shadowOpacity: 0.07,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  productImageWrap: {
    position: 'relative',
    width: '100%',
    height: 180,
  },
  productImage: {
    width: '100%',
    height: 180,
    resizeMode: 'cover',
  },
  productImagePlaceholder: {
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productImagePlaceholderText: {
    fontSize: 48,
  },
  availBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: borderRadius.pill,
  },
  availBadgeOn: {
    backgroundColor: 'rgba(46,125,50,0.9)',
  },
  availBadgeOff: {
    backgroundColor: 'rgba(198,40,40,0.9)',
  },
  availBadgeText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.xs,
    color: '#fff',
  },
  productInfo: {
    padding: spacing.md,
  },
  productMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  productName: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.base,
    color: colors.dark,
    flex: 1,
    marginRight: spacing.sm,
  },
  productPrice: {
    fontFamily: fonts.extraBold,
    fontSize: fontSizes.base,
    color: colors.primary,
  },
  productDesc: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    color: '#8B6A55',
    lineHeight: 18,
    marginBottom: spacing.sm,
  },
  productActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  editBtn: {
    flex: 1,
    backgroundColor: colors.accent,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.input,
    alignItems: 'center',
  },
  editBtnText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.sm,
    color: colors.dark,
  },
  deleteBtn: {
    flex: 1,
    backgroundColor: '#fde8e8',
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.input,
    alignItems: 'center',
  },
  deleteBtnText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.sm,
    color: '#c62828',
  },

  // ── FAB ──
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: 76,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.dark,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  fabIcon: {
    fontSize: 28,
    color: '#fff',
    lineHeight: 32,
    fontFamily: fonts.light,
  },
});
