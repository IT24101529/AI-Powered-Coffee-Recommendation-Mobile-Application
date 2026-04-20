// components/context/LocationPickerModal.js
// ─────────────────────────────────────────────────────────────
// Full-screen modal for searching and selecting a city.
// Opens when user taps "Change Location" on WeatherContextBadge.
// Owner: Ranasinghe R.M.N.K. (IT24101529)
// ─────────────────────────────────────────────────────────────

import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Modal,
  ActivityIndicator, StyleSheet, FlatList,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import API_URLS from '../../../config/api';
import { COLORS, FONTS, SPACING, RADIUS } from '../theme';

// Quick-select cities for Sri Lanka
const QUICK_CITIES = [
  'Kandy,LK', 'Colombo,LK', 'Galle,LK',
  'Jaffna,LK', 'Nuwara Eliya,LK', 'Matara,LK',
];

// ─────────────────────────────────────────────────────────────
// Component
// Props:
//   visible           (bool)    — controls modal visibility
//   currentLocation   (string)  — currently active location
//   onConfirm         (fn)      — called with chosen location string
//   onClose           (fn)      — closes the modal
// ─────────────────────────────────────────────────────────────
export default function LocationPickerModal({
  visible,
  currentLocation,
  onConfirm,
  onClose,
}) {
  const [searchText, setSearchText]       = useState('');
  const [preview, setPreview]             = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError]   = useState(null);

  // ── Preview weather for a city before committing ───────────
  const previewCity = async (city) => {
    if (!city.trim()) return;
    setPreviewLoading(true);
    setPreviewError(null);
    setPreview(null);
    try {
      const res = await axios.get(`${API_URLS.CONTEXT_API}/context/weather`, {
        params: { location: city },
        timeout: 6000,
      });
      setPreview(res.data);
    } catch (err) {
      if (err.response?.status === 404) {
        setPreviewError(`"${city}" not found. Use format: CityName,LK`);
      } else {
        setPreviewError('Could not fetch weather. Check your connection.');
      }
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleConfirm = () => {
    const loc = searchText.trim() || currentLocation;
    onConfirm(loc);
    onClose();
  };

  const handleQuickSelect = (city) => {
    setSearchText(city);
    previewCity(city);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {/* ── Header ─────────────────────────────────────── */}
          <View style={styles.header}>
            <Text style={styles.title}>📍  Choose Location</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>
            Current: <Text style={styles.currentLoc}>{currentLocation}</Text>
          </Text>

          {/* ── Search input ────────────────────────────────── */}
          <View style={styles.searchRow}>
            <TextInput
              style={styles.input}
              placeholder="e.g. Colombo,LK or Kandy,LK"
              placeholderTextColor={COLORS.textLight}
              value={searchText}
              onChangeText={setSearchText}
              autoCapitalize="words"
              returnKeyType="search"
              onSubmitEditing={() => previewCity(searchText)}
            />
            <TouchableOpacity
              style={styles.searchBtn}
              onPress={() => previewCity(searchText)}
            >
              <Text style={styles.searchBtnText}>Preview</Text>
            </TouchableOpacity>
          </View>

          {/* ── Quick city chips ─────────────────────────────── */}
          <Text style={styles.sectionLabel}>Quick Select</Text>
          <FlatList
            horizontal
            data={QUICK_CITIES}
            keyExtractor={item => item}
            showsHorizontalScrollIndicator={false}
            style={styles.chipList}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.chip,
                  item === currentLocation && styles.chipActive,
                ]}
                onPress={() => handleQuickSelect(item)}
              >
                <Text style={[
                  styles.chipText,
                  item === currentLocation && styles.chipTextActive,
                ]}>
                  {item.split(',')[0]}
                </Text>
              </TouchableOpacity>
            )}
          />

          {/* ── Weather preview ──────────────────────────────── */}
          {previewLoading && (
            <ActivityIndicator
              color={COLORS.primary}
              style={{ marginTop: SPACING.xl }}
            />
          )}
          {previewError && (
            <Text style={styles.errorText}>{previewError}</Text>
          )}
          {preview && !previewLoading && (
            <View style={styles.previewCard}>
              <Text style={styles.previewTitle}>Weather Preview</Text>
              <Text style={styles.previewRow}>
                🌡️  {preview.temperature_celsius?.toFixed(1)}°C
                · {preview.temp_tag}
              </Text>
              <Text style={styles.previewRow}>
                🌤️  {preview.raw_description || preview.raw_condition}
              </Text>
              <Text style={styles.previewRow}>
                📍  {preview.location}
              </Text>
            </View>
          )}

          {/* ── Confirm button ───────────────────────────────── */}
          <TouchableOpacity
            style={styles.confirmBtn}
            onPress={handleConfirm}
          >
            <Text style={styles.confirmBtnText}>✓  Use This Location</Text>
          </TouchableOpacity>

        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

// ── Styles ────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    padding: SPACING.lg,
  },
  header: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    marginBottom:   SPACING.xs,
    marginTop:      SPACING.sm,
  },
  title: {
    fontSize:   20,
    color:      COLORS.text,
    fontFamily: FONTS.bold,
  },
  closeBtn: {
    padding: SPACING.sm,
  },
  closeBtnText: {
    fontSize:   18,
    color:      COLORS.error,
    fontFamily: FONTS.semiBold,
  },
  subtitle: {
    fontSize:     13,
    color:        COLORS.textLight,
    fontFamily:   FONTS.regular,
    marginBottom: SPACING.lg,
  },
  currentLoc: {
    color:      COLORS.primary,
    fontFamily: FONTS.semiBold,
  },
  searchRow: {
    flexDirection: 'row',
    marginBottom:  SPACING.md,
  },
  input: {
    flex:             1,
    borderWidth:      1,
    borderColor:      COLORS.border,
    borderRadius:     RADIUS.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical:  SPACING.sm,
    backgroundColor:  COLORS.surface,
    fontSize:         14,
    color:            COLORS.text,
    fontFamily:       FONTS.regular,
  },
  searchBtn: {
    backgroundColor:  COLORS.primary,
    borderRadius:     RADIUS.sm,
    paddingHorizontal: SPACING.md,
    justifyContent:   'center',
    marginLeft:       SPACING.sm,
  },
  searchBtnText: {
    color:      COLORS.surface,
    fontFamily: FONTS.semiBold,
    fontSize:   14,
  },
  sectionLabel: {
    fontSize:     13,
    color:        COLORS.textLight,
    fontFamily:   FONTS.semiBold,
    marginBottom: SPACING.sm,
  },
  chipList: {
    maxHeight:    44,
    marginBottom: SPACING.md,
  },
  chip: {
    backgroundColor:  COLORS.primaryLight,
    borderRadius:     RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical:  SPACING.xs,
    marginRight:      SPACING.sm,
    borderWidth:      1,
    borderColor:      COLORS.border,
    justifyContent:   'center',
  },
  chipActive: {
    backgroundColor: COLORS.primary,
    borderColor:     COLORS.primary,
  },
  chipText: {
    fontSize:   13,
    color:      COLORS.text,
    fontFamily: FONTS.regular,
  },
  chipTextActive: {
    color:      COLORS.surface,
    fontFamily: FONTS.semiBold,
  },
  errorText: {
    color:      COLORS.error,
    fontSize:   13,
    fontFamily: FONTS.regular,
    marginTop:  SPACING.sm,
  },
  previewCard: {
    backgroundColor: COLORS.primaryLight,
    borderRadius:    RADIUS.md,
    padding:         SPACING.md,
    marginTop:       SPACING.md,
  },
  previewTitle: {
    fontSize:     14,
    color:        COLORS.text,
    fontFamily:   FONTS.semiBold,
    marginBottom: SPACING.sm,
  },
  previewRow: {
    fontSize:    13,
    color:       COLORS.text,
    fontFamily:  FONTS.regular,
    marginBottom: SPACING.xs,
  },
  confirmBtn: {
    position:        'absolute',
    bottom:          SPACING.xl,
    left:            SPACING.lg,
    right:           SPACING.lg,
    backgroundColor: COLORS.primary,
    borderRadius:    RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems:      'center',
  },
  confirmBtnText: {
    color:      COLORS.surface,
    fontSize:   16,
    fontFamily: FONTS.bold,
  },
});
