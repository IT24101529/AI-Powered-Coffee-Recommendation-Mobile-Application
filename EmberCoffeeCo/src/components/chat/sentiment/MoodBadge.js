// components/sentiment/MoodBadge.js
// Displays the currently detected emotion in the chat header.
// Wijerathna renders this component — you just build it.

import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Animated,
} from 'react-native';
import { COLORS, FONTS, SPACING, RADIUS } from '../theme';

// ── One config entry per emotion from your backend ───────────
// These 7 moods match exactly what emotion_detector.py returns:
// Tired, Stressed, Happy, Sad, Excited, Calm, Anxious
const MOOD_CONFIG = {
  Tired:    { emoji: '😴', bg: '#85929E22', border: '#85929E', label: 'Tired'    },
  Stressed: { emoji: '😰', bg: '#E74C3C22', border: '#E74C3C', label: 'Stressed' },
  Happy:    { emoji: '😊', bg: '#27AE6022', border: '#27AE60', label: 'Happy'    },
  Sad:      { emoji: '😢', bg: '#2980B922', border: '#2980B9', label: 'Sad'      },
  Excited:  { emoji: '🤩', bg: '#F39C1222', border: '#F39C12', label: 'Excited'  },
  Calm:     { emoji: '😌', bg: '#1ABC9C22', border: '#1ABC9C', label: 'Calm'     },
  Anxious:  { emoji: '😟', bg: '#8E44AD22', border: '#8E44AD', label: 'Anxious'  },
};

const DEFAULT_CONFIG = MOOD_CONFIG.Calm;

// ── Props ────────────────────────────────────────────────────
// mood      (string)  — one of the 7 mood labels above
//                       comes from response.data.mood
// intensity (float)   — 0.0 to 1.0
//                       comes from response.data.intensity
// sentiment (string)  — 'Positive' / 'Neutral' / 'Negative'
//                       comes from response.data.sentiment
export default function MoodBadge({ mood, intensity, sentiment }) {
  const config    = MOOD_CONFIG[mood] || DEFAULT_CONFIG;
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  // Animate in whenever mood changes
  useEffect(() => {
    if (!mood) return;
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue:         1,
        duration:        300,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue:         1,
        friction:        6,
        useNativeDriver: true,
      }),
    ]).start();
  }, [mood]);

  // Don't render if no mood detected yet
  if (!mood) return null;

  // Convert 0.0–1.0 intensity to a filled bar width percentage
  const intensityPercent = Math.round((intensity || 0.5) * 100);

  return (
    <Animated.View
      style={[
        styles.badge,
        {
          backgroundColor: config.bg,
          borderColor:     config.border,
          opacity:         fadeAnim,
          transform:       [{ scale: scaleAnim }],
        },
      ]}
    >
      {/* Emoji */}
      <Text style={styles.emoji}>{config.emoji}</Text>

      {/* Mood label + intensity bar */}
      <View style={styles.info}>
        <Text style={[styles.moodLabel, { color: config.border }]}>
          {config.label}
        </Text>

        {/* Intensity bar */}
        <View style={styles.barTrack}>
          <View
            style={[
              styles.barFill,
              {
                width:           `${intensityPercent}%`,
                backgroundColor: config.border,
              },
            ]}
          />
        </View>
      </View>

      {/* Sentiment dot */}
      <View style={[
        styles.sentimentDot,
        {
          backgroundColor:
            sentiment === 'Positive' ? COLORS.success :
            sentiment === 'Negative' ? COLORS.error   : COLORS.border,
        },
      ]} />

    </Animated.View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection:     'row',
    alignItems:        'center',
    borderRadius:      RADIUS.full,
    borderWidth:       1,
    paddingHorizontal: SPACING.sm,
    paddingVertical:   SPACING.xs,
    maxWidth:          140,
  },
  emoji: {
    fontSize:    16,
    marginRight: SPACING.xs,
  },
  info: {
    flex: 1,
  },
  moodLabel: {
    fontSize:   11,
    fontFamily: FONTS.semiBold,
    marginBottom: 2,
  },
  barTrack: {
    height:          3,
    backgroundColor: COLORS.border,
    borderRadius:    RADIUS.full,
    overflow:        'hidden',
  },
  barFill: {
    height:       3,
    borderRadius: RADIUS.full,
  },
  sentimentDot: {
    width:        8,
    height:       8,
    borderRadius: 4,
    marginLeft:   SPACING.xs,
  },
});
