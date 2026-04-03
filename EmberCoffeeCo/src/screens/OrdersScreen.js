import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
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

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders(true);
  };

  const renderOrder = ({ item }) => {
    const statusColor = STATUS_COLORS[item.orderStatus] || colors.primary;
    const date = new Date(item.createdAt).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    return (
      <TouchableOpacity
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
          <Text style={styles.total}>
            ₱{(item.totalAmount ?? 0).toFixed(2)}
          </Text>
        </View>
      </TouchableOpacity>
    );
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
        <FlatList
          data={orders}
          keyExtractor={(item) => item._id}
          renderItem={renderOrder}
          contentContainerStyle={orders.length === 0 ? styles.emptyContainer : styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>☕</Text>
              <Text style={styles.emptyTitle}>No orders yet</Text>
              <Text style={styles.emptySubtitle}>Your order history will appear here</Text>
              <TouchableOpacity
                style={styles.browseBtn}
                onPress={() => navigation.navigate('Menu')}
              >
                <Text style={styles.browseBtnText}>Start Ordering</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      <BottomNavBar activeTab="Orders" onTabPress={(tab) => navigation.navigate(tab)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: fontSizes['2xl'],
    color: colors.dark,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl + 80,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
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
  orderId: {
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.md,
    color: colors.dark,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  statusText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.xs,
  },
  date: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    color: colors.dark + '88',
    marginBottom: spacing.sm,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemCount: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    color: colors.dark + '99',
  },
  total: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.md,
    color: colors.primary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
  },
  emptyIcon: {
    fontSize: 56,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.xl,
    color: colors.dark,
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.md,
    color: colors.dark + '88',
    marginBottom: spacing.lg,
  },
  browseBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: 9999,
  },
  browseBtnText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.md,
    color: '#fff',
  },
});
