import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { BASE_URL } from '../config/api';
import TopAppBar from '../components/ui/TopAppBar';
import colors from '../theme/colors';
import spacing, { borderRadius } from '../theme/spacing';
import { fonts, fontSizes } from '../theme/typography';

const TAX_RATE = 0.06;
const STARS_PER_RM = 10;

// ─── Fulfillment Toggle Card ──────────────────────────────────────────────────

function FulfillmentCard({ icon, label, selected, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.fulfillmentCard, selected && styles.fulfillmentCardSelected]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={styles.fulfillmentIcon}>{icon}</Text>
      <Text style={[styles.fulfillmentLabel, selected && styles.fulfillmentLabelSelected]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ─── Payment Method Row ───────────────────────────────────────────────────────

function PaymentRow({ icon, label, selected, onPress }) {
  return (
    <TouchableOpacity
      style={styles.paymentRow}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={styles.paymentIcon}>{icon}</Text>
      <Text style={styles.paymentLabel}>{label}</Text>
      <View style={[styles.radioCircle, selected && styles.radioCircleSelected]}>
        {selected && <View style={styles.radioDot} />}
      </View>
    </TouchableOpacity>
  );
}

// ─── Order Summary Item ───────────────────────────────────────────────────────

function SummaryItem({ item }) {
  const customization = [item.milkType, item.size].filter(Boolean).join(' • ');
  return (
    <View style={styles.summaryItem}>
      {item.productImageUrl ? (
        <Image
          source={{ uri: item.productImageUrl }}
          style={styles.summaryThumb}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.summaryThumb, styles.summaryThumbPlaceholder]}>
          <Text style={styles.summaryThumbIcon}>☕</Text>
        </View>
      )}
      <View style={styles.summaryItemInfo}>
        <Text style={styles.summaryItemName} numberOfLines={1}>
          {item.productName}
        </Text>
        {!!customization && (
          <Text style={styles.summaryItemCustom} numberOfLines={1}>
            {customization}
          </Text>
        )}
        <Text style={styles.summaryItemQtyPrice}>
          {item.quantity} × RM {Number(item.price).toFixed(2)}
        </Text>
      </View>
      <Text style={styles.summaryItemTotal}>
        RM {(item.price * item.quantity).toFixed(2)}
      </Text>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function CheckoutScreen({ navigation, route }) {
  const { items, clearCart } = useCart();
  const { token } = useAuth();

  const discount = route.params?.discount ?? 0;
  const promoCode = route.params?.promoCode ?? '';

  const [fulfillment, setFulfillment] = useState('pickup'); // 'pickup' | 'delivery'
  const [paymentMethod, setPaymentMethod] = useState('credit'); // 'apple' | 'credit'
  const [screenshot, setScreenshot] = useState(null); // { uri, type, name }
  const [placing, setPlacing] = useState(false);

  // ── Derived totals ──────────────────────────────────────────────────────────
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const discountAmount = subtotal * (discount / 100);
  const discountedSubtotal = subtotal - discountAmount;
  const tax = discountedSubtotal * TAX_RATE;
  const total = discountedSubtotal + tax;
  const starsEarned = Math.floor(total * STARS_PER_RM);

  // ── Screenshot picker ───────────────────────────────────────────────────────
  const handlePickScreenshot = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please allow access to your photo library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.length > 0) {
      const asset = result.assets[0];
      const ext = asset.uri.split('.').pop().toLowerCase();
      setScreenshot({
        uri: asset.uri,
        type: ext === 'png' ? 'image/png' : 'image/jpeg',
        name: `payment.${ext}`,
      });
    }
  };

  // ── Place order ─────────────────────────────────────────────────────────────
  const handlePlaceOrder = async () => {
    setPlacing(true);
    try {
      const orderRes = await axios.post(
        `${BASE_URL}/api/orders`,
        {
          items: items.map((i) => ({
            productId: i._id,
            quantity: i.quantity,
            price: i.price,
          })),
          totalAmount: parseFloat(total.toFixed(2)),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const orderId = orderRes.data._id;

      if (screenshot) {
        const formData = new FormData();
        formData.append('image', {
          uri: screenshot.uri,
          type: screenshot.type,
          name: screenshot.name,
        });
        await axios.post(`${BASE_URL}/api/orders/${orderId}/upload`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        });
      }

      clearCart();
      navigation.navigate('OrderTracking', { orderId });
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to place order. Please try again.';
      Alert.alert('Error', msg);
    } finally {
      setPlacing(false);
    }
  };

  // ── Empty cart guard ────────────────────────────────────────────────────────
  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <TopAppBar
          title="Checkout"
          onBack={() => navigation.goBack()}
        />
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🛒</Text>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySubtitle}>Go back and add some items first.</Text>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Text style={styles.backBtnText}>Back to Cart</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* ── Top App Bar ── */}
      <TopAppBar
        title="Checkout"
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Heading ── */}
        <Text style={styles.heading}>Finalize Your Order</Text>
        <Text style={styles.subheading}>
          Review your selections and complete your purchase
        </Text>

        {/* ── Fulfillment Method ── */}
        <Text style={styles.sectionTitle}>Fulfillment Method</Text>
        <View style={styles.fulfillmentRow}>
          <FulfillmentCard
            icon="🏪"
            label="Pickup"
            selected={fulfillment === 'pickup'}
            onPress={() => setFulfillment('pickup')}
          />
          <FulfillmentCard
            icon="🚚"
            label="Delivery"
            selected={fulfillment === 'delivery'}
            onPress={() => setFulfillment('delivery')}
          />
        </View>

        {/* ── Location Details ── */}
        <View style={styles.locationCard}>
          <View style={styles.locationHeader}>
            <View>
              <Text style={styles.locationName}>Ember Coffee Co.</Text>
              <Text style={styles.locationAddress}>123 Brew Street, KL</Text>
            </View>
            <TouchableOpacity>
              <Text style={styles.changeLink}>Change</Text>
            </TouchableOpacity>
          </View>
          {/* Map placeholder */}
          <View style={styles.mapPlaceholder}>
            <Text style={styles.mapPin}>📍</Text>
          </View>
        </View>

        {/* ── Payment Method ── */}
        <Text style={styles.sectionTitle}>Payment Method</Text>
        <View style={styles.paymentCard}>
          <PaymentRow
            icon="🍎"
            label="Apple Pay"
            selected={paymentMethod === 'apple'}
            onPress={() => setPaymentMethod('apple')}
          />
          <View style={styles.paymentDivider} />
          <PaymentRow
            icon="💳"
            label="Credit Card"
            selected={paymentMethod === 'credit'}
            onPress={() => setPaymentMethod('credit')}
          />
        </View>

        {/* ── Upload Payment Screenshot ── */}
        <TouchableOpacity
          style={styles.uploadBtn}
          onPress={handlePickScreenshot}
          activeOpacity={0.8}
        >
          <Text style={styles.uploadIcon}>📤</Text>
          <View>
            <Text style={styles.uploadLabel}>Upload Payment Screenshot</Text>
            <Text style={styles.uploadSubtitle}>For bank transfer proof</Text>
          </View>
        </TouchableOpacity>
        {screenshot && (
          <Image
            source={{ uri: screenshot.uri }}
            style={styles.screenshotPreview}
            resizeMode="cover"
          />
        )}

        {/* ── Order Summary Card ── */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryCardTitle}>Order Summary</Text>

          {items.map((item) => (
            <SummaryItem key={item._id} item={item} />
          ))}

          {/* Rewards earning */}
          <View style={styles.rewardsRow}>
            <Text style={styles.rewardsStar}>⭐</Text>
            <Text style={styles.rewardsText}>You'll earn {starsEarned} stars</Text>
          </View>

          <View style={styles.summaryDivider} />

          {/* Subtotal */}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>RM {subtotal.toFixed(2)}</Text>
          </View>

          {/* Discount row */}
          {discount > 0 && (
            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, styles.discountLabel]}>
                Discount ({discount}%{promoCode ? ` · ${promoCode}` : ''})
              </Text>
              <Text style={[styles.totalValue, styles.discountValue]}>
                − RM {discountAmount.toFixed(2)}
              </Text>
            </View>
          )}

          {/* Tax */}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tax (6% SST)</Text>
            <Text style={styles.totalValue}>RM {tax.toFixed(2)}</Text>
          </View>

          {/* Total */}
          <View style={[styles.totalRow, styles.grandTotalRow]}>
            <Text style={styles.grandTotalLabel}>Total</Text>
            <Text style={styles.grandTotalValue}>RM {total.toFixed(2)}</Text>
          </View>

          {/* Place Order button */}
          <TouchableOpacity
            style={[styles.placeOrderBtn, placing && styles.placeOrderBtnDisabled]}
            onPress={handlePlaceOrder}
            activeOpacity={0.85}
            disabled={placing}
          >
            {placing ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.placeOrderBtnText}>Place Order</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* ── Trust Badge ── */}
        <Text style={styles.trustBadge}>🔒 Secure checkout · SSL encrypted</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },

  // ── Empty State ──
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  emptyIcon: {
    fontSize: fontSizes['5xl'],
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.xl,
    color: colors.dark,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.base,
    color: colors.dark,
    opacity: 0.6,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  backBtn: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.pill,
  },
  backBtnText: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.base,
    color: '#fff',
  },

  // ── Heading ──
  heading: {
    fontFamily: fonts.bold,
    fontSize: fontSizes['2xl'],
    color: colors.dark,
    marginBottom: spacing.xs,
  },
  subheading: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.md,
    color: colors.dark,
    opacity: 0.6,
    marginBottom: spacing.lg,
  },

  // ── Section Title ──
  sectionTitle: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.lg,
    color: colors.dark,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },

  // ── Fulfillment ──
  fulfillmentRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  fulfillmentCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.card,
    borderWidth: 1,
    borderColor: colors.accent,
    backgroundColor: '#fff',
  },
  fulfillmentCardSelected: {
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: '#FFF0E6',
  },
  fulfillmentIcon: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  fulfillmentLabel: {
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.base,
    color: colors.dark,
  },
  fulfillmentLabelSelected: {
    color: colors.primary,
  },

  // ── Location Card ──
  locationCard: {
    backgroundColor: '#fff',
    borderRadius: borderRadius.cardLg,
    padding: spacing.md,
    marginBottom: spacing.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
  },
  locationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  locationName: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.base,
    color: colors.dark,
  },
  locationAddress: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    color: colors.dark,
    opacity: 0.6,
    marginTop: 2,
  },
  changeLink: {
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.sm,
    color: colors.primary,
  },
  mapPlaceholder: {
    height: 100,
    borderRadius: borderRadius.card,
    backgroundColor: '#FFDCC2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapPin: {
    fontSize: 32,
  },

  // ── Payment Card ──
  paymentCard: {
    backgroundColor: '#fff',
    borderRadius: borderRadius.cardLg,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  paymentIcon: {
    fontSize: 22,
    marginRight: spacing.md,
  },
  paymentLabel: {
    flex: 1,
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.base,
    color: colors.dark,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    borderColor: colors.primary,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  paymentDivider: {
    height: 1,
    backgroundColor: colors.accent,
  },

  // ── Upload Button ──
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.primary,
    borderRadius: borderRadius.card,
    padding: spacing.md,
    backgroundColor: '#fff',
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  uploadIcon: {
    fontSize: 24,
  },
  uploadLabel: {
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.base,
    color: colors.primary,
  },
  uploadSubtitle: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    color: colors.dark,
    opacity: 0.6,
    marginTop: 2,
  },
  screenshotPreview: {
    width: '100%',
    height: 180,
    borderRadius: borderRadius.card,
    marginBottom: spacing.md,
  },

  // ── Summary Card ──
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: borderRadius.cardLg,
    padding: spacing.lg,
    marginTop: spacing.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
  },
  summaryCardTitle: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.lg,
    color: colors.dark,
    marginBottom: spacing.md,
  },

  // ── Summary Item ──
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  summaryThumb: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.card,
    backgroundColor: colors.accent,
  },
  summaryThumbPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryThumbIcon: {
    fontSize: 22,
  },
  summaryItemInfo: {
    flex: 1,
    marginLeft: spacing.sm,
    marginRight: spacing.sm,
  },
  summaryItemName: {
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.base,
    color: colors.dark,
  },
  summaryItemCustom: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    color: colors.dark,
    opacity: 0.55,
    marginTop: 2,
  },
  summaryItemQtyPrice: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    color: colors.dark,
    opacity: 0.6,
    marginTop: 2,
  },
  summaryItemTotal: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.md,
    color: colors.primary,
  },

  // ── Rewards Row ──
  rewardsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0E6',
    borderRadius: borderRadius.card,
    padding: spacing.sm,
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  rewardsStar: {
    fontSize: 16,
  },
  rewardsText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.sm,
    color: colors.primary,
  },

  // ── Totals ──
  summaryDivider: {
    height: 1,
    backgroundColor: colors.accent,
    marginBottom: spacing.md,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  totalLabel: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.base,
    color: colors.dark,
    opacity: 0.7,
  },
  totalValue: {
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.base,
    color: colors.dark,
  },
  discountLabel: {
    color: '#27ae60',
    opacity: 1,
  },
  discountValue: {
    color: '#27ae60',
  },
  grandTotalRow: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.accent,
    marginBottom: spacing.lg,
  },
  grandTotalLabel: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.lg,
    color: colors.dark,
  },
  grandTotalValue: {
    fontFamily: fonts.extraBold,
    fontSize: fontSizes.xl,
    color: colors.primary,
  },

  // ── Place Order Button ──
  placeOrderBtn: {
    backgroundColor: colors.primary,
    height: 52,
    borderRadius: borderRadius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeOrderBtnDisabled: {
    opacity: 0.6,
  },
  placeOrderBtnText: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.base,
    color: '#fff',
    letterSpacing: 0.5,
  },

  // ── Trust Badge ──
  trustBadge: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    color: colors.dark,
    opacity: 0.55,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});
