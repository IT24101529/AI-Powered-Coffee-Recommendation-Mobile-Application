import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
  RefreshControl,
  Alert,
} from 'react-native';
import axios from 'axios';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { BASE_URL } from '../config/api';
import TopAppBar from '../components/ui/TopAppBar';
import BottomNavBar from '../components/ui/BottomNavBar';
import colors from '../theme/colors';
import { fonts, fontSizes } from '../theme/typography';
import spacing, { borderRadius } from '../theme/spacing';

const STATUS_COLORS = {
  Pending: '#F57C00',
  Brewing: '#1565C0',
  Ready: '#2E7D32',
  Delivering: '#5E35B1',
  Delivered: '#1B5E20',
};

export default function OrderHistoryScreen() {
  const navigation = useNavigation();
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHistory = useCallback(async (silent = false) => {
    if (!token) return;
    if (!silent) setLoading(true);
    try {
      const { data } = await axios.get(`${BASE_URL}/api/orders/my/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const sorted = [...(data || [])].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
      setOrders(sorted);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      fetchHistory();
    }, [fetchHistory])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchHistory(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.cream} />
      <TopAppBar title="Order History" onBack={() => navigation.goBack()} />
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
          {orders.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyTitle}>No orders yet</Text>
              <Text style={styles.emptySubtitle}>Orders you place will appear here</Text>
            </View>
          ) : (
            orders.map((item) => {
              const statusColor = STATUS_COLORS[item.orderStatus] || colors.primary;
              const date = new Date(item.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              });
              return (
                <TouchableOpacity
                  key={item._id}
                  style={styles.card}
                  onPress={() => navigation.navigate('OrderTracking', { orderId: item._id })}
                  activeOpacity={0.8}
                >
                  <View style={styles.cardHeader}>
                    <Text style={styles.orderId}>Order #{String(item._id).slice(-6).toUpperCase()}</Text>
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
          <View style={{ height: 80 }} />
        </ScrollView>
      )}
      <BottomNavBar activeTab="Orders" onTabPress={(tab) => navigation.navigate(tab)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
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
  emptyState: { alignItems: 'center', paddingVertical: spacing['2xl'] },
  emptyIcon: { fontSize: 56, marginBottom: spacing.md },
  emptyTitle: { fontFamily: fonts.bold, fontSize: fontSizes.xl, color: colors.dark, marginBottom: spacing.xs },
  emptySubtitle: { fontFamily: fonts.regular, fontSize: fontSizes.md, color: colors.dark + '88' },
});
