import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  RefreshControl,
} from 'react-native';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { BASE_URL } from '../../config/api';
import colors from '../../theme/colors';
import { fonts, fontSizes } from '../../theme/typography';
import spacing, { borderRadius } from '../../theme/spacing';

// ─── Constants ────────────────────────────────────────────────────────────────
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

// ─── Promo Card ───────────────────────────────────────────────────────────────
function PromoCard({ promo, onEdit, onDelete, deleting }) {
  const expiryDate = promo.validUntil
    ? new Date(promo.validUntil).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
      })
    : '—';

  const isExpired = promo.validUntil && new Date(promo.validUntil) < new Date();

  return (
    <View style={[cardStyles.card, deleting && cardStyles.cardDeleting]}>
      {/* Banner image with Active badge overlay */}
      <View style={cardStyles.bannerWrap}>
        {promo.promoBannerUrl ? (
          <Image source={{ uri: promo.promoBannerUrl }} style={cardStyles.bannerImage} />
        ) : (
          <View style={cardStyles.bannerPlaceholder}>
            <Text style={cardStyles.bannerPlaceholderIcon}>🏷️</Text>
          </View>
        )}
        {/* Active / Expired badge */}
        <View style={[cardStyles.activeBadge, isExpired && cardStyles.expiredBadge]}>
          <Text style={cardStyles.activeBadgeText}>{isExpired ? 'Expired' : 'Active'}</Text>
        </View>
        {deleting && (
          <View style={cardStyles.deletingOverlay}>
            <ActivityIndicator color="#fff" size="small" />
          </View>
        )}
      </View>

      {/* Card body */}
      <View style={cardStyles.body}>
        {/* Promo name + code pill */}
        <View style={cardStyles.nameRow}>
          <Text style={cardStyles.promoName} numberOfLines={1}>
            {promo.promoCode ?? 'Promotion'}
          </Text>
          <View style={cardStyles.codePill}>
            <Text style={cardStyles.codePillText}>{promo.promoCode}</Text>
          </View>
        </View>

        {/* Discount percentage */}
        <View style={cardStyles.discountRow}>
          <Text style={cardStyles.discountValue}>{promo.discountPercent ?? 0}</Text>
          <Text style={cardStyles.discountOff}>% off</Text>
        </View>

        {/* Expiry date row */}
        <View style={cardStyles.expiryRow}>
          <Text style={cardStyles.calendarIcon}>📅</Text>
          <Text style={[cardStyles.expiryText, isExpired && cardStyles.expiryExpired]}>
            {isExpired ? 'Expired ' : 'Expires '}{expiryDate}
          </Text>
        </View>

        {/* Actions */}
        <View style={cardStyles.actionsRow}>
          <TouchableOpacity
            style={cardStyles.editBtn}
            onPress={onEdit}
            activeOpacity={0.85}
            disabled={deleting}
          >
            <Text style={cardStyles.editBtnText}>✏️  Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={cardStyles.deleteBtn}
            onPress={onDelete}
            activeOpacity={0.85}
            disabled={deleting}
          >
            <Text style={cardStyles.deleteBtnIcon}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.cardLg,
    marginBottom: spacing.md,
    overflow: 'hidden',
    shadowColor: colors.dark,
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  cardDeleting: { opacity: 0.5 },

  // Banner
  bannerWrap: {
    height: 160,
    width: '100%',
    position: 'relative',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  bannerPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerPlaceholderIcon: { fontSize: 48 },
  activeBadge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    backgroundColor: '#2E7D32',
    borderRadius: borderRadius.pill,
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: spacing.xs,
  },
  expiredBadge: { backgroundColor: '#9E9E9E' },
  activeBadgeText: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.xs,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  deletingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Body
  body: { padding: spacing.md },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  promoName: {
    flex: 1,
    fontFamily: fonts.bold,
    fontSize: fontSizes.base,
    color: colors.dark,
  },
  codePill: {
    backgroundColor: colors.accent,
    borderRadius: borderRadius.pill,
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: spacing.xs,
  },
  codePillText: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.xs,
    color: colors.primary,
    letterSpacing: 1,
  },

  // Discount
  discountRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: spacing.sm,
  },
  discountValue: {
    fontFamily: fonts.extraBold,
    fontSize: fontSizes['5xl'],
    color: colors.primary,
    lineHeight: fontSizes['5xl'] + 4,
  },
  discountOff: {
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.lg,
    color: colors.primary,
    marginBottom: 6,
    marginLeft: spacing.xs,
  },

  // Expiry
  expiryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  calendarIcon: { fontSize: 13 },
  expiryText: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    color: '#6B5E57',
  },
  expiryExpired: { color: '#9E9E9E' },

  // Actions
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  editBtn: {
    flex: 1,
    height: 44,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBtnText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.sm,
    color: '#FFFFFF',
  },
  deleteBtn: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.pill,
    backgroundColor: 'rgba(211,47,47,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtnIcon: { fontSize: 18 },
});

// ─── Insight Section ──────────────────────────────────────────────────────────
function InsightSection({ onCreatePromo }) {
  return (
    <View style={insightStyles.container}>
      {/* Campaign Tips Card */}
      <View style={insightStyles.tipsCard}>
        <Text style={insightStyles.tipsIcon}>💡</Text>
        <Text style={insightStyles.tipsTitle}>Campaign Tips</Text>
        <Text style={insightStyles.tipsBody}>
          Keep promotions time-limited to create urgency. Discounts between 10–25% tend to drive the highest conversion without hurting margins.
        </Text>
        <View style={insightStyles.tipsList}>
          {['Use memorable promo codes', 'Set clear expiry dates', 'Promote on the home screen'].map((tip) => (
            <View key={tip} style={insightStyles.tipRow}>
              <Text style={insightStyles.tipDot}>•</Text>
              <Text style={insightStyles.tipText}>{tip}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Roasting New Campaigns editorial card */}
      <View style={insightStyles.editorialCard}>
        <View style={insightStyles.editorialImageWrap}>
          <Text style={insightStyles.editorialEmoji}>☕</Text>
        </View>
        <Text style={insightStyles.editorialLabel}>EDITORIAL</Text>
        <Text style={insightStyles.editorialHeading}>Roasting New Campaigns?</Text>
        <Text style={insightStyles.editorialBody}>
          Every great promotion starts with a story. Craft offers that resonate with your regulars and attract new coffee lovers.
        </Text>
        <TouchableOpacity
          style={insightStyles.editorialBtn}
          onPress={onCreatePromo}
          activeOpacity={0.85}
        >
          <Text style={insightStyles.editorialBtnText}>Create Promotion</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const insightStyles = StyleSheet.create({
  container: { gap: spacing.md, marginBottom: spacing.xl },

  // Tips card
  tipsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.cardLg,
    padding: spacing.lg,
    shadowColor: colors.dark,
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  tipsIcon: { fontSize: 28, marginBottom: spacing.xs },
  tipsTitle: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.base,
    color: colors.dark,
    marginBottom: spacing.xs,
  },
  tipsBody: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    color: '#6B5E57',
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  tipsList: { gap: spacing.xs },
  tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xs },
  tipDot: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.sm,
    color: colors.primary,
    lineHeight: 18,
  },
  tipText: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    color: '#6B5E57',
    flex: 1,
    lineHeight: 18,
  },

  // Editorial card
  editorialCard: {
    backgroundColor: colors.dark,
    borderRadius: borderRadius.cardLg,
    padding: spacing.lg,
    overflow: 'hidden',
  },
  editorialImageWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,220,194,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  editorialEmoji: { fontSize: 28 },
  editorialLabel: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.xs,
    color: colors.accent,
    letterSpacing: 1.5,
    marginBottom: spacing.xs,
  },
  editorialHeading: {
    fontFamily: fonts.extraBold,
    fontSize: fontSizes.xl,
    color: '#FFFFFF',
    marginBottom: spacing.xs,
  },
  editorialBody: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  editorialBtn: {
    alignSelf: 'flex-start',
    backgroundColor: colors.accent,
    borderRadius: borderRadius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  editorialBtnText: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.sm,
    color: colors.dark,
  },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function AdminPromotionsScreen({ navigation }) {
  const { user, token } = useAuth();
  const [promos, setPromos]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const authHeader = { headers: { Authorization: `Bearer ${token}` } };

  // ── Fetch promotions ──────────────────────────────────────────────────────
  const fetchPromos = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/api/promotions`, authHeader);
      setPromos(res.data ?? []);
    } catch (err) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to load promotions.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => { fetchPromos(); }, [fetchPromos]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPromos(true);
  };

  // ── Delete promotion ──────────────────────────────────────────────────────
  const handleDelete = (promo) => {
    Alert.alert(
      'Delete Promotion',
      `Are you sure you want to delete the "${promo.promoCode}" promotion?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeletingId(promo._id);
            try {
              await axios.delete(`${BASE_URL}/api/promotions/${promo._id}`, authHeader);
              setPromos((prev) => prev.filter((p) => p._id !== promo._id));
            } catch (err) {
              Alert.alert('Error', err?.response?.data?.message || 'Failed to delete promotion.');
            } finally {
              setDeletingId(null);
            }
          },
        },
      ]
    );
  };

  // ── Navigate to add/edit ──────────────────────────────────────────────────
  const handleEdit = (promo) => {
    navigation.navigate('AdminAddPromo', { promo });
  };

  const handleCreateNew = () => {
    navigation.navigate('AdminAddPromo', { promo: null });
  };

  // ── Admin tab navigation ──────────────────────────────────────────────────
  const handleTabPress = (tab) => {
    const routeMap = {
      Dashboard:  'AdminDashboard',
      Products:   'AdminProducts',
      Orders:     'AdminOrders',
      Rewards:    'AdminRewards',
      Promotions: 'AdminPromotions',
    };
    const target = routeMap[tab];
    if (target && target !== 'AdminPromotions') {
      navigation.navigate(target);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.cream} />

      {/* ── TopAppBar (node 13:1045) ── */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Active Promotions</Text>
        <View style={styles.avatarWrap}>
          {user?.profileImageUrl ? (
            <Image source={{ uri: user.profileImageUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarInitial}>{user?.name?.[0]?.toUpperCase() || 'A'}</Text>
            </View>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* ── Heading + description (node 13:920) ── */}
        <View style={styles.headingSection}>
          <Text style={styles.heading}>Active Promotions</Text>
          <Text style={styles.headingDesc}>
            Manage your promotional campaigns. Create time-limited offers with promo codes to drive customer engagement.
          </Text>
        </View>

        {/* ── Create New Promotion button (node 13:927) ── */}
        <TouchableOpacity style={styles.createBtn} onPress={handleCreateNew} activeOpacity={0.85}>
          <Text style={styles.createBtnText}>+ Create New Promotion</Text>
        </TouchableOpacity>

        {/* ── Promotions Bento Grid (node 13:933) ── */}
        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
        ) : promos.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🏷️</Text>
            <Text style={styles.emptyTitle}>No promotions yet</Text>
            <Text style={styles.emptyDesc}>
              Tap "Create New Promotion" to launch your first campaign.
            </Text>
          </View>
        ) : (
          <View style={styles.promoGrid}>
            {promos.map((promo) => (
              <PromoCard
                key={promo._id}
                promo={promo}
                onEdit={() => handleEdit(promo)}
                onDelete={() => handleDelete(promo)}
                deleting={deletingId === promo._id}
              />
            ))}
          </View>
        )}

        {/* ── Asymmetric Insight Section (node 13:1018) ── */}
        {!loading && (
          <InsightSection onCreatePromo={handleCreateNew} />
        )}

        <View style={{ height: spacing.xl }} />
      </ScrollView>

      {/* ── Admin BottomNavBar (node 13:1054) ── */}
      <AdminBottomNavBar activeTab="Promotions" onTabPress={handleTabPress} />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },

  // TopAppBar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.cream,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.pill,
    backgroundColor: 'rgba(98,55,30,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  backArrow: {
    fontSize: fontSizes.lg,
    color: colors.primary,
    fontFamily: fonts.bold,
  },
  topBarTitle: {
    flex: 1,
    fontFamily: fonts.bold,
    fontSize: fontSizes.base,
    color: colors.dark,
    textAlign: 'center',
  },
  avatarWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
    marginLeft: spacing.sm,
  },
  avatar: { width: 36, height: 36, borderRadius: 18 },
  avatarFallback: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.sm,
    color: '#FFFFFF',
  },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },

  // Heading
  headingSection: { marginBottom: spacing.md },
  heading: {
    fontFamily: fonts.extraBold,
    fontSize: fontSizes['2xl'],
    color: colors.dark,
    marginBottom: spacing.xs,
  },
  headingDesc: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    color: '#6B5E57',
    lineHeight: 20,
  },

  // Create button
  createBtn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.pill,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  createBtnText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.base,
    color: '#FFFFFF',
  },

  // Promo grid
  promoGrid: { gap: spacing.sm },

  // Loader
  loader: { marginTop: spacing['3xl'] },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing['3xl'],
    marginBottom: spacing.lg,
  },
  emptyIcon: { fontSize: 48, marginBottom: spacing.md },
  emptyTitle: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.xl,
    color: colors.dark,
    marginBottom: spacing.xs,
  },
  emptyDesc: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    color: '#9E9E9E',
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
});
