// components/trends/PopularNowBanner.js
// Shows top trending products in a horizontal card row.
// Wijerathna renders this when the user is undecided or says
// "surprise me" — intent = Suggest with no strong preference.

import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import axios from 'axios';
import { COLORS, FONTS, SPACING, RADIUS } from '../theme';
import API_URLS from '../../../config/api';

// Tier → badge config
const TIER_CONFIG = {
  'Bestseller':  { label: '⭐ BESTSELLER', color: COLORS.primary  },
  'Trending Up': { label: '📈 TRENDING',   color: '#27AE60'       },
  'Hidden Gem':  { label: '💎 HIDDEN GEM', color: '#8E44AD'       },
  'Normal':      { label: null,             color: COLORS.border   },
};

// ── Props ────────────────────────────────────────────────────
// onSelect  (fn)  — called with product_name when user taps a card
export default function PopularNowBanner({ onSelect }) {
  const [trending, setTrending] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  useEffect(() => {
    // GET /trends/popular?top_n=3
    // Response: { count, trending: [...] }
    axios.get(`${API_URLS.TRENDS_API}/trends/popular`, {
      params:  { top_n: 3 },
      timeout: 6000,
    })
      .then(res => {
        // Use res.data.trending — NOT res.data directly
        setTrending(res.data.trending || []);
        setLoading(false);
      })
      .catch(() => {
        setError('Could not load trending items.');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingRow}>
        <ActivityIndicator size="small" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading trending drinks…</Text>
      </View>
    );
  }

  if (error) {
    return <Text style={styles.error}>{error}</Text>;
  }

  // If trend engine has no data yet (backend empty), show nothing
  if (!trending || trending.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>🔥  Trending Right Now</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {trending.map((item, index) => {
          const tierConfig = TIER_CONFIG[item.tier] || TIER_CONFIG.Normal;

          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.card,
                item.tier === 'Bestseller' && styles.cardBestseller,
              ]}
              onPress={() => onSelect && onSelect(item.product_name)}
            >
              {/* Tier badge — only show if not Normal */}
              {tierConfig.label && (
                <Text style={[styles.tierBadge, { color: tierConfig.color }]}>
                  {tierConfig.label}
                </Text>
              )}

              {/* Product name — from item.product_name */}
              <Text style={styles.productName} numberOfLines={2}>
                {item.product_name}
              </Text>

              {/* Social proof — from item.social_proof */}
              {/* e.g. "Ordered 147 times today!" */}
              <Text style={styles.socialProof}>{item.social_proof}</Text>

              {/* Growth rate — from item.growth_rate (string like "+40.0%") */}
              <Text style={styles.growth}>{item.growth_rate} this week</Text>

              {/* Trend score bar */}
              <View style={styles.scoreBar}>
                <View
                  style={[
                    styles.scoreFill,
                    { width: `${Math.round(item.trend_score * 100)}%` },
                  ]}
                />
              </View>

            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.background,
    paddingVertical: SPACING.sm,
  },
  header: {
    fontSize:         15,
    fontFamily:       FONTS.bold,
    color:            COLORS.primary,
    marginBottom:     SPACING.sm,
    paddingHorizontal: SPACING.lg,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    gap:              SPACING.sm,
  },
  card: {
    width:           165,
    backgroundColor: COLORS.surface,
    borderRadius:    RADIUS.md,
    padding:         SPACING.md,
    borderWidth:     1,
    borderColor:     COLORS.border,
  },
  cardBestseller: {
    borderColor:     COLORS.primary,
    borderWidth:     2,
  },
  tierBadge: {
    fontSize:     10,
    fontFamily:   FONTS.bold,
    marginBottom: SPACING.xs,
  },
  productName: {
    fontSize:     14,
    fontFamily:   FONTS.bold,
    color:        COLORS.text,
    marginBottom: SPACING.xs,
  },
  socialProof: {
    fontSize:     12,
    fontFamily:   FONTS.regular,
    color:        COLORS.textLight,
    marginBottom: 2,
  },
  growth: {
    fontSize:     11,
    fontFamily:   FONTS.semiBold,
    color:        '#27AE60',
    marginBottom: SPACING.sm,
  },
  scoreBar: {
    height:          4,
    backgroundColor: COLORS.border,
    borderRadius:    RADIUS.full,
    overflow:        'hidden',
  },
  scoreFill: {
    height:          4,
    backgroundColor: COLORS.primary,
    borderRadius:    RADIUS.full,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems:    'center',
    padding:       SPACING.md,
  },
  loadingText: {
    marginLeft: SPACING.sm,
    color:      COLORS.textLight,
    fontFamily: FONTS.regular,
    fontSize:   13,
  },
  error: {
    color:      COLORS.error,
    fontFamily: FONTS.regular,
    fontSize:   13,
    padding:    SPACING.md,
  },
});
