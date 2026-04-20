// components/context/ContextOverridePanel.js
// ─────────────────────────────────────────────────────────────
// Manual weather simulation panel — implements FR3.5
// Opens as a bottom sheet when user taps "Simulate" on badge.
// Owner: Ranasinghe R.M.N.K. (IT24101529)
// ─────────────────────────────────────────────────────────────

import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, Modal,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { COLORS, FONTS, SPACING, RADIUS } from '../theme';

// Available conditions to simulate
const CONDITIONS = ['Clear', 'Clouds', 'Rain', 'Thunderstorm'];

// Condition → display label + emoji
const CONDITION_DISPLAY = {
  Clear:        { label: 'Sunny',   emoji: '☀️' },
  Clouds:       { label: 'Cloudy',  emoji: '☁️' },
  Rain:         { label: 'Rainy',   emoji: '🌧️' },
  Thunderstorm: { label: 'Stormy',  emoji: '⛈️' },
};

// Temperature → tag + colour + tip
function getTempMeta(temp) {
  if (temp >= 28) return {
    tag:   'Hot',
    color: '#E74C3C',
    tip:   '☀️  Iced drinks recommended',
  };
  if (temp >= 22) return {
    tag:   'Warm',
    color: COLORS.primary,
    tip:   '🌤️  Balanced drink options',
  };
  if (temp >= 15) return {
    tag:   'Cool',
    color: '#2980B9',
    tip:   '☁️  Warm drinks suggested',
  };
  return {
    tag:   'Cold',
    color: '#1A5276',
    tip:   '❄️  Hot rich drinks recommended',
  };
}

// ─────────────────────────────────────────────────────────────
// Component
// Props:
//   visible     (bool)   — controls panel visibility
//   sessionId   (string) — active session ID
//   onApply     (fn)     — async fn(temperature, condition)
//                          calls overrideContext from the hook
//   onClose     (fn)     — closes the panel
// ─────────────────────────────────────────────────────────────
export default function ContextOverridePanel({
  visible,
  sessionId,
  onApply,
  onClose,
}) {
  const [temperature, setTemperature] = useState(22.0);
  const [condition, setCondition]     = useState('Clouds');
  const [applying, setApplying]       = useState(false);
  const [error, setError]             = useState(null);

  const meta = getTempMeta(temperature);

  const handleApply = async () => {
    setApplying(true);
    setError(null);
    try {
      await onApply(temperature, condition);
      onClose();
    } catch (err) {
      setError('Override failed. Make sure your context backend is running.');
    } finally {
      setApplying(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.panel}>

          {/* ── Handle bar ──────────────────────────────────── */}
          <View style={styles.handle} />

          {/* ── Title ───────────────────────────────────────── */}
          <Text style={styles.title}>🔧  Simulate Weather</Text>
          <Text style={styles.subtitle}>
            Manually set weather context for this session (FR3.5)
          </Text>

          {/* ── Temperature slider ──────────────────────────── */}
          <Text style={styles.label}>Temperature</Text>
          <View style={styles.tempRow}>
            <Text style={[styles.tempValue, { color: meta.color }]}>
              {temperature.toFixed(1)}°C
            </Text>
            <View style={[styles.tagPill, { backgroundColor: meta.color + '22', borderColor: meta.color }]}>
              <Text style={[styles.tagPillText, { color: meta.color }]}>
                {meta.tag}
              </Text>
            </View>
          </View>

          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={45}
            step={0.5}
            value={temperature}
            onValueChange={setTemperature}
            minimumTrackTintColor={meta.color}
            maximumTrackTintColor={COLORS.border}
            thumbTintColor={meta.color}
          />
          <View style={styles.sliderLabels}>
            <Text style={styles.sliderLabel}>0°C  Cold</Text>
            <Text style={styles.sliderLabel}>45°C  Hot</Text>
          </View>

          <Text style={styles.tip}>{meta.tip}</Text>

          {/* ── Condition selector ──────────────────────────── */}
          <Text style={[styles.label, { marginTop: SPACING.lg }]}>
            Weather Condition
          </Text>
          <View style={styles.conditionRow}>
            {CONDITIONS.map(c => {
              const isSelected = condition === c;
              const disp = CONDITION_DISPLAY[c];
              return (
                <TouchableOpacity
                  key={c}
                  style={[styles.condChip, isSelected && styles.condChipActive]}
                  onPress={() => setCondition(c)}
                >
                  <Text style={styles.condEmoji}>{disp.emoji}</Text>
                  <Text style={[
                    styles.condChipText,
                    isSelected && styles.condChipTextActive,
                  ]}>
                    {disp.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ── Error ───────────────────────────────────────── */}
          {error && <Text style={styles.error}>{error}</Text>}

          {/* ── Action buttons ──────────────────────────────── */}
          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.applyBtn, applying && styles.btnDisabled]}
              onPress={handleApply}
              disabled={applying}
            >
              {applying
                ? <ActivityIndicator size="small" color={COLORS.surface} />
                : <Text style={styles.applyBtnText}>✓  Apply Override</Text>
              }
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  );
}

// ── Styles ────────────────────────────────────────────────────
const styles = StyleSheet.create({
  overlay: {
    flex:            1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent:  'flex-end',
  },
  panel: {
    backgroundColor:     COLORS.background,
    borderTopLeftRadius:  20,
    borderTopRightRadius: 20,
    padding:             SPACING.xl,
    paddingBottom:       SPACING.xxl,
  },
  handle: {
    width:           40,
    height:          4,
    backgroundColor: COLORS.border,
    borderRadius:    RADIUS.full,
    alignSelf:       'center',
    marginBottom:    SPACING.lg,
  },
  title: {
    fontSize:     18,
    color:        COLORS.text,
    fontFamily:   FONTS.bold,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize:     13,
    color:        COLORS.textLight,
    fontFamily:   FONTS.regular,
    marginBottom: SPACING.lg,
  },
  label: {
    fontSize:     14,
    color:        COLORS.text,
    fontFamily:   FONTS.semiBold,
    marginBottom: SPACING.sm,
  },
  tempRow: {
    flexDirection: 'row',
    alignItems:    'center',
    marginBottom:  SPACING.xs,
  },
  tempValue: {
    fontSize:    24,
    fontFamily:  FONTS.bold,
    marginRight: SPACING.sm,
  },
  tagPill: {
    borderRadius:      RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical:   2,
    borderWidth:       1,
  },
  tagPillText: {
    fontSize:   12,
    fontFamily: FONTS.semiBold,
  },
  slider: {
    width:  '100%',
    height: 40,
  },
  sliderLabels: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    marginTop:      -SPACING.sm,
  },
  sliderLabel: {
    fontSize:   11,
    color:      COLORS.textLight,
    fontFamily: FONTS.regular,
  },
  tip: {
    fontSize:    13,
    color:       COLORS.primary,
    fontFamily:  FONTS.regular,
    fontStyle:   'italic',
    marginTop:   SPACING.xs,
    marginBottom: SPACING.sm,
  },
  conditionRow: {
    flexDirection:  'row',
    flexWrap:       'wrap',
    gap:            SPACING.sm,
    marginBottom:   SPACING.xl,
  },
  condChip: {
    flexDirection:     'row',
    alignItems:        'center',
    borderWidth:       1,
    borderColor:       COLORS.border,
    borderRadius:      RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical:   SPACING.sm,
    backgroundColor:   COLORS.surface,
  },
  condChipActive: {
    backgroundColor: COLORS.primary,
    borderColor:     COLORS.primary,
  },
  condEmoji: {
    fontSize:    16,
    marginRight: SPACING.xs,
  },
  condChipText: {
    color:      COLORS.text,
    fontSize:   13,
    fontFamily: FONTS.regular,
  },
  condChipTextActive: {
    color:      COLORS.surface,
    fontFamily: FONTS.semiBold,
  },
  error: {
    color:        COLORS.error,
    fontSize:     12,
    fontFamily:   FONTS.regular,
    marginBottom: SPACING.sm,
    textAlign:    'center',
  },
  btnRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
  },
  cancelBtn: {
    flex:            0.44,
    borderWidth:     1,
    borderColor:     COLORS.primary,
    borderRadius:    RADIUS.sm,
    paddingVertical: SPACING.md,
    alignItems:      'center',
  },
  cancelBtnText: {
    color:      COLORS.primary,
    fontFamily: FONTS.semiBold,
    fontSize:   14,
  },
  applyBtn: {
    flex:            0.52,
    backgroundColor: COLORS.primary,
    borderRadius:    RADIUS.sm,
    paddingVertical: SPACING.md,
    alignItems:      'center',
  },
  applyBtnText: {
    color:      COLORS.surface,
    fontFamily: FONTS.bold,
    fontSize:   15,
  },
  btnDisabled: {
    opacity: 0.5,
  },
});
