// components/trends/CrossSellCard.js
// Shown after a user orders. Uses GET /trends/pairs?product=X
// to show "People who ordered X also got Y"

import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import axios from 'axios';
import { COLORS, FONTS, SPACING, RADIUS } from '../theme';
import API_URLS from '../../../config/api';

// ── Props ────────────────────────────────────────────────────
// productName (string) — the product that was just ordered
// onSelect    (fn)     — called with the suggested product name
export default function CrossSellCard({ productName, onSelect }) {
  const [pairs, setPairs]     = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!productName) return;

    // GET /trends/pairs?product=Espresso
    // Response: { product, frequently_bought_with: [...] }
    axios.get(`${API_URLS.TRENDS_API}/trends/pairs`, {
      params:  { product: productName },
      timeout: 6000,
    })
      .then(res => {
        // Use res.data.frequently_bought_with — NOT res.data.pairs
        setPairs(res.data.frequently_bought_with || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [productName]);

  // Don't show anything if loading, no pairs found, or no data
  if (loading || !pairs || pairs.length === 0) return null;

  // Show only the top 1 suggestion (most confident pair)
  const topPair = pairs[0];

  return (
    <View style={styles.card}>
      <Text style={styles.title}>🛍️  People also get</Text>

      {/* message field from the backend already has the full sentence */}
      {/* e.g. "73% of people who order Espresso also get Blueberry Muffin!" */}
      <Text style={styles.message}>{topPair.message}</Text>

      <View style={styles.row}>
        <View style={styles.confidenceBox}>
          <Text style={styles.confidenceNum}>
            {Math.round(topPair.confidence * 100)}%
          </Text>
          <Text style={styles.confidenceLabel}>confidence</Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => onSelect && onSelect(topPair.product)}
        >
          <Text style={styles.addBtnText}>Add {topPair.product}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.primaryLight,
    borderRadius:    RADIUS.md,
    padding:         SPACING.md,
    marginVertical:  SPACING.xs,
    borderWidth:     1,
    borderColor:     COLORS.primary,
  },
  title: {
    fontSize:     13,
    fontFamily:   FONTS.semiBold,
    color:        COLORS.text,
    marginBottom: SPACING.xs,
  },
  message: {
    fontSize:     13,
    fontFamily:   FONTS.regular,
    color:        COLORS.text,
    marginBottom: SPACING.sm,
    lineHeight:   18,
  },
  row: {
    flexDirection: 'row',
    alignItems:    'center',
  },
  confidenceBox: {
    alignItems:    'center',
    marginRight:   SPACING.md,
  },
  confidenceNum: {
    fontSize:   18,
    fontFamily: FONTS.bold,
    color:      COLORS.primary,
  },
  confidenceLabel: {
    fontSize:   10,
    fontFamily: FONTS.regular,
    color:      COLORS.textLight,
  },
  addBtn: {
    flex:            1,
    backgroundColor: COLORS.primary,
    borderRadius:    RADIUS.sm,
    paddingVertical: SPACING.sm,
    alignItems:      'center',
  },
  addBtnText: {
    color:      COLORS.surface,
    fontFamily: FONTS.semiBold,
    fontSize:   13,
  },
});
