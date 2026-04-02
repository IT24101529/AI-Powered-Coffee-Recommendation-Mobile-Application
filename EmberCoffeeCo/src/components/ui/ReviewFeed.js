import React, { useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import axios from 'axios';
import { BASE_URL } from '../../config/api';
import StarRating from './StarRating';
import colors from '../../theme/colors';
import spacing, { borderRadius } from '../../theme/spacing';
import { fontSizes } from '../../theme/typography';

/**
 * ReviewFeed component
 * - productId: string — fetches GET /api/reviews/product/:productId on mount
 * - Exposes a `refresh()` method via ref so parent can trigger a reload
 */
const ReviewFeed = forwardRef(function ReviewFeed({ productId }, ref) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get(`${BASE_URL}/api/reviews/product/${productId}`);
      setReviews(res.data);
    } catch (err) {
      setError('Could not load reviews.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (productId) fetchReviews();
  }, [productId]);

  // Expose refresh() to parent via ref
  useImperativeHandle(ref, () => ({ refresh: fetchReviews }));

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (reviews.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>No reviews yet. Be the first!</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={reviews}
      keyExtractor={(item) => item._id}
      scrollEnabled={false}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      renderItem={({ item }) => (
        <View style={styles.reviewCard}>
          <View style={styles.reviewHeader}>
            <Text style={styles.reviewerName}>
              {item.userId?.name || 'Anonymous'}
            </Text>
            <StarRating rating={item.rating} size={14} />
          </View>
          {item.comment ? (
            <Text style={styles.reviewComment}>{item.comment}</Text>
          ) : null}
          {item.reviewImageUrl ? (
            <Image
              source={{ uri: item.reviewImageUrl }}
              style={styles.reviewImage}
              resizeMode="cover"
            />
          ) : null}
        </View>
      )}
    />
  );
});

export default ReviewFeed;

const styles = StyleSheet.create({
  centered: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  errorText: {
    fontSize: fontSizes.md,
    color: '#C0392B',
  },
  emptyText: {
    fontSize: fontSizes.md,
    color: colors.dark,
    opacity: 0.45,
  },
  separator: {
    height: 1,
    backgroundColor: colors.accent,
    marginVertical: spacing.sm,
  },
  reviewCard: {
    paddingVertical: spacing.sm,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  reviewerName: {
    fontSize: fontSizes.md,
    fontWeight: '700',
    color: colors.dark,
    flex: 1,
    marginRight: spacing.sm,
  },
  reviewComment: {
    fontSize: fontSizes.md,
    color: colors.dark,
    opacity: 0.8,
    lineHeight: 20,
    marginBottom: spacing.xs,
  },
  reviewImage: {
    width: '100%',
    height: 160,
    borderRadius: borderRadius.input,
    marginTop: spacing.xs,
  },
});
