// components/products/ProductCard.js
// Renders a single coffee recommendation inside the chat.
// Wijerathna renders this when recommendations[] comes back
// from POST /products/recommend

import React, { useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity,
  StyleSheet, Animated, Image,
} from 'react-native';
import { COLORS, FONTS, SPACING, RADIUS } from '../theme';

// Temperature label → display
const TEMP_ICONS = {
  Hot:     { icon: '♨️', label: 'Hot'     },
  Iced:    { icon: '🧊', label: 'Iced'    },
  Blended: { icon: '🥤', label: 'Blended' },
};

// ── Props ────────────────────────────────────────────────────
// product      (object) — one item from recommendations[]
//   Fields used:
//     product_name    (string)
//     category        (string)
//     price           (float)
//     temperature     (string)  'Hot' | 'Iced' | 'Blended'
//     description     (string)
//     similarity_score (float)  0.0 – 1.0
//     reason          (string)
// onOrder      (fn)    — called with the product object
// onAlternatives (fn)  — called when user taps "Show Alternatives"
export default function ProductCard({ product, onOrder, onAlternatives }) {
  const slideAnim = useRef(new Animated.Value(40)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;

  // Slide up + fade in when product appears
  useEffect(() => {
    if (!product) return;
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1, duration: 350, useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0, duration: 350, useNativeDriver: true,
      }),
    ]).start();
  }, [product]);

  if (!product) return null;

  const safeName = product.product_name || product.name || 'Recommended Coffee';
  const safeCategory = product.category || 'Other';
  const safeDescription = product.description || 'A recommendation tailored for your current context.';
  const safePrice = Number.isFinite(product.price) ? product.price : 450;
  const safeSimilarity = Number.isFinite(product.similarity_score) ? product.similarity_score : 0.78;

  const matchPercent = Math.max(1, Math.round(safeSimilarity * 100));
  const tempInfo     = TEMP_ICONS[product.temperature] || TEMP_ICONS.Hot;
  const categoryIcon = CATEGORY_ICONS[safeCategory] || '☕';

  // Match quality label from similarity_score
  const matchLabel =
    matchPercent >= 90 ? 'Perfect Match' :
    matchPercent >= 75 ? 'Great Match'   : 'Good Match';

  const matchColor =
    matchPercent >= 90 ? COLORS.success :
    matchPercent >= 75 ? COLORS.primary : COLORS.textLight;

  return (
    <Animated.View
      style={[
        styles.card,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      {/* ── Header row ───────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.imageContainer}>
          {product.image_url ? (
            <Image 
              source={{ uri: product.image_url }} 
              style={styles.productImage} 
              resizeMode="cover"
            />
          ) : (
            <View style={styles.placeholderImage}>
              <Text style={{ fontSize: 20 }}>☕</Text>
            </View>
          )}
        </View>
        <View style={styles.headerText}>
          <Text style={styles.productName}>{safeName}</Text>
          <Text style={styles.category}>{safeCategory}</Text>
        </View>
        <View style={styles.priceBox}>
          <Text style={styles.price}>Rs. {safePrice.toFixed(0)}</Text>
          <View style={[styles.tempPill, { backgroundColor: COLORS.primaryLight }]}>
            <Text style={styles.tempText}>
              {tempInfo.icon} {tempInfo.label}
            </Text>
          </View>
        </View>
      </View>

      {/* ── Description ──────────────────────────────────── */}
      <Text style={styles.description}>{safeDescription}</Text>

      {/* ── Match score bar ──────────────────────────────── */}
      <View style={styles.matchRow}>
        <Text style={[styles.matchLabel, { color: matchColor }]}>
          {matchLabel}
        </Text>
        <View style={styles.matchBarTrack}>
          <View
            style={[
              styles.matchBarFill,
              { width: `${matchPercent}%`, backgroundColor: matchColor },
            ]}
          />
        </View>
        <Text style={[styles.matchPercent, { color: matchColor }]}>
          {matchPercent}%
        </Text>
      </View>

      {/* ── Reason box ───────────────────────────────────── */}
      {product.reason && (
        <View style={styles.reasonBox}>
          <Text style={styles.reasonIcon}>💡</Text>
          <Text style={styles.reasonText}>{product.reason}</Text>
        </View>
      )}

      {/* ── Action buttons ───────────────────────────────── */}
      <View style={styles.btnRow}>
        <TouchableOpacity
          style={styles.orderBtn}
          onPress={() => onOrder && onOrder(product)}
        >
          <Text style={styles.orderBtnText}>☕  Order This</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.altBtn}
          onPress={() => onAlternatives && onAlternatives(product)}
        >
          <Text style={styles.altBtnText}>Alternatives</Text>
        </TouchableOpacity>
      </View>

    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius:    RADIUS.md,
    padding:         SPACING.lg,
    marginVertical:  SPACING.sm,
    borderWidth:     1,
    borderColor:     COLORS.border,
    borderTopWidth:  3,
    borderTopColor:  COLORS.primary,
    shadowColor:     '#000',
    shadowOpacity:   0.08,
    shadowRadius:    8,
    elevation:       3,
  },
  header: {
    flexDirection:  'row',
    alignItems:     'center',
    marginBottom:   SPACING.sm,
  },
  imageContainer: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.background,
    marginRight: SPACING.md,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.accent,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  productName: {
    fontSize:   17,
    color:      COLORS.text,
    fontFamily: FONTS.bold,
    marginBottom: 2,
  },
  category: {
    fontSize:   12,
    color:      COLORS.textLight,
    fontFamily: FONTS.regular,
  },
  priceBox: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize:     16,
    color:        COLORS.primary,
    fontFamily:   FONTS.bold,
    marginBottom: SPACING.xs,
  },
  tempPill: {
    borderRadius:      RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical:   2,
  },
  tempText: {
    fontSize:   11,
    color:      COLORS.text,
    fontFamily: FONTS.regular,
  },
  description: {
    fontSize:     13,
    color:        COLORS.textLight,
    fontFamily:   FONTS.regular,
    marginBottom: SPACING.md,
    lineHeight:   18,
  },
  matchRow: {
    flexDirection:  'row',
    alignItems:     'center',
    marginBottom:   SPACING.sm,
  },
  matchLabel: {
    fontSize:   11,
    fontFamily: FONTS.semiBold,
    width:      80,
  },
  matchBarTrack: {
    flex:            1,
    height:          6,
    backgroundColor: COLORS.border,
    borderRadius:    RADIUS.full,
    marginHorizontal: SPACING.sm,
    overflow:        'hidden',
  },
  matchBarFill: {
    height:       6,
    borderRadius: RADIUS.full,
  },
  matchPercent: {
    fontSize:   12,
    fontFamily: FONTS.bold,
    width:      32,
    textAlign:  'right',
  },
  reasonBox: {
    flexDirection:   'row',
    backgroundColor: COLORS.background,
    borderRadius:    RADIUS.sm,
    padding:         SPACING.sm,
    marginBottom:    SPACING.md,
    borderWidth:     1,
    borderColor:     COLORS.primaryLight,
  },
  reasonIcon: {
    fontSize:    14,
    marginRight: SPACING.xs,
    marginTop:   1,
  },
  reasonText: {
    fontSize:   12,
    color:      COLORS.text,
    fontFamily: FONTS.regular,
    flex:       1,
    lineHeight: 17,
  },
  btnRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
  },
  orderBtn: {
    flex:            0.56,
    backgroundColor: COLORS.primary,
    borderRadius:    RADIUS.sm,
    paddingVertical: SPACING.sm,
    alignItems:      'center',
  },
  orderBtnText: {
    color:      COLORS.surface,
    fontSize:   14,
    fontFamily: FONTS.bold,
  },
  altBtn: {
    flex:            0.40,
    borderWidth:     1.5,
    borderColor:     COLORS.primary,
    borderRadius:    RADIUS.sm,
    paddingVertical: SPACING.sm,
    alignItems:      'center',
  },
  altBtnText: {
    color:      COLORS.primary,
    fontSize:   13,
    fontFamily: FONTS.semiBold,
  },
});
