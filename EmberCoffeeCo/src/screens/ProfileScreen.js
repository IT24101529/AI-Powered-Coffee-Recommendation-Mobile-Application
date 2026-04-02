import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { BASE_URL } from '../config/api';
import TopAppBar from '../components/ui/TopAppBar';
import BottomNavBar from '../components/ui/BottomNavBar';
import Input from '../components/ui/Input';
import colors from '../theme/colors';
import spacing, { borderRadius } from '../theme/spacing';
import { fonts, fontSizes } from '../theme/typography';

const PLACEHOLDER_AVATAR =
  'https://ui-avatars.com/api/?background=62371E&color=fff&size=128&name=';

function getTierInfo(points) {
  if (points >= 600) return { name: 'Platinum', next: null, progress: 1 };
  if (points >= 300) return { name: 'Gold', next: 600, progress: (points - 300) / 300 };
  if (points >= 100) return { name: 'Silver', next: 300, progress: (points - 100) / 200 };
  return { name: 'Bronze', next: 100, progress: points / 100 };
}

export default function ProfileScreen({ navigation }) {
  const { user, token, login, logout } = useAuth();

  const [uploading, setUploading]     = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue]     = useState(user?.name || '');
  const [nameError, setNameError]     = useState('');
  const [saving, setSaving]           = useState(false);
  const [ordersCount, setOrdersCount] = useState(0);

  const points   = user?.totalPoints ?? 0;
  const tierInfo = getTierInfo(points);
  const avatarUri = user?.profileImageUrl
    ? user.profileImageUrl
    : PLACEHOLDER_AVATAR + encodeURIComponent(user?.name || 'U');

  const fetchProfile = useCallback(async () => {
    if (!token) return;
    try {
      const { data } = await axios.get(BASE_URL + '/api/auth/profile', {
        headers: { Authorization: 'Bearer ' + token },
      });
      await login(token, data);
      setNameValue(data.name || '');
    } catch (_) {}
  }, [token]);

  const fetchOrders = useCallback(async () => {
    if (!token) return;
    try {
      const { data } = await axios.get(BASE_URL + '/api/orders/my', {
        headers: { Authorization: 'Bearer ' + token },
      });
      setOrdersCount(Array.isArray(data) ? data.length : 0);
    } catch (_) {
      setOrdersCount(0);
    }
  }, [token]);

  useEffect(() => {
    fetchProfile();
    fetchOrders();
  }, []);

  const handleSaveName = async () => {
    if (!nameValue.trim()) {
      setNameError('Name cannot be empty');
      return;
    }
    setNameError('');
    setSaving(true);
    try {
      const { data } = await axios.put(
        BASE_URL + '/api/auth/profile',
        { name: nameValue.trim() },
        { headers: { Authorization: 'Bearer ' + token } },
      );
      await login(token, data);
      setEditingName(false);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Could not save name.');
    } finally {
      setSaving(false);
    }
  };

  const handlePickImage = async () => {
    let ImagePicker;
    try {
      ImagePicker = require('expo-image-picker');
    } catch {
      Alert.alert('Missing dependency', 'Install expo-image-picker to upload a profile photo.');
      return;
    }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Allow access to your photo library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    const formData = new FormData();
    formData.append('image', {
      uri: asset.uri,
      name: asset.fileName || 'profile.jpg',
      type: asset.mimeType || 'image/jpeg',
    });
    setUploading(true);
    try {
      const { data } = await axios.post(
        BASE_URL + '/api/auth/profile/upload',
        formData,
        { headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'multipart/form-data' } },
      );
      await login(token, data);
    } catch (err) {
      Alert.alert('Upload failed', err.response?.data?.message || 'Could not upload image.');
    } finally {
      setUploading(false);
    }
  };

  const handleTabPress = (tab) => navigation.navigate(tab);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.root}>
        <TopAppBar title="Profile" />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Avatar */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarWrapper}>
              <Image source={{ uri: avatarUri }} style={styles.avatar} />
              {uploading && (
                <View style={styles.avatarOverlay}>
                  <ActivityIndicator color="#fff" size="large" />
                </View>
              )}
              <TouchableOpacity
                style={styles.cameraBtn}
                onPress={handlePickImage}
                disabled={uploading}
                activeOpacity={0.8}
              >
                <Text style={styles.cameraIcon}>{'📷'}</Text>
              </TouchableOpacity>
            </View>

            {editingName ? (
              <View style={styles.nameEditRow}>
                <View style={styles.nameInput}>
                  <Input
                    value={nameValue}
                    onChangeText={(v) => { setNameValue(v); setNameError(''); }}
                    error={nameError}
                    autoCapitalize="words"
                    autoFocus
                  />
                </View>
                <TouchableOpacity
                  style={styles.saveBtn}
                  onPress={handleSaveName}
                  disabled={saving}
                  activeOpacity={0.8}
                >
                  {saving
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <Text style={styles.saveBtnText}>Save</Text>}
                </TouchableOpacity>
              </View>
            ) : (
              <Text style={styles.userName}>{user?.name || ''}</Text>
            )}

            <Text style={styles.userEmail}>{user?.email || ''}</Text>
          </View>

          {/* Rewards Balance card */}
          <View style={styles.rewardsCard}>
            <Text style={styles.rewardsPoints}>{points}</Text>
            <Text style={styles.rewardsStarsLabel}>Stars</Text>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: (Math.min(tierInfo.progress, 1) * 100) + '%' },
                ]}
              />
            </View>
            <View style={styles.tierRow}>
              <Text style={styles.tierName}>{tierInfo.name}</Text>
              {tierInfo.next !== null && (
                <Text style={styles.tierNext}>{tierInfo.next - points} pts to next tier</Text>
              )}
            </View>
          </View>

          {/* Stats grid */}
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statIcon}>{'📦'}</Text>
              <Text style={styles.statNumber}>{ordersCount}</Text>
              <Text style={styles.statLabel}>Orders</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statIcon}>{'⭐'}</Text>
              <Text style={styles.statNumber}>{tierInfo.name}</Text>
              <Text style={styles.statLabel}>Loyalty Tier</Text>
            </View>
          </View>

          {/* Action list rows */}
          <View style={styles.actionList}>
            <TouchableOpacity
              style={styles.actionRow}
              onPress={() => { setNameValue(user?.name || ''); setNameError(''); setEditingName(true); }}
              activeOpacity={0.7}
            >
              <Text style={styles.actionLabel}>Edit Profile</Text>
              <Text style={styles.actionChevron}>{'›'}</Text>
            </TouchableOpacity>
            <View style={styles.rowDivider} />
            <TouchableOpacity
              style={styles.actionRow}
              onPress={() => navigation.navigate('Orders')}
              activeOpacity={0.7}
            >
              <Text style={styles.actionLabel}>Order History</Text>
              <Text style={styles.actionChevron}>{'›'}</Text>
            </TouchableOpacity>
            <View style={styles.rowDivider} />
            <TouchableOpacity style={styles.actionRow} activeOpacity={0.7}>
              <Text style={styles.actionLabel}>Notifications</Text>
              <Text style={styles.actionChevron}>{'›'}</Text>
            </TouchableOpacity>
          </View>

          {/* Sign Out */}
          <TouchableOpacity style={styles.signOutBtn} onPress={logout} activeOpacity={0.8}>
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </ScrollView>

        <BottomNavBar activeTab="Profile" onTabPress={handleTabPress} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.cream },
  root: { flex: 1, backgroundColor: colors.cream },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing['4xl'],
  },

  avatarSection: { alignItems: 'center', marginBottom: spacing.xl },
  avatarWrapper: { position: 'relative', width: 128, height: 128, marginBottom: spacing.md },
  avatar: { width: 128, height: 128, borderRadius: 64, backgroundColor: colors.accent },
  avatarOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 64,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.cream,
  },
  cameraIcon: { fontSize: 16 },

  userName: {
    fontFamily: fonts.bold,
    fontSize: fontSizes['3xl'],
    color: colors.dark,
    textAlign: 'center',
    marginBottom: 4,
  },
  userEmail: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.base,
    color: 'rgba(46,21,0,0.5)',
    textAlign: 'center',
  },
  nameEditRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4, gap: spacing.sm },
  nameInput: { flex: 1 },
  saveBtn: {
    height: 52,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 64,
  },
  saveBtnText: { fontFamily: fonts.semiBold, fontSize: fontSizes.base, color: '#fff' },

  rewardsCard: {
    backgroundColor: colors.accent,
    borderRadius: borderRadius.card,
    padding: spacing.lg,
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  rewardsPoints: {
    fontFamily: fonts.extraBold,
    fontSize: fontSizes['5xl'],
    color: colors.dark,
  },
  rewardsStarsLabel: {
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.md,
    color: colors.primary,
    marginBottom: spacing.md,
  },
  progressTrack: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(98,55,30,0.2)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  progressFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 3 },
  tierRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
  tierName: { fontFamily: fonts.bold, fontSize: fontSizes.md, color: colors.dark },
  tierNext: { fontFamily: fonts.regular, fontSize: fontSizes.sm, color: 'rgba(46,21,0,0.6)' },

  statsGrid: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.card,
    padding: spacing.md,
    alignItems: 'center',
    gap: 4,
  },
  statIcon: { fontSize: 22 },
  statNumber: { fontFamily: fonts.bold, fontSize: fontSizes.xl, color: colors.dark },
  statLabel: { fontFamily: fonts.regular, fontSize: fontSizes.sm, color: 'rgba(46,21,0,0.5)' },

  actionList: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.card,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  actionLabel: { fontFamily: fonts.semiBold, fontSize: fontSizes.base, color: colors.dark },
  actionChevron: { fontSize: 22, color: 'rgba(46,21,0,0.4)', lineHeight: 26 },
  rowDivider: { height: 1, backgroundColor: 'rgba(0,0,0,0.06)', marginHorizontal: spacing.md },

  signOutBtn: {
    borderWidth: 1.5,
    borderColor: '#E53E3E',
    borderRadius: borderRadius.pill,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  signOutText: { fontFamily: fonts.semiBold, fontSize: fontSizes.base, color: '#E53E3E' },
});
