import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
  RefreshControl,
} from 'react-native';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { BASE_URL } from '../config/api';
import StarRating from '../components/ui/StarRating';
import colors from '../theme/colors';
import { fonts, fontSizes } from '../theme/typography';
import spacing, { borderRadius } from '../theme/spacing';
import BottomNavBar from '../components/ui/BottomNavBar';

const STATUS_COLORS = {
  Pending: '#F57C00',
  Brewing: '#1565C0',
  Ready: '#2E7D32',
  Delivered: '#388E3C',
  Cancelled: '#C62828',
};

// 3 sample community reviews with Unsplash images
const SAMPLE_REVIEWS = [
  {
    _id: 'sample1',
    name: 'Aisha Fernando',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&q=80',
    rating: 5,
    comment: 'Absolutely love the Pistachio-Rose Velvet Latte! The ambiance is cozy and the staff are so warm. My go-to spot every morning.',
    photo: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&q=80',
    date: 'Mar 28, 2026',
  },
  {
    _id: 'sample2',
    name: 'Rohan Perera',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&q=80',
    rating: 4,
    comment: 'Great service and the cold brew is exceptional. The Salted Caramel Nitro Brew is a must-try. Would love more seating though!',
    photo: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&q=80',
    date: 'Mar 30, 2026',
  },
  {
    _id: 'sample3',
    name: 'Priya Nair',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&q=80',
    rating: 5,
    comment: 'The Masala Chai Tea Latte is the best I\'ve had outside of home. Ember Coffee Co. really nails the spice balance. 10/10!',
    photo: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=400&q=80',
    date: 'Apr 1, 2026',
  },
];

function SampleReviewCard({ review }) {
  return (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <Image source={{ uri: review.avatar }} style={styles.reviewAvatar} />
        <View style={styles.reviewMeta}>
          <Text style={styles.reviewerName}>{review.name}</Text>
          <Text style={styles.reviewDate}>{review.date}</Text>
        </View>
      </View>
      <StarRating rating={review.rating} size={14} />
      <Text style={styles.reviewComment}>{review.comment}</Text>
      {review.photo && (
        <Image source={{ uri: review.photo }} style={styles.reviewPhoto} resizeMode="cover" />
      )}
    </View>
  );
}

export default function OrdersScreen() {
  const navigation = useNavigation();
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const { data } = await axios.get(`${BASE_URL}/api/orders/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const sorted = [...(data || [])].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
      setOrders(sorted);
    } catch {
      // handled by interceptor
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.cream} />
      <View style={styles.header}>
        <Text style={styles.title}>My Orders</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
        >
          {/* ── Orders list ── */}
          {orders.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>☕</Text>
              <Text style={styles.emptyTitle}>No orders yet</Text>
              <Text style={styles.emptySubtitle}>Your order history will appear here</Text>
              <TouchableOpacity style={styles.browseBtn} onPress={() => navigation.navigate('Menu')}>
                <Text style={styles.browseBtnText}>Start Ordering</Text>
              </TouchableOpacity>
            </View>
          ) : (
            orders.map((item) => {
              const statusColor = STATUS_COLORS[item.orderStatus] || colors.primary;
              const date = new Date(item.createdAt).toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric',
              });
              return (
                <TouchableOpacity
                  key={item._id}
                  style={styles.card}
                  onPress={() => navigation.navigate('OrderTracking', { orderId: item._id })}
                  activeOpacity={0.8}
                >
                  <View style={styles.cardHeader}>
                    <Text style={styles.orderId}>Order #{item._id?.slice(-6).toUpperCase()}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: statusColor + '22' }]}>
                      <Text style={[styles.statusText, { color: statusColor }]}>{item.orderStatus}</Text>
                    </View>
                  </View>
                  <Text style={styles.date}>{date}</Text>
                  <View style={styles.cardFooter}>
                    <Text style={styles.itemCount}>
                      {item.items?.length ?? 0} item{item.items?.length !== 1 ? 's' : ''}
                    </Text>
                    <Text style={styles.total}>Rs. {(item.totalAmount ?? 0).toFixed(2)}</Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}

          {/* ── Community Notes section ── */}
          <View style={styles.communitySection}>
            <View style={styles.communitySectionHeader}>
              <View>
                <Text style={styles.communityTitle}>Community Notes</Text>
                <Text style={styles.communitySubtitle}>What our customers are saying</Text>
              </View>
              <TouchableOpacity
                style={styles.seeAllBtn}
                onPress={() => navigation.navigate('ReviewsFeed')}
                activeOpacity={0.7}
              >
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>

            {SAMPLE_REVIEWS.map((review) => (
              <SampleReviewCard key={review._id} review={review} />
            ))}

            <TouchableOpacity
              style={styles.writeReviewBtn}
              onPress={() => navigation.navigate('ReviewsFeed')}
              activeOpacity={0.85}
            >
              <Text style={styles.writeReviewBtnText}>✍️  Write a Review</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 80 }} />
        </ScrollView>
      )}

      <BottomNavBar activeTab="Orders" onTabPress={(tab) => navigation.navigate(tab)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  title: { fontFamily: fonts.bold, fontSize: fontSizes['2xl'], color: colors.dark },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingHorizontal: spacing.lg, paddingTop: spacing.xs },

  // Order card
  card: {
    backgroundColor: '#fff',
    borderRadius: borderRadius.card,
    padding: spacing.md,
    marginBottom: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  orderId: { fontFamily: fonts.semiBold, fontSize: fontSizes.md, color: colors.dark },
  statusBadge: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: 9999 },
  statusText: { fontFamily: fonts.semiBold, fontSize: fontSizes.xs },
  date: { fontFamily: fonts.regular, fontSize: fontSizes.sm, color: colors.dark + '88', marginBottom: spacing.sm },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemCount: { fontFamily: fonts.regular, fontSize: fontSizes.sm, color: colors.dark + '99' },
  total: { fontFamily: fonts.bold, fontSize: fontSizes.md, color: colors.primary },

  // Empty state
  emptyState: { alignItems: 'center', paddingVertical: spacing['2xl'] },
  emptyIcon: { fontSize: 56, marginBottom: spacing.md },
  emptyTitle: { fontFamily: fonts.bold, fontSize: fontSizes.xl, color: colors.dark, marginBottom: spacing.xs },
  emptySubtitle: { fontFamily: fonts.regular, fontSize: fontSizes.md, color: colors.dark + '88', marginBottom: spacing.lg },
  browseBtn: { backgroundColor: colors.primary, paddingHorizontal: spacing.xl, paddingVertical: spacing.sm, borderRadius: 9999 },
  browseBtnText: { fontFamily: fonts.semiBold, fontSize: fontSizes.md, color: '#fff' },

  // Community Notes section
  communitySection: { marginTop: spacing.xl },
  communitySectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  communityTitle: { fontFamily: fonts.bold, fontSize: fontSizes.xl, color: colors.dark },
  communitySubtitle: { fontFamily: fonts.regular, fontSize: fontSizes.sm, color: 'rgba(46,21,0,0.5)', marginTop: 2 },
  seeAllBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.pill,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  seeAllText: { fontFamily: fonts.semiBold, fontSize: fontSizes.sm, color: colors.primary },

  // Review card
  reviewCard: {
    backgroundColor: '#fff',
    borderRadius: borderRadius.card,
    padding: spacing.md,
    marginBottom: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs },
  reviewAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: spacing.sm, backgroundColor: colors.accent },
  reviewMeta: { flex: 1 },
  reviewerName: { fontFamily: fonts.semiBold, fontSize: fontSizes.md, color: colors.dark },
  reviewDate: { fontFamily: fonts.regular, fontSize: fontSizes.xs, color: 'rgba(46,21,0,0.45)', marginTop: 1 },
  reviewComment: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    color: colors.dark,
    opacity: 0.8,
    lineHeight: 20,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  reviewPhoto: {
    width: '100%',
    height: 160,
    borderRadius: borderRadius.input,
  },

  // Write review button
  writeReviewBtn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.pill,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  writeReviewBtnText: { fontFamily: fonts.semiBold, fontSize: fontSizes.base, color: '#fff' },
});
