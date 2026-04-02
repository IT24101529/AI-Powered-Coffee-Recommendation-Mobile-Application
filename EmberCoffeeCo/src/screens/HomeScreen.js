import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import axios from 'axios';

import { BASE_URL } from '../config/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

import TopAppBar from '../components/ui/TopAppBar';
import BottomNavBar from '../components/ui/BottomNavBar';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';

import colors from '../theme/colors';
import { fonts, fontSizes } from '../theme/typography';
import spacing, { borderRadius } from '../theme/spacing';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HERO_HEIGHT = 260;
const HORIZONTAL_MARGIN = spacing.lg; // 24

// Milestone definitions for rewards tracker
const MILESTONES = [
  { icon: '☕', label: 'Starter', points: 0 },
  { icon: '🌟', label: 'Regular', points: 100 },
  { icon: '🏆', label: 'Champion', points: 300 },
];

function getTierName(points) {
  if (points >= 300) return 'Champion';
  if (points >= 100) return 'Regular';
  return 'Starter';
}

export default function HomeScreen({ navigation }) {
  const { token } = useAuth();
  const { items: cartItems } = useCart();

  const [promo, setPromo] = useState(null);
  const [profile, setProfile] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const cartCount = cartItems.reduce((sum, i) => sum + i.quantity, 0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const [promoRes, productsRes] = await Promise.allSettled([
        axios.get(`${BASE_URL}/api/promotions`),
        axios.get(`${BASE_URL}/api/products`),
      ]);

      if (promoRes.status === 'fulfilled') {
        const promos = promoRes.value.data;
        const active = Array.isArray(promos)
          ? promos.find((p) => p.isActive) || promos[0]
          : null;
        setPromo(active || null);
      }

      if (productsRes.status === 'fulfilled') {
        const all = productsRes.value.data;
        const available = Array.isArray(all)
          ? all.filter((p) => p.isAvailable !== false).slice(0, 3)
          : [];
        setProducts(available);
      }

      if (token) {
        try {
          const profileRes = await axios.get(`${BASE_URL}/api/auth/profile`, { headers });
          setProfile(profileRes.data);
        } catch (_) {
          // profile fetch optional
        }
      }
    } catch (_) {
      // graceful degradation
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const navigateTo = (screen, params) => {
    navigation?.navigate(screen, params);
  };

  const handleTabPress = (tab) => {
    const map = {
      Home: 'Home',
      Menu: 'Menu',
      Rewards: 'Rewards',
      Orders: 'Orders',
      Profile: 'Profile',
    };
    if (map[tab] && tab !== 'Home') {
      navigation?.navigate(map[tab]);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.cream} />

      {/* Top App Bar */}
      <TopAppBar
        title="EMBER COFFEE CO."
        rightElement={
          <TouchableOpacity
            onPress={() => navigateTo('Cart')}
            style={styles.cartBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.cartIcon}>🛒</Text>
            {cartCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cartCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <>
            {/* Hero Promotional Banner */}
            <HeroBanner promo={promo} onOrderNow={() => navigateTo('Menu')} />

            {/* Rewards Tracker */}
            <RewardsTracker profile={profile} />

            {/* Quick Order Section */}
            <QuickOrderSection
              products={products}
              onViewAll={() => navigateTo('Menu')}
              onProductPress={(product) =>
                navigateTo('ProductDetail', { product })
              }
            />

            {/* Our Story Section */}
            <OurStorySection />

            {/* Bottom padding for FAB */}
            <View style={{ height: 80 }} />
          </>
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigateTo('Cart')}
        activeOpacity={0.85}
      >
        <Text style={styles.fabIcon}>🛒</Text>
        {cartCount > 0 && (
          <View style={styles.fabBadge}>
            <Text style={styles.fabBadgeText}>{cartCount}</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Bottom Nav Bar */}
      <BottomNavBar activeTab="Home" onTabPress={handleTabPress} />
    </SafeAreaView>
  );
}

// ─── Hero Banner ────────────────────────────────────────────────────────────
function HeroBanner({ promo, onOrderNow }) {
  const title = promo?.title || 'Start Your Morning Right';
  const description =
    promo?.description || 'Handcrafted espresso drinks made with love.';

  return (
    <View style={heroBannerStyles.container}>
      {/* Background image placeholder */}
      <View style={heroBannerStyles.imagePlaceholder} />

      {/* Gradient overlay (simulated with layered views) */}
      <View style={heroBannerStyles.gradientTop} />
      <View style={heroBannerStyles.gradientBottom} />

      {/* Content */}
      <View style={heroBannerStyles.content}>
        <Badge label="Featured" variant="accent" style={heroBannerStyles.badge} />
        <Text style={heroBannerStyles.heading}>{title}</Text>
        <Text style={heroBannerStyles.description} numberOfLines={2}>
          {description}
        </Text>
        <Button
          title="Order Now"
          variant="secondary"
          onPress={onOrderNow}
          style={heroBannerStyles.button}
        />
      </View>
    </View>
  );
}

const heroBannerStyles = StyleSheet.create({
  container: {
    marginHorizontal: HORIZONTAL_MARGIN,
    marginTop: spacing.md,
    height: HERO_HEIGHT,
    borderRadius: borderRadius.cardLg,
    overflow: 'hidden',
  },
  imagePlaceholder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.dark,
  },
  gradientTop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    top: 0,
    height: '40%',
    opacity: 0.3,
    backgroundColor: colors.dark,
  },
  gradientBottom: {
    ...StyleSheet.absoluteFillObject,
    top: '40%',
    backgroundColor: colors.dark,
    opacity: 0.75,
  },
  content: {
    ...StyleSheet.absoluteFillObject,
    padding: spacing.lg,
    justifyContent: 'flex-end',
  },
  badge: {
    marginBottom: spacing.sm,
  },
  heading: {
    fontFamily: fonts.extraBold,
    fontSize: fontSizes['3xl'],
    color: '#FFFFFF',
    lineHeight: 36,
    marginBottom: spacing.xs,
  },
  description: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: spacing.md,
  },
  button: {
    width: 140,
    height: 44,
  },
});

// ─── Rewards Tracker ─────────────────────────────────────────────────────────
function RewardsTracker({ profile }) {
  const totalPoints = profile?.totalPoints ?? profile?.points ?? 0;
  const tierName = getTierName(totalPoints);
  const nextMilestone = MILESTONES.find((m) => m.points > totalPoints);
  const progressMax = nextMilestone ? nextMilestone.points : 300;
  const progressPct = Math.min(totalPoints / progressMax, 1);

  return (
    <Card style={rewardsStyles.card} shadow>
      <Text style={rewardsStyles.heading}>Your Brew Journey</Text>
      <View style={rewardsStyles.tierRow}>
        <Text style={rewardsStyles.tierName}>{tierName}</Text>
        <View style={rewardsStyles.starRow}>
          <Text style={rewardsStyles.starIcon}>⭐</Text>
          <Text style={rewardsStyles.starCount}>{totalPoints} pts</Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={rewardsStyles.progressTrack}>
        <View style={[rewardsStyles.progressFill, { width: `${progressPct * 100}%` }]} />
      </View>

      {/* Milestone icons */}
      <View style={rewardsStyles.milestonesRow}>
        {MILESTONES.map((m) => {
          const reached = totalPoints >= m.points;
          return (
            <View key={m.label} style={rewardsStyles.milestone}>
              <View style={[rewardsStyles.milestoneIcon, reached && rewardsStyles.milestoneIconActive]}>
                <Text style={rewardsStyles.milestoneEmoji}>{m.icon}</Text>
              </View>
              <Text style={rewardsStyles.milestoneLabel}>{m.label}</Text>
            </View>
          );
        })}
      </View>
    </Card>
  );
}

const rewardsStyles = StyleSheet.create({
  card: {
    marginHorizontal: HORIZONTAL_MARGIN,
    marginTop: spacing.lg,
    backgroundColor: '#FFFFFF',
  },
  heading: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.base,
    color: colors.dark,
    marginBottom: spacing.sm,
  },
  tierRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  tierName: {
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.md,
    color: colors.primary,
  },
  starRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  starIcon: {
    fontSize: 14,
  },
  starCount: {
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.sm,
    color: colors.dark,
  },
  progressTrack: {
    height: 6,
    backgroundColor: colors.accent,
    borderRadius: borderRadius.pill,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.pill,
  },
  milestonesRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  milestone: {
    alignItems: 'center',
    gap: 4,
  },
  milestoneIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  milestoneIconActive: {
    backgroundColor: colors.primary,
  },
  milestoneEmoji: {
    fontSize: 20,
  },
  milestoneLabel: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    color: colors.dark,
  },
});

// ─── Quick Order Section ─────────────────────────────────────────────────────
function QuickOrderSection({ products, onViewAll, onProductPress }) {
  const [p0, p1, p2] = products;

  return (
    <View style={quickOrderStyles.section}>
      {/* Section header */}
      <View style={quickOrderStyles.header}>
        <Text style={quickOrderStyles.sectionTitle}>Quick Order</Text>
        <TouchableOpacity onPress={onViewAll} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={quickOrderStyles.viewAll}>View All</Text>
        </TouchableOpacity>
      </View>

      {/* Bento grid: 2 small left + 1 large right */}
      <View style={quickOrderStyles.grid}>
        {/* Left column: 2 small cards */}
        <View style={quickOrderStyles.leftCol}>
          <SmallProductCard product={p0} onPress={() => p0 && onProductPress(p0)} />
          <SmallProductCard product={p1} onPress={() => p1 && onProductPress(p1)} />
        </View>

        {/* Right column: 1 large card */}
        <LargeProductCard product={p2} onPress={() => p2 && onProductPress(p2)} />
      </View>
    </View>
  );
}

function SmallProductCard({ product, onPress }) {
  const name = product?.name || 'Coffee';
  const price = product?.price != null ? `$${product.price.toFixed(2)}` : '';

  return (
    <TouchableOpacity style={smallCardStyles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={smallCardStyles.imagePlaceholder} />
      <View style={smallCardStyles.info}>
        <Text style={smallCardStyles.name} numberOfLines={1}>{name}</Text>
        {!!price && <Text style={smallCardStyles.price}>{price}</Text>}
      </View>
    </TouchableOpacity>
  );
}

function LargeProductCard({ product, onPress }) {
  const name = product?.name || 'Morning Set';
  const price = product?.price != null ? `$${product.price.toFixed(2)}` : '';
  const description = product?.description || 'The perfect start to your day.';

  return (
    <TouchableOpacity style={largeCardStyles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={largeCardStyles.imagePlaceholder} />
      <View style={largeCardStyles.overlay} />
      <View style={largeCardStyles.content}>
        <Text style={largeCardStyles.name} numberOfLines={2}>{name}</Text>
        <Text style={largeCardStyles.description} numberOfLines={2}>{description}</Text>
        {!!price && <Text style={largeCardStyles.price}>{price}</Text>}
      </View>
    </TouchableOpacity>
  );
}

const GRID_GAP = spacing.sm;
const GRID_WIDTH = SCREEN_WIDTH - HORIZONTAL_MARGIN * 2;
const LEFT_COL_WIDTH = GRID_WIDTH * 0.45;
const RIGHT_COL_WIDTH = GRID_WIDTH - LEFT_COL_WIDTH - GRID_GAP;
const SMALL_CARD_HEIGHT = (GRID_WIDTH * 0.55 - GRID_GAP) / 2;
const LARGE_CARD_HEIGHT = SMALL_CARD_HEIGHT * 2 + GRID_GAP;

const quickOrderStyles = StyleSheet.create({
  section: {
    marginTop: spacing.xl,
    paddingHorizontal: HORIZONTAL_MARGIN,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.lg,
    color: colors.dark,
  },
  viewAll: {
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.sm,
    color: colors.primary,
  },
  grid: {
    flexDirection: 'row',
    gap: GRID_GAP,
  },
  leftCol: {
    width: LEFT_COL_WIDTH,
    gap: GRID_GAP,
  },
});

const smallCardStyles = StyleSheet.create({
  card: {
    width: LEFT_COL_WIDTH,
    height: SMALL_CARD_HEIGHT,
    borderRadius: borderRadius.card,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  imagePlaceholder: {
    flex: 1,
    backgroundColor: colors.accent,
  },
  info: {
    padding: spacing.sm,
  },
  name: {
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.xs,
    color: colors.dark,
  },
  price: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.xs,
    color: colors.primary,
    marginTop: 2,
  },
});

const largeCardStyles = StyleSheet.create({
  card: {
    width: RIGHT_COL_WIDTH,
    height: LARGE_CARD_HEIGHT,
    borderRadius: borderRadius.card,
    overflow: 'hidden',
    backgroundColor: colors.dark,
  },
  imagePlaceholder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.primary,
    opacity: 0.7,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(46,21,0,0.55)',
  },
  content: {
    ...StyleSheet.absoluteFillObject,
    padding: spacing.md,
    justifyContent: 'flex-end',
  },
  name: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.md,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  description: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
  },
  price: {
    fontFamily: fonts.extraBold,
    fontSize: fontSizes.base,
    color: colors.accent,
  },
});

// ─── Our Story Section ───────────────────────────────────────────────────────
const STORY_CARDS = [
  {
    id: '1',
    caption: 'From Bean to Cup',
    subtitle: 'Sourced from the finest farms around the world.',
  },
  {
    id: '2',
    caption: 'Crafted with Care',
    subtitle: 'Every cup is a labor of love by our baristas.',
  },
];

function OurStorySection() {
  return (
    <View style={storyStyles.section}>
      <Text style={storyStyles.sectionTitle}>Our Story</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={storyStyles.scrollContent}
      >
        {STORY_CARDS.map((card) => (
          <StoryCard key={card.id} card={card} />
        ))}
      </ScrollView>
    </View>
  );
}

function StoryCard({ card }) {
  return (
    <View style={storyCardStyles.card}>
      <View style={storyCardStyles.imagePlaceholder} />
      <View style={storyCardStyles.overlay} />
      <View style={storyCardStyles.content}>
        <Text style={storyCardStyles.caption}>{card.caption}</Text>
        <Text style={storyCardStyles.subtitle} numberOfLines={2}>
          {card.subtitle}
        </Text>
      </View>
    </View>
  );
}

const STORY_CARD_WIDTH = SCREEN_WIDTH * 0.72;
const STORY_CARD_HEIGHT = 180;

const storyStyles = StyleSheet.create({
  section: {
    marginTop: spacing.xl,
  },
  sectionTitle: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.lg,
    color: colors.dark,
    marginBottom: spacing.md,
    paddingHorizontal: HORIZONTAL_MARGIN,
  },
  scrollContent: {
    paddingHorizontal: HORIZONTAL_MARGIN,
    gap: spacing.md,
  },
});

const storyCardStyles = StyleSheet.create({
  card: {
    width: STORY_CARD_WIDTH,
    height: STORY_CARD_HEIGHT,
    borderRadius: borderRadius.cardLg,
    overflow: 'hidden',
    backgroundColor: colors.dark,
  },
  imagePlaceholder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.primary,
    opacity: 0.6,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(46,21,0,0.5)',
  },
  content: {
    ...StyleSheet.absoluteFillObject,
    padding: spacing.md,
    justifyContent: 'flex-end',
  },
  caption: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.base,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    color: 'rgba(255,255,255,0.8)',
  },
});

// ─── Main Styles ─────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    height: 400,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // TopAppBar right element
  cartBtn: {
    position: 'relative',
  },
  cartIcon: {
    fontSize: 22,
  },
  cartBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.pill,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  cartBadgeText: {
    fontFamily: fonts.bold,
    fontSize: 9,
    color: '#FFFFFF',
  },
  // FAB
  fab: {
    position: 'absolute',
    bottom: 76,
    right: HORIZONTAL_MARGIN,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  fabIcon: {
    fontSize: 22,
  },
  fabBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: colors.accent,
    borderRadius: borderRadius.pill,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  fabBadgeText: {
    fontFamily: fonts.bold,
    fontSize: 9,
    color: colors.dark,
  },
});
