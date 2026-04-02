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

// ─── Live Preview Card ────────────────────────────────────────────────────────
function LivePreviewCard({ bannerUri, promoCode, discountPercent }) {
  return (
    <View style={previewStyles.card}>
      {bannerUri ? (
        <Image source={{ uri: bannerUri }} style={previewStyles.bg} />
      ) : (
        <View style={[previewStyles.bg, previewStyles.bgPlaceholder]}>
          <Text style={previewStyles.bgIcon}>☕</Text>
        </View>
      )}
      {/* Gradient overlay */}
      <View style={previewStyles.gradient} />
      {/* Content */}
      <View style={previewStyles.content}>
        <View style={previewStyles.liveLabel}>
          <View style={previewStyles.liveDot} />
          <Text style={previewStyles.liveLabelText}>Live Preview</Text>
        </View>
        <Text style={previewStyles.headline}>
          {discountPercent ? `${discountPercent}% Off Your Order` : 'Your Promo Headline'}
        </Text>
        <Text style={previewStyles.desc}>
          Use this exclusive code at checkout to unlock your discount.
        </Text>
        {promoCode ? (
          <View style={previewStyles.codeBadge}>
            <Text style={previewStyles.codeText}>{promoCode.toUpperCase()}</Text>
          </View>
        ) : (
          <View style={[previewStyles.codeBadge, previewStyles.codeBadgePlaceholder]}>
            <Text style={[previewStyles.codeText, previewStyles.codeTextPlaceholder]}>PROMO CODE</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const previewStyles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.cardLg,
    overflow: 'hidden',
    height: 220,
    backgroundColor: colors.accent,
  },
  bg: { position: 'absolute', width: '100%', height: '100%', resizeMode: 'cover' },
  bgPlaceholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#D4A882' },
  bgIcon: { fontSize: 56 },
  gradient: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(46,21,0,0.6)',
  },
  content: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    padding: spacing.md,
  },
  liveLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
    gap: 6,
  },
  liveDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: '#4CAF50',
  },
  liveLabelText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.xs,
    color: 'rgba(255,255,255,0.85)',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  headline: {
    fontFamily: fonts.extraBold,
    fontSize: fontSizes.xl,
    color: '#fff',
    marginBottom: 4,
  },
  desc: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: spacing.sm,
    lineHeight: 18,
  },
  codeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.accent,
    borderRadius: borderRadius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
  },
  codeBadgePlaceholder: { backgroundColor: 'rgba(255,255,255,0.2)' },
  codeText: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.sm,
    color: colors.primary,
    letterSpacing: 2,
  },
  codeTextPlaceholder: { color: 'rgba(255,255,255,0.6)' },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function AdminAddPromoScreen({ navigation, route }) {
  const { user, token } = useAuth();
  const editPromo = route?.params?.promo ?? null;
  const isEditMode = !!editPromo;

  // Form state
  const [promoCode, setPromoCode]           = useState(editPromo?.promoCode ?? '');
  const [discountPercent, setDiscountPercent] = useState(
    editPromo?.discountPercent ? String(editPromo.discountPercent) : ''
  );
  const [expiryDate, setExpiryDate]         = useState(
    editPromo?.validUntil ? editPromo.validUntil.split('T')[0] : ''
  );
  const [showOnHome, setShowOnHome]         = useState(true);
  const [applyAtCheckout, setApplyAtCheckout] = useState(true);
  const [bannerUri, setBannerUri]           = useState(editPromo?.promoBannerUrl ?? null);
  const [bannerFile, setBannerFile]         = useState(null);
  const [saving, setSaving]                 = useState(false);

  const authHeader = { headers: { Authorization: `Bearer ${token}` } };

  // ── Image Picker ─────────────────────────────────────────────────────────
  const handlePickBanner = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please allow access to your photo library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.length > 0) {
      const asset = result.assets[0];
      setBannerUri(asset.uri);
      setBannerFile(asset);
    }
  };

  // ── Upload banner ─────────────────────────────────────────────────────────
  const uploadBanner = async (promoId) => {
    if (!bannerFile) return;
    const formData = new FormData();
    const filename = bannerFile.uri.split('/').pop();
    const ext = filename.split('.').pop()?.toLowerCase() ?? 'jpg';
    const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';
    formData.append('image', { uri: bannerFile.uri, name: filename, type: mimeType });
    await axios.post(
      `${BASE_URL}/api/promotions/${promoId}/upload`,
      formData,
      { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } }
    );
  };

  // ── Validate ──────────────────────────────────────────────────────────────
  const validate = () => {
    if (!promoCode.trim()) {
      Alert.alert('Validation', 'Promo code is required.');
      return false;
    }
    const pct = parseInt(discountPercent, 10);
    if (!discountPercent || isNaN(pct) || pct < 1 || pct > 100) {
      Alert.alert('Validation', 'Discount must be between 1 and 100.');
      return false;
    }
    if (!expiryDate.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(expiryDate.trim())) {
      Alert.alert('Validation', 'Please enter a valid expiry date (YYYY-MM-DD).');
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
        promoCode: promoCode.trim().toUpperCase(),
        discountPercent: parseInt(discountPercent, 10),
        validUntil: expiryDate.trim(),
      };

      let savedPromo;
      if (isEditMode) {
        const res = await axios.put(`${BASE_URL}/api/promotions/${editPromo._id}`, payload, authHeader);
        savedPromo = res.data;
      } else {
        const res = await axios.post(`${BASE_URL}/api/promotions`, payload, authHeader);
        savedPromo = res.data;
      }

      if (bannerFile) {
        await uploadBanner(savedPromo._id);
      }

      Alert.alert('Success', isEditMode ? 'Promotion updated.' : 'Promotion created.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to save promotion.');
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

      {/* ── TopAppBar (node 13:1107) ── */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.menuBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Edit Promotion</Text>
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
        {/* ── Hero Section (node 13:1116) ── */}
        <View style={styles.heroSection}>
          <Text style={styles.breadcrumb}>Admin  ›  Promotions  ›  {isEditMode ? 'Edit' : 'New'}</Text>
          <Text style={styles.heroHeading}>
            {isEditMode ? 'Edit Promotion' : 'New Promotion'}
          </Text>
          <Text style={styles.heroDesc}>
            {isEditMode
              ? 'Update your campaign details and preview how it will appear to customers.'
              : 'Create a new promotional campaign with a discount code and banner.'}
          </Text>
          <View style={styles.heroActions}>
            <TouchableOpacity style={styles.previewBtn} activeOpacity={0.8}>
              <Text style={styles.previewBtnText}>👁  Preview</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveHeroBtn, saving && styles.btnDisabled]}
              onPress={handleSave}
              activeOpacity={0.85}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.saveHeroBtnText}>💾  Save</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Asymmetric Form Layout (node 13:1130) ── */}

        {/* Fields Card */}
        <View style={styles.bentoCard}>
          <Text style={styles.cardTitle}>Campaign Details</Text>

          {/* Promo Code with tag icon */}
          <Text style={styles.fieldLabel}>Promo Code</Text>
          <View style={styles.iconInputRow}>
            <View style={styles.inputIconBox}>
              <Text style={styles.inputIcon}>🏷️</Text>
            </View>
            <TextInput
              style={styles.iconInput}
              placeholder="e.g. EMBER20"
              placeholderTextColor="#A0856E"
              value={promoCode}
              onChangeText={(v) => setPromoCode(v.toUpperCase())}
              autoCapitalize="characters"
              returnKeyType="next"
            />
          </View>

          {/* Discount % with suffix */}
          <Text style={styles.fieldLabel}>Discount %</Text>
          <View style={styles.suffixInputRow}>
            <TextInput
              style={styles.suffixInput}
              placeholder="20"
              placeholderTextColor="#A0856E"
              value={discountPercent}
              onChangeText={setDiscountPercent}
              keyboardType="number-pad"
              returnKeyType="next"
            />
            <View style={styles.suffixBox}>
              <Text style={styles.suffixText}>%</Text>
            </View>
          </View>

          {/* Expiry Date with calendar icon */}
          <Text style={styles.fieldLabel}>Expiry Date</Text>
          <View style={styles.iconInputRow}>
            <View style={styles.inputIconBox}>
              <Text style={styles.inputIcon}>📅</Text>
            </View>
            <TextInput
              style={styles.iconInput}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#A0856E"
              value={expiryDate}
              onChangeText={setExpiryDate}
              keyboardType="numbers-and-punctuation"
              returnKeyType="done"
              maxLength={10}
            />
          </View>
        </View>

        {/* Live Preview Card */}
        <View style={styles.bentoCard}>
          <Text style={styles.cardTitle}>Live Preview</Text>
          <LivePreviewCard
            bannerUri={bannerUri}
            promoCode={promoCode}
            discountPercent={discountPercent}
          />
        </View>

        {/* Banner Upload Area */}
        <View style={styles.bentoCard}>
          <Text style={styles.cardTitle}>Promotion Banner</Text>
          <TouchableOpacity style={styles.uploadZone} onPress={handlePickBanner} activeOpacity={0.8}>
            {bannerUri ? (
              <>
                <Image source={{ uri: bannerUri }} style={styles.uploadPreview} />
                <View style={styles.uploadChangeOverlay}>
                  <Text style={styles.uploadChangeText}>Tap to change</Text>
                </View>
              </>
            ) : (
              <>
                <Text style={styles.uploadCloudIcon}>☁️</Text>
                <Text style={styles.uploadLabel}>Upload Banner</Text>
                <Text style={styles.uploadHint}>JPEG or PNG, max 5 MB · 16:9 recommended</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Uploaded file preview row */}
          {bannerFile && (
            <View style={styles.fileRow}>
              <Image source={{ uri: bannerUri }} style={styles.fileThumb} />
              <View style={styles.fileInfo}>
                <Text style={styles.fileName} numberOfLines={1}>
                  {bannerFile.uri.split('/').pop()}
                </Text>
                <Text style={styles.fileSize}>Ready to upload</Text>
              </View>
              <TouchableOpacity
                onPress={() => { setBannerUri(editPromo?.promoBannerUrl ?? null); setBannerFile(null); }}
                activeOpacity={0.7}
              >
                <Text style={styles.fileRemove}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Visibility Settings */}
        <View style={styles.bentoCard}>
          <Text style={styles.cardTitle}>Visibility Settings</Text>

          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Text style={styles.toggleTitle}>Show on Home Screen</Text>
              <Text style={styles.toggleDesc}>Display this promotion in the home feed</Text>
            </View>
            <Switch
              value={showOnHome}
              onValueChange={setShowOnHome}
              trackColor={{ false: '#D0B8A8', true: colors.primary }}
              thumbColor={showOnHome ? colors.accent : '#f4f3f4'}
              ios_backgroundColor="#D0B8A8"
            />
          </View>

          <View style={[styles.toggleRow, { marginTop: spacing.md }]}>
            <View style={styles.toggleInfo}>
              <Text style={styles.toggleTitle}>Apply at Checkout</Text>
              <Text style={styles.toggleDesc}>Allow customers to use this code at checkout</Text>
            </View>
            <Switch
              value={applyAtCheckout}
              onValueChange={setApplyAtCheckout}
              trackColor={{ false: '#D0B8A8', true: colors.primary }}
              thumbColor={applyAtCheckout ? colors.accent : '#f4f3f4'}
              ios_backgroundColor="#D0B8A8"
            />
          </View>
        </View>

        {/* Bottom Action Bar */}
        <View style={styles.actionBar}>
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
            disabled={saving}
          >
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
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
                {isEditMode ? 'Update Promotion' : 'Save Promotion'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={{ height: spacing.xl }} />
      </ScrollView>

      {/* ── Admin BottomNavBar (node 13:1081) ── */}
      <AdminBottomNavBar activeTab="Promotions" onTabPress={handleAdminTabPress} />
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
  menuBtn: {
    width: 36, height: 36,
    borderRadius: borderRadius.pill,
    backgroundColor: 'rgba(98,55,30,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  menuIcon: { fontSize: 18, color: colors.primary },
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

  // Hero Section
  heroSection: { marginBottom: spacing.lg },
  breadcrumb: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    color: '#A0856E',
    letterSpacing: 0.3,
    marginBottom: spacing.xs,
  },
  heroHeading: {
    fontFamily: fonts.extraBold,
    fontSize: fontSizes['3xl'],
    color: colors.dark,
    marginBottom: spacing.xs,
  },
  heroDesc: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    color: '#6B5E57',
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  heroActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  previewBtn: {
    flex: 1,
    height: 44,
    borderRadius: borderRadius.pill,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  previewBtnText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.sm,
    color: colors.primary,
  },
  saveHeroBtn: {
    flex: 1,
    height: 44,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.dark,
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  saveHeroBtnText: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.sm,
    color: '#fff',
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
  fieldLabel: {
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.sm,
    color: colors.dark,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },

  // Icon Input Row (tag icon + text input)
  iconInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cream,
    borderRadius: borderRadius.input,
    borderWidth: 1,
    borderColor: 'rgba(98,55,30,0.2)',
    overflow: 'hidden',
    height: 52,
  },
  inputIconBox: {
    width: 48,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
    borderRightWidth: 1,
    borderRightColor: 'rgba(98,55,30,0.15)',
  },
  inputIcon: { fontSize: 18 },
  iconInput: {
    flex: 1,
    paddingHorizontal: spacing.md,
    fontFamily: fonts.regular,
    fontSize: fontSizes.md,
    color: colors.dark,
  },

  // Suffix Input Row (number + % suffix)
  suffixInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cream,
    borderRadius: borderRadius.input,
    borderWidth: 1,
    borderColor: 'rgba(98,55,30,0.2)',
    overflow: 'hidden',
    height: 52,
  },
  suffixInput: {
    flex: 1,
    paddingHorizontal: spacing.md,
    fontFamily: fonts.regular,
    fontSize: fontSizes.md,
    color: colors.dark,
  },
  suffixBox: {
    width: 48,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(98,55,30,0.15)',
  },
  suffixText: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.base,
    color: colors.primary,
  },

  // Upload Zone
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
    textAlign: 'center',
    paddingHorizontal: spacing.md,
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

  // Uploaded file preview row
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    backgroundColor: colors.cream,
    borderRadius: borderRadius.input,
    padding: spacing.sm,
    gap: spacing.sm,
  },
  fileThumb: {
    width: 48, height: 48,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  fileInfo: { flex: 1 },
  fileName: {
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.sm,
    color: colors.dark,
  },
  fileSize: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    color: '#A0856E',
    marginTop: 2,
  },
  fileRemove: {
    fontSize: 16,
    color: '#c62828',
    paddingHorizontal: spacing.xs,
  },

  // Visibility Toggles
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleInfo: { flex: 1, marginRight: spacing.md },
  toggleTitle: {
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.sm,
    color: colors.dark,
  },
  toggleDesc: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    color: '#A0856E',
    marginTop: 2,
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
