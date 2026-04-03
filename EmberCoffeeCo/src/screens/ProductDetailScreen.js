import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import axios from 'axios';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { BASE_URL } from '../config/api';
import StarRating from '../components/ui/StarRating';
import ReviewFeed from '../components/ui/ReviewFeed';
import ReviewOverlay from '../components/ui/ReviewOverlay';
import colors from '../theme/colors';
import spacing, { borderRadius } from '../theme/spacing';
import { fonts, fontSizes } from '../theme/typography';

const SIZES = ['Small', 'Medium', 'Large'];
const MILK_TYPES = ['Oat', 'Almond', 'Whole', 'Soy'];

export default function ProductDetailScreen({ route, navigation }) {
  const { product: initialProduct } = route.params;
  const { addItem } = useCart();
  const { token } = useAuth();
  const insets = useSafeAreaInsets();

  const [product, setProduct] = useState(initialProduct);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewCount, setReviewCount] = useState(0);
  const [avgRating, setAvgRating] = useState(0);

  // Customisation state
  const [selectedSize, setSelectedSize] = useState('Medium');
  const [selectedMilk, setSelectedMilk] = useState('Oat');
  const [sweetness, setSweetness] = useState(2);

  // Review overlay
  const [overlayVisible, setOverlayVisible] = useState(false);

  const reviewFeedRef = useRef(null);

  // Fetch full product details
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const { data } = await axios.get(`${BASE_URL}/api/products/${initialProduct._id}`);
        setProduct(data);
      } catch {
        // fall back to passed product
      }
    };
    fetchProduct();
  }, [initialProduct._id]);

  // Fetch reviews
  const fetchReviews = async () => {
    try {
      setReviewsLoading(true);
      const { data } = await axios.get(`${BASE_URL}/api/reviews/product/${initialProduct._id}`);
      setReviews(data);
      setReviewCount(data.length);
      if (data.length > 0) {
        const avg = data.reduce((sum, r) => sum + r.rating, 0) / data.length;
        setAvgRating(Math.round(avg * 10) / 10);
      }
    } catch {
      // silent
    } finally {
      setReviewsLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [initialProduct._id]);

  const handleAddToCart = () => {
    const cartItem = isPastry
      ? { ...product, _id: product._id, _productId: product._id }
      : {
          ...product,
          size: selectedSize,
          milkType: selectedMilk,
          sweetness,
          _id: `${product._id}_${selectedSize}_${selectedMilk}_${sweetness}`,
          _productId: product._id,
        };
    addItem(cartItem);
    Alert.alert('Added to cart', `${product.productName} added.`);
  };

  const handleReviewSuccess = () => {
    setOverlayVisible(false);
    fetchReviews();
  };

  const sweetnesLabel = ['None', 'Low', 'Medium', 'High', 'Extra'][sweetness] ?? 'Medium';

  const isPastry = (product?.category || '').toLowerCase() === 'pastries';

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero Image ── */}
        <View style={styles.heroContainer}>
          {product.productImageUrl ? (
            <Image
              source={{ uri: product.productImageUrl }}
              style={styles.heroImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.heroImage, styles.heroPlaceholder]}>
              <Text style={styles.heroPlaceholderIcon}>☕</Text>
            </View>
          )}
          {/* Gradient fade overlay */}
          <View style={styles.heroGradient} />
        </View>

        {/* ── Floating TopAppBar ── */}
        <View style={[styles.topBar, { top: insets.top + 8 }]}>
          <TouchableOpacity
            style={styles.topBarBtn}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.topBarIcon}>‹</Text>
          </TouchableOpacity>

          <Text style={styles.topBarTitle} numberOfLines={1}>
            {product.productName}
          </Text>

          <TouchableOpacity
            style={styles.topBarBtn}
            onPress={() => navigation.navigate('Cart')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.topBarIcon}>🛒</Text>
          </TouchableOpacity>
        </View>

        {/* ── Product Info ── */}
        <View style={styles.infoSection}>
          {/* Category + Price row */}
          <View style={styles.categoryPriceRow}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{product.category}</Text>
            </View>
            <View style={styles.priceBadge}>
              <Text style={styles.priceText}>Rs. {Number(product.price).toFixed(2)}</Text>
            </View>
          </View>

          {/* Product name */}
          <Text style={styles.productName}>{product.productName}</Text>

          {/* Rating + review count + prep time */}
          <View style={styles.metaRow}>
            <StarRating rating={avgRating} size={14} />
            <Text style={styles.metaText}>
              {avgRating > 0 ? ` ${avgRating}` : ' —'}
            </Text>
            <Text style={styles.metaDot}>·</Text>
            <Text style={styles.metaText}>{reviewCount} review{reviewCount !== 1 ? 's' : ''}</Text>
            <Text style={styles.metaDot}>·</Text>
            <Text style={styles.metaText}>⏱ 5–10 min</Text>
          </View>

          {/* Description */}
          {product.description ? (
            <Text style={styles.description}>{product.description}</Text>
          ) : null}
        </View>

        {/* ── Customisation ── */}
        {!isPastry && (
        <View style={styles.customSection}>
          {/* Choose Size */}
          <Text style={styles.customLabel}>Choose Size</Text>
          <View style={styles.pillRow}>
            {SIZES.map((s) => (
              <TouchableOpacity
                key={s}
                style={[styles.pill, selectedSize === s && styles.pillActive]}
                onPress={() => setSelectedSize(s)}
                activeOpacity={0.75}
              >
                <Text style={[styles.pillText, selectedSize === s && styles.pillTextActive]}>
                  {s}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Milk Type */}
          <Text style={styles.customLabel}>Milk Type</Text>
          <View style={styles.pillRow}>
            {MILK_TYPES.map((m) => (
              <TouchableOpacity
                key={m}
                style={[styles.pill, selectedMilk === m && styles.pillActive]}
                onPress={() => setSelectedMilk(m)}
                activeOpacity={0.75}
              >
                <Text style={[styles.pillText, selectedMilk === m && styles.pillTextActive]}>
                  {m}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Sweetness Level */}
          <Text style={styles.customLabel}>Sweetness Level</Text>
          <View style={styles.stepperRow}>
            <TouchableOpacity
              style={styles.stepperBtn}
              onPress={() => setSweetness((v) => Math.max(0, v - 1))}
              activeOpacity={0.75}
            >
              <Text style={styles.stepperIcon}>−</Text>
            </TouchableOpacity>
            <View style={styles.stepperLabelBox}>
              <Text style={styles.stepperLabel}>{sweetnesLabel}</Text>
            </View>
            <TouchableOpacity
              style={styles.stepperBtn}
              onPress={() => setSweetness((v) => Math.min(4, v + 1))}
              activeOpacity={0.75}
            >
              <Text style={styles.stepperIcon}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
        )}

        {/* ── Review Feed Section ── */}
        <View style={styles.reviewSection}>
          <View style={styles.reviewSectionHeader}>
            <Text style={styles.sectionTitle}>Reviews</Text>
            {token ? (
              <TouchableOpacity onPress={() => setOverlayVisible(true)}>
                <Text style={styles.writeReviewLink}>Write a Review</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {reviewsLoading ? (
            <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.lg }} />
          ) : (
            <ReviewFeed ref={reviewFeedRef} productId={initialProduct._id} />
          )}
        </View>
      </ScrollView>

      {/* ── Bottom Action Bar ── */}
      <View style={[styles.actionBar, { paddingBottom: insets.bottom + spacing.sm }]}>
        <View style={styles.actionPrice}>
          <Text style={styles.actionPriceLabel}>Total</Text>
          <Text style={styles.actionPriceValue}>Rs. {Number(product.price).toFixed(2)}</Text>
        </View>
        <TouchableOpacity
          style={styles.addToCartBtn}
          onPress={handleAddToCart}
          activeOpacity={0.8}
        >
          <Text style={styles.addToCartText}>Add to Cart</Text>
        </TouchableOpacity>
      </View>

      {/* ── Review Overlay ── */}
      <ReviewOverlay
        visible={overlayVisible}
        product={product}
        onClose={() => setOverlayVisible(false)}
        onSuccess={handleReviewSuccess}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  scroll: {
    flex: 1,
  },

  // ── Hero ──
  heroContainer: {
    position: 'relative',
    height: 320,
  },
  heroImage: {
    width: '100%',
    height: 320,
  },
  heroPlaceholder: {
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroPlaceholderIcon: {
    fontSize: 64,
  },
  heroGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: colors.cream,
    opacity: 0.45,
  },

  // ── Floating TopAppBar ──
  topBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    height: 48,
    zIndex: 10,
  },
  topBarBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarIcon: {
    fontSize: 22,
    color: colors.dark,
    lineHeight: 26,
  },
  topBarTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: fonts.bold,
    fontSize: fontSizes.base,
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
    marginHorizontal: spacing.sm,
  },

  // ── Info Section ──
  infoSection: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  categoryPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  categoryBadge: {
    backgroundColor: colors.accent,
    borderRadius: borderRadius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  categoryText: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.sm,
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  priceBadge: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  priceText: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.md,
    color: '#fff',
  },
  productName: {
    fontFamily: fonts.extraBold,
    fontSize: fontSizes['3xl'],
    color: colors.dark,
    marginBottom: spacing.sm,
    lineHeight: 36,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    flexWrap: 'wrap',
    gap: 4,
  },
  metaText: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    color: colors.dark,
    opacity: 0.65,
  },
  metaDot: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    color: colors.dark,
    opacity: 0.4,
    marginHorizontal: 2,
  },
  description: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.base,
    color: colors.dark,
    opacity: 0.75,
    lineHeight: 24,
  },

  // ── Customisation ──
  customSection: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    backgroundColor: '#fff',
    borderRadius: borderRadius.cardLg,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  customLabel: {
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.md,
    color: colors.dark,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  pill: {
    borderRadius: borderRadius.pill,
    borderWidth: 1.5,
    borderColor: colors.accent,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    backgroundColor: '#fff',
  },
  pillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  pillText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.sm,
    color: colors.dark,
  },
  pillTextActive: {
    color: '#fff',
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xs,
  },
  stepperBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperIcon: {
    fontSize: 22,
    color: colors.primary,
    fontFamily: fonts.bold,
    lineHeight: 26,
  },
  stepperLabelBox: {
    flex: 1,
    alignItems: 'center',
  },
  stepperLabel: {
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.base,
    color: colors.dark,
  },

  // ── Review Section ──
  reviewSection: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    backgroundColor: '#fff',
    borderRadius: borderRadius.cardLg,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  reviewSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontFamily: fonts.bold,
    fontSize: fontSizes['2xl'],
    color: colors.dark,
  },
  writeReviewLink: {
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.sm,
    color: colors.primary,
    textDecorationLine: 'underline',
  },

  // ── Bottom Action Bar ──
  actionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: colors.accent,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 8,
  },
  actionPrice: {
    flex: 1,
  },
  actionPriceLabel: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    color: colors.dark,
    opacity: 0.55,
  },
  actionPriceValue: {
    fontFamily: fonts.extraBold,
    fontSize: fontSizes.xl,
    color: colors.dark,
  },
  addToCartBtn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.pill,
    paddingHorizontal: spacing.xl,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addToCartText: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.base,
    color: '#fff',
    letterSpacing: 0.3,
  },
});
