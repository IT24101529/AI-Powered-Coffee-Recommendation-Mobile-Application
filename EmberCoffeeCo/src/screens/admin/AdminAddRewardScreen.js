import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Switch,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { BASE_URL } from '../../config/api';
import colors from '../../theme/colors';
import { fonts, fontSizes } from '../../theme/typography';
import spacing, { borderRadius } from '../../theme/spacing';

// ─── Constants ────────────────────────────────────────────────────────────────
const ADMIN_TABS = [
  { key: 'Dashboard',  icon: '📊' },
  { key: 'Products',   icon: '☕' },
  { key: 'Orders',     icon: '📦' },
  { key: 'Rewards',    icon: '🎁' },
  { key: 'Promotions', icon: '🏷️' },
];

// ─── Admin BottomNavBar ───────────────────────────────────────────────────────
function AdminBottomNavBar({ activeTab, onTabPress }) {
  return (
    <View style={navStyles.bar}>
      {ADMIN_TABS.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            style={navStyles.tab}
            onPress={() => onTabPress && onTabPress(tab.key)}
            activeOpacity={0.7}
          >
            <Text style={navStyles.icon}>{tab.icon}</Text>
            <Text style={[navStyles.label, isActive ? navStyles.labelActive : navStyles.labelInactive]}>
              {tab.key}
            </Text>
            {isActive ? <View style={navStyles.activeDot} /> : null}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const navStyles = StyleSheet.create({
  bar: {
    height: 60,
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.08)',
    backgroundColor: '#FFFFFF',
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 6 },
  icon: { fontSize: 16, lineHeight: 20 },
  label: { fontFamily: fonts.semiBold, fontSize: 9, marginTop: 2 },
  labelActive: { color: colors.primary },
  labelInactive: { color: '#9E9E9E' },
  activeDot: {
    width: 4, height: 4, borderRadius: 2,
    backgroundColor: colors.primary, marginTop: 2,
  },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function AdminAddRewardScreen({ navigation, route }) {
  const { user, token } = useAuth();
  const editReward = route?.params?.reward ?? null;
  const isEditMode = !!editReward;

  // Form state
  const [rewardName, setRewardName]         = useState(editReward?.rewardName ?? '');
  const [pointsRequired, setPointsRequired] = useState(
    editReward?.pointsRequired ? String(editReward.pointsRequired) : ''
  );
  const [description, setDescription]       = useState(editReward?.description ?? '');
  const [isAvailable, setIsAvailable]       = useState(editReward?.isAvailable ?? true);
  const [imageUri, setImageUri]             = useState(editReward?.rewardImageUrl ?? null);
  const [imageFile, setImageFile]           = useState(null);

  const [saving, setSaving] = useState(false);

  const authHeader = { headers: { Authorization: `Bearer ${token}` } };

  // ── Image Picker ─────────────────────────────────────────────────────────
  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please allow access to your photo library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.length > 0) {
      const asset = result.assets[0];
      setImageUri(asset.uri);
      setImageFile(asset);
    }
  };

  // ── Upload image ──────────────────────────────────────────────────────────
  const uploadImage = async (rewardId) => {
    if (!imageFile) return;
    const formData = new FormData();
    const filename = imageFile.uri.split('/').pop();
    const ext = filename.split('.').pop()?.toLowerCase() ?? 'jpg';
    const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';
    formData.append('image', { uri: imageFile.uri, name: filename, type: mimeType });
    await axios.post(
      `${BASE_URL}/api/rewards/${rewardId}/upload`,
      formData,
      { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } }
    );
  };

  // ── Validate ──────────────────────────────────────────────────────────────
  const validate = () => {
    if (!rewardName.trim()) {
      Alert.alert('Validation', 'Reward name is required.');
      return false;
    }
    const pts = parseInt(pointsRequired, 10);
    if (!pointsRequired || isNaN(pts) || pts < 1) {
      Alert.alert('Validation', 'Please enter a valid points value (minimum 1).');
      return false;
    }
    return true;
  };

  // ── Save (create or update) ───────────────────────────────────────────────
  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        rewardName: rewardName.trim(),
        pointsRequired: parseInt(pointsRequired, 10),
        description: description.trim(),
        isAvailable,
      };

      let savedReward;
      if (isEditMode) {
        const res = await axios.put(`${BASE_URL}/api/rewards/${editReward._id}`, payload, authHeader);
        savedReward = res.data;
      } else {
        const res = await axios.post(`${BASE_URL}/api/rewards`, payload, authHeader);
        savedReward = res.data;
      }

      if (imageFile) {
        await uploadImage(savedReward._id);
      }

      Alert.alert('Success', isEditMode ? 'Reward updated.' : 'Reward created.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to save reward.');
    } finally {
      setSaving(false);
    }
  };

  // ── Admin tab navigation ──────────────────────────────────────────────────
  const handleAdminTabPress = (tab) => {
    const routeMap = {
      Dashboard:  'AdminDashboard',
      Products:   'AdminProducts',
      Orders:     'AdminOrders',
      Rewards:    'AdminRewards',
      Promotions: 'AdminPromotions',
    };
    const target = routeMap[tab];
    if (target) navigation.navigate(target);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.cream} />

      {/* ── TopAppBar ── */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Add/Edit Reward</Text>
        <View style={styles.avatarCircle}>
          {user?.profileImageUrl ? (
            <Image source={{ uri: user.profileImageUrl }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarInitial}>
              {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
            </Text>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Editorial Title Section (node 13:821) ── */}
        <View style={styles.editorialSection}>
          {/* Breadcrumb */}
          <Text style={styles.breadcrumb}>Admin  ›  Rewards  ›  {isEditMode ? 'Edit' : 'Add'}</Text>

          {/* Large heading */}
          <Text style={styles.editorialHeading}>
            {isEditMode ? 'Edit Reward' : 'New Reward'}
          </Text>

          {/* Description */}
          <Text style={styles.editorialDesc}>
            {isEditMode
              ? 'Update the details of this loyalty reward below.'
              : 'Create a new loyalty reward that customers can redeem with their stars.'}
          </Text>

          {/* Quote card */}
          <View style={styles.quoteCard}>
            <Text style={styles.quoteIcon}>⭐</Text>
            <Text style={styles.quoteText}>
              "Great rewards keep customers coming back for more."
            </Text>
          </View>
        </View>

        {/* ── Form Bento Grid (node 13:831) ── */}

        {/* Main Details Card */}
        <View style={styles.bentoCard}>
          <Text style={styles.cardTitle}>Main Details</Text>

          {/* Reward Name */}
          <Text style={styles.fieldLabel}>Reward Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Free Latte"
            placeholderTextColor="#A0856E"
            value={rewardName}
            onChangeText={setRewardName}
            returnKeyType="next"
          />

          {/* Points Required */}
          <Text style={styles.fieldLabel}>Points Required</Text>
          <View style={styles.pointsRow}>
            <TextInput
              style={styles.pointsInput}
              placeholder="150"
              placeholderTextColor="#A0856E"
              value={pointsRequired}
              onChangeText={setPointsRequired}
              keyboardType="number-pad"
              returnKeyType="done"
            />
            <View style={styles.ptsSuffix}>
              <Text style={styles.ptsSuffixText}>pts</Text>
            </View>
          </View>

          {/* Availability Toggle */}
          <View style={styles.toggleRow}>
            <Text style={styles.fieldLabel}>Availability</Text>
            <View style={styles.toggleRight}>
              <Text style={styles.toggleLabel}>{isAvailable ? 'Available' : 'Unavailable'}</Text>
              <Switch
                value={isAvailable}
                onValueChange={setIsAvailable}
                trackColor={{ false: '#D0B8A8', true: colors.primary }}
                thumbColor={isAvailable ? colors.accent : '#f4f3f4'}
                ios_backgroundColor="#D0B8A8"
              />
            </View>
          </View>
        </View>

        {/* Description Card */}
        <View style={styles.bentoCard}>
          <Text style={styles.cardTitle}>Description</Text>
          <TextInput
            style={styles.textarea}
            placeholder="Describe what the customer receives when they redeem this reward..."
            placeholderTextColor="#A0856E"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Image Upload Card */}
        <View style={styles.bentoCard}>
          <Text style={styles.cardTitle}>Reward Image</Text>
          <TouchableOpacity style={styles.uploadZone} onPress={handlePickImage} activeOpacity={0.8}>
            {imageUri ? (
              <>
                <Image source={{ uri: imageUri }} style={styles.uploadPreview} />
                <View style={styles.uploadChangeOverlay}>
                  <Text style={styles.uploadChangeText}>Tap to change</Text>
                </View>
              </>
            ) : (
              <>
                <Text style={styles.uploadCloudIcon}>☁️</Text>
                <Text style={styles.uploadLabel}>Upload Image</Text>
                <Text style={styles.uploadHint}>JPEG or PNG, max 5 MB</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Action Bar */}
        <View style={styles.actionBar}>
          {/* Cancel ghost button */}
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
            disabled={saving}
          >
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>

          {/* Save Reward primary button */}
          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.btnDisabled]}
            onPress={handleSave}
            activeOpacity={0.85}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.saveBtnText}>
                {isEditMode ? 'Update Reward' : 'Save Reward'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={{ height: spacing.xl }} />
      </ScrollView>

      {/* ── Admin BottomNavBar ── */}
      <AdminBottomNavBar activeTab="Rewards" onTabPress={handleAdminTabPress} />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.cream },

  // TopAppBar
  topBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.cream,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(98,55,30,0.1)',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.pill,
    backgroundColor: 'rgba(98,55,30,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: { fontSize: 20, color: colors.primary, fontFamily: fonts.bold },
  topBarTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: fonts.bold,
    fontSize: fontSizes.base,
    color: colors.dark,
    letterSpacing: 0.5,
  },
  avatarCircle: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  avatarImage: { width: 36, height: 36, borderRadius: 18 },
  avatarInitial: { fontFamily: fonts.bold, fontSize: fontSizes.sm, color: '#fff' },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },

  // Editorial Section
  editorialSection: { marginBottom: spacing.lg },
  breadcrumb: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    color: '#A0856E',
    letterSpacing: 0.3,
    marginBottom: spacing.xs,
  },
  editorialHeading: {
    fontFamily: fonts.extraBold,
    fontSize: fontSizes['3xl'],
    color: colors.dark,
    marginBottom: spacing.xs,
  },
  editorialDesc: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    color: '#6B5E57',
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  quoteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: borderRadius.card,
    padding: spacing.md,
    gap: spacing.sm,
  },
  quoteIcon: { fontSize: 20 },
  quoteText: {
    flex: 1,
    fontFamily: fonts.light,
    fontSize: fontSizes.sm,
    color: colors.dark,
    fontStyle: 'italic',
    lineHeight: 18,
  },

  // Bento Card
  bentoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.cardLg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    shadowColor: colors.dark,
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardTitle: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.base,
    color: colors.dark,
    marginBottom: spacing.md,
  },

  // Field Label
  fieldLabel: {
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.sm,
    color: colors.dark,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },

  // Text Input
  input: {
    height: 52,
    backgroundColor: colors.cream,
    borderRadius: borderRadius.input,
    borderWidth: 1,
    borderColor: 'rgba(98,55,30,0.2)',
    paddingHorizontal: spacing.md,
    fontFamily: fonts.regular,
    fontSize: fontSizes.md,
    color: colors.dark,
  },

  // Points Row
  pointsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cream,
    borderRadius: borderRadius.input,
    borderWidth: 1,
    borderColor: 'rgba(98,55,30,0.2)',
    overflow: 'hidden',
    height: 52,
  },
  pointsInput: {
    flex: 1,
    paddingHorizontal: spacing.md,
    fontFamily: fonts.regular,
    fontSize: fontSizes.md,
    color: colors.dark,
  },
  ptsSuffix: {
    width: 52,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(98,55,30,0.15)',
  },
  ptsSuffixText: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.sm,
    color: colors.primary,
  },

  // Availability Toggle
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  toggleRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  toggleLabel: {
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.sm,
    color: colors.dark,
  },

  // Textarea
  textarea: {
    minHeight: 100,
    backgroundColor: colors.cream,
    borderRadius: borderRadius.input,
    borderWidth: 1,
    borderColor: 'rgba(98,55,30,0.2)',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm + 4,
    fontFamily: fonts.regular,
    fontSize: fontSizes.md,
    color: colors.dark,
    lineHeight: 22,
  },

  // Image Upload Zone
  uploadZone: {
    height: 140,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(98,55,30,0.3)',
    borderRadius: borderRadius.card,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cream,
    overflow: 'hidden',
  },
  uploadCloudIcon: { fontSize: 32, marginBottom: spacing.xs },
  uploadLabel: {
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.md,
    color: colors.primary,
    marginBottom: 2,
  },
  uploadHint: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    color: '#A0856E',
  },
  uploadPreview: { width: '100%', height: '100%', resizeMode: 'cover' },
  uploadChangeOverlay: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(46,21,0,0.5)',
    paddingVertical: spacing.xs,
    alignItems: 'center',
  },
  uploadChangeText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.xs,
    color: '#fff',
  },

  // Action Bar
  actionBar: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  cancelBtn: {
    flex: 1,
    height: 52,
    borderRadius: borderRadius.pill,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  cancelBtnText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.base,
    color: colors.primary,
  },
  saveBtn: {
    flex: 2,
    height: 52,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.dark,
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  saveBtnText: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.base,
    color: '#fff',
    letterSpacing: 0.5,
  },
  btnDisabled: { opacity: 0.6 },
});
