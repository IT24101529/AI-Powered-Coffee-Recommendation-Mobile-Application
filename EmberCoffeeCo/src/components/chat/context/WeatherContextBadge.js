// components/context/WeatherContextBadge.js
// ─────────────────────────────────────────────────────────────
// Displays live weather context as a card inside the chat.
// Wijerathna renders this as a bot message on session start.
// Owner: Ranasinghe R.M.N.K. (IT24101529)
// ─────────────────────────────────────────────────────────────

import React from 'react';
import {
  View, Text, TouchableOpacity,
  ActivityIndicator, StyleSheet,
} from 'react-native';
import { COLORS, FONTS, SPACING, RADIUS } from '../theme';

// ── Condition → emoji mapping ─────────────────────────────────
const WEATHER_ICONS = {
  Sunny:  '☀️',
  Rainy:  '🌧️',
  Cloudy: '☁️',
  Stormy: '⛈️',
};

// ── Temperature → accent colour mapping ───────────────────────
const TEMP_COLORS = {
  Hot:  '#E74C3C',
  Warm: '#C67C4E',
  Cool: '#2980B9',
  Cold: '#1A5276',
};

// ── Time of day → greeting ────────────────────────────────────
const TIME_GREETINGS = {
  Morning:    'Good morning! ☕',
  Afternoon:  'Good afternoon! 🌤️',
  Evening:    'Good evening! 🌙',
  Night:      'Good night! 🌟',
  'Late Night': 'Up late? 🌙',
};

// ─────────────────────────────────────────────────────────────
// Component
// Props:
//   location      (string)   — e.g. 'Kandy,LK'
//   contextData   (object)   — latest context payload from hook
//   loading       (bool)     — loading flag from hook
//   error         (string)   — error message from hook
//   onRetry       (fn)       — retry current fetch
//   onLocationPress (fn)     — opens LocationPickerModal
//   onOverridePress (fn)     — opens ContextOverridePanel
// ─────────────────────────────────────────────────────────────
export default function WeatherContextBadge({
  location,
  contextData,
  loading,
  error,
  onRetry,
  onLocationPress,
  onOverridePress,
<<<<<<< HEAD
  onResetPress,
=======
>>>>>>> b3b40c1cbab73a4be9054ae12b0b384e3224533b
}) {
  // ── Loading state ──────────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.card}>
        <ActivityIndicator size="small" color={COLORS.primary} />
        <Text style={styles.loadingText}>
          Checking weather in {location}…
        </Text>
      </View>
    );
  }

  // ── Error state ────────────────────────────────────────────
  if (error) {
    return (
      <View style={[styles.card, styles.errorCard]}>
        <Text style={styles.errorText}>⚠️  {error}</Text>
        <TouchableOpacity onPress={onRetry} style={styles.retryBtn}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!contextData) return null;

  const isNightWindow = contextData.time_of_day === 'Night'
    || contextData.time_of_day === 'Late Night';
  const displayCondition = contextData.condition_display
    || ((isNightWindow && contextData.condition === 'Sunny') ? 'Clear Night' : contextData.condition);

  const icon = displayCondition === 'Clear Night'
    ? '🌙'
    : (WEATHER_ICONS[contextData.condition] || '🌤️');
  const tempColor = TEMP_COLORS[contextData.weather]     || COLORS.primary;
  const greeting  = TIME_GREETINGS[contextData.time_of_day] || 'Hello!';

  // ── Main render ────────────────────────────────────────────
  return (
    <View style={styles.card}>

      {/* Override indicator */}
      {contextData.is_override && (
        <View style={styles.overrideBadge}>
          <Text style={styles.overrideBadgeText}>🔧  Simulated Weather</Text>
        </View>
      )}

      {/* Greeting */}
      <Text style={styles.greeting}>{greeting}</Text>

      {/* Weather row */}
      <View style={styles.row}>
        <Text style={styles.icon}>{icon}</Text>
        <View style={styles.details}>
          <Text style={[styles.conditionText, { color: tempColor }]}>
            {displayCondition} · {contextData.weather}
            {contextData.temperature_celsius
              ? `  ${contextData.temperature_celsius.toFixed(1)}°C`
              : ''}
          </Text>
          <Text style={styles.subText}>🕐  {contextData.time_of_day}</Text>
          {contextData.location && contextData.location !== 'Override' && (
            <Text style={styles.subText}>📍  {contextData.location}</Text>
          )}
        </View>
      </View>

      {/* Recommendation hint */}
      {contextData.recommended_type && (
        <View style={styles.hintBox}>
          <Text style={styles.hintIcon}>💡</Text>
          <Text style={styles.hintText}>{contextData.recommended_type}</Text>
        </View>
      )}

      {/* Action buttons */}
      <View style={styles.btnRow}>
        <TouchableOpacity style={styles.btn} onPress={onLocationPress}>
          <Text style={styles.btnText}>📍  Change Location</Text>
        </TouchableOpacity>
<<<<<<< HEAD

        {contextData?.is_override ? (
          <TouchableOpacity 
            style={[styles.btn, { backgroundColor: COLORS.warning }]} 
            onPress={onResetPress}
          >
            <Text style={styles.btnText}>🔄  Reset Live</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.btn} onPress={onOverridePress}>
            <Text style={styles.btnText}>🔧  Simulate</Text>
          </TouchableOpacity>
        )}
=======
        <TouchableOpacity style={styles.btn} onPress={onOverridePress}>
          <Text style={styles.btnText}>🔧  Simulate</Text>
        </TouchableOpacity>
>>>>>>> b3b40c1cbab73a4be9054ae12b0b384e3224533b
      </View>

    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────
const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius:    RADIUS.md,
    padding:         SPACING.lg,
    marginVertical:  SPACING.sm,
    borderWidth:     1,
    borderColor:     COLORS.border,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    shadowColor:     '#000',
    shadowOpacity:   0.06,
    shadowRadius:    6,
    elevation:       2,
  },
  errorCard: {
    borderLeftColor: COLORS.error,
  },
  overrideBadge: {
    backgroundColor:  COLORS.warning + '22',
    borderRadius:     RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical:  SPACING.xs,
    alignSelf:        'flex-start',
    marginBottom:     SPACING.sm,
    borderWidth:      1,
    borderColor:      COLORS.warning,
  },
  overrideBadgeText: {
    fontSize:   11,
    color:      COLORS.warning,
    fontFamily: FONTS.semiBold,
  },
  greeting: {
    fontSize:    14,
    color:       COLORS.text,
    fontFamily:  FONTS.semiBold,
    marginBottom: SPACING.sm,
  },
  row: {
    flexDirection:  'row',
    alignItems:     'flex-start',
    marginBottom:   SPACING.sm,
  },
  icon: {
    fontSize:    28,
    marginRight: SPACING.sm,
  },
  details: {
    flex: 1,
  },
  conditionText: {
    fontSize:   16,
    fontFamily: FONTS.bold,
  },
  subText: {
    fontSize:   13,
    color:      COLORS.textLight,
    marginTop:  SPACING.xs,
    fontFamily: FONTS.regular,
  },
  hintBox: {
    flexDirection:   'row',
    alignItems:      'center',
    backgroundColor: COLORS.primaryLight,
    borderRadius:    RADIUS.sm,
    padding:         SPACING.sm,
    marginBottom:    SPACING.sm,
  },
  hintIcon: {
    fontSize:    14,
    marginRight: SPACING.xs,
  },
  hintText: {
    fontSize:   13,
    color:      COLORS.text,
    fontFamily: FONTS.regular,
    flex:       1,
  },
  btnRow: {
    flexDirection:     'row',
    justifyContent:    'space-between',
  },
  btn: {
    flex:             0.48,
    backgroundColor:  COLORS.primary,
    borderRadius:     RADIUS.sm,
    paddingVertical:  SPACING.sm,
    alignItems:       'center',
  },
  btnText: {
    color:      COLORS.surface,
    fontSize:   12,
    fontFamily: FONTS.semiBold,
  },
  loadingText: {
    color:       COLORS.textLight,
    fontSize:    13,
    marginTop:   SPACING.sm,
    fontFamily:  FONTS.regular,
  },
  errorText: {
    color:      COLORS.error,
    fontSize:   13,
    fontFamily: FONTS.regular,
    marginBottom: SPACING.sm,
  },
  retryBtn: {
    backgroundColor: COLORS.error,
    borderRadius:    RADIUS.sm,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    alignSelf:       'flex-start',
  },
  retryText: {
    color:      COLORS.surface,
    fontSize:   12,
    fontFamily: FONTS.semiBold,
  },
});
