// components/feedback/FeedbackWidget.js
// Star rating widget shown after every recommendation.
// Calls POST /feedback/submit when user rates or skips.

import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity,
  StyleSheet,
} from 'react-native';
import axios from 'axios';
import { COLORS, FONTS, SPACING, RADIUS } from '../theme';
import API_URLS from '../../../config/api';

// ── Props ────────────────────────────────────────────────────
// sessionId     (string) — active session ID
// productName   (string) — which coffee was recommended
// strategyUsed  (string) — one of: content_based, mood_based,
//                          trending, hybrid
//                          Wijerathna gets this from
//                          POST /strategies/select response
// userMood      (string) — current mood from Bandara
// weatherContext(string) — current weather from Ranasinghe
// onDone        (fn)     — called when widget is dismissed
export default function FeedbackWidget({
  sessionId,
  productName,
  strategyUsed,
  userMood,
  weatherContext,
  onDone,
}) {
  const [selectedRating, setSelectedRating] = useState(0);
  const [submitted, setSubmitted]           = useState(false);
  const [submitting, setSubmitting]         = useState(false);
  const [error, setError]                   = useState(null);

  const submitFeedback = async (rating, accepted) => {
    setSubmitting(true);
    setError(null);
    try {
      // POST /feedback/submit
      // Required: session_id, product_name, strategy_used, accepted
      // Optional: rating, user_mood, weather_context, notes
      await axios.post(
        `${API_URLS.FEEDBACK_API}/feedback/submit`,
        {
          session_id:      sessionId,
          product_name:    productName || 'Unknown Product',
          strategy_used:   strategyUsed || 'hybrid',
          accepted:        accepted,
          rating:          rating,
          user_mood:       userMood       || 'Calm',
          weather_context: weatherContext || 'Warm',
          notes:           null,
        },
        { timeout: 5000 }
      );
      setSubmitted(true);
      // Dismiss after 2 seconds
      setTimeout(() => { if (onDone) onDone(); }, 2000);
    } catch (err) {
      const detail = err?.response?.data?.detail;
      const reason = typeof detail === 'string' ? detail : null;
      setError(reason ? `Could not submit feedback: ${reason}` : 'Could not submit feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Called when user taps Submit with a star rating
  const handleStarSubmit = () => {
    if (selectedRating === 0) return;
    // accepted = true if rating >= 3, false if 1 or 2
    submitFeedback(selectedRating, selectedRating >= 3);
  };

  // Called when user taps Skip
  const handleSkip = () => {
    // accepted = false, no rating
    submitFeedback(null, false);
  };

  // ── Thank you state ────────────────────────────────────────
  if (submitted) {
    return (
      <View style={styles.box}>
        <Text style={styles.thankYou}>✅  Thank you for your feedback!</Text>
        <Text style={styles.thankYouSub}>
          This helps improve future recommendations.
        </Text>
      </View>
    );
  }

  // ── Rating widget ──────────────────────────────────────────
  return (
    <View style={styles.box}>
      <Text style={styles.question}>How was this recommendation?</Text>
      <Text style={styles.productLabel}>{productName}</Text>

      {/* Star row */}
      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map(star => (
          <TouchableOpacity
            key={star}
            onPress={() => setSelectedRating(star)}
            style={styles.starBtn}
          >
            <Text style={[
              styles.star,
              selectedRating >= star && styles.starFilled,
            ]}>
              {selectedRating >= star ? '★' : '☆'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Rating label */}
      {selectedRating > 0 && (
        <Text style={styles.ratingLabel}>
          {['', 'Poor', 'Fair', 'Good', 'Great', 'Perfect!'][selectedRating]}
        </Text>
      )}

      {/* Error */}
      {error && <Text style={styles.error}>{error}</Text>}

      {/* Buttons */}
      <View style={styles.btnRow}>
        <TouchableOpacity
          style={[
            styles.submitBtn,
            selectedRating === 0 && styles.btnDisabled,
          ]}
          onPress={handleStarSubmit}
          disabled={selectedRating === 0 || submitting}
        >
          <Text style={styles.submitBtnText}>
            {submitting ? 'Submitting…' : 'Submit'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.skipBtn}
          onPress={handleSkip}
          disabled={submitting}
        >
          <Text style={styles.skipBtnText}>Skip</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: COLORS.surface,
    borderRadius:    RADIUS.md,
    padding:         SPACING.lg,
    marginVertical:  SPACING.sm,
    borderWidth:     1,
    borderColor:     COLORS.border,
  },
  question: {
    fontSize:     15,
    fontFamily:   FONTS.bold,
    color:        COLORS.text,
    textAlign:    'center',
    marginBottom: SPACING.xs,
  },
  productLabel: {
    fontSize:     12,
    fontFamily:   FONTS.regular,
    color:        COLORS.textLight,
    textAlign:    'center',
    marginBottom: SPACING.md,
  },
  starsRow: {
    flexDirection:  'row',
    justifyContent: 'center',
    marginBottom:   SPACING.xs,
  },
  starBtn: { padding: SPACING.sm },
  star:    { fontSize: 32, color: COLORS.border },
  starFilled: { color: '#F39C12' },
  ratingLabel: {
    textAlign:    'center',
    fontSize:     13,
    fontFamily:   FONTS.semiBold,
    color:        COLORS.primary,
    marginBottom: SPACING.md,
  },
  error: {
    color:        COLORS.error,
    fontSize:     12,
    fontFamily:   FONTS.regular,
    textAlign:    'center',
    marginBottom: SPACING.sm,
  },
  btnRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
  },
  submitBtn: {
    flex:            0.55,
    backgroundColor: COLORS.primary,
    borderRadius:    RADIUS.sm,
    paddingVertical: SPACING.sm,
    alignItems:      'center',
  },
  submitBtnText: {
    color:      COLORS.surface,
    fontFamily: FONTS.bold,
    fontSize:   14,
  },
  skipBtn: {
    flex:            0.40,
    backgroundColor: COLORS.background,
    borderRadius:    RADIUS.sm,
    paddingVertical: SPACING.sm,
    alignItems:      'center',
    borderWidth:     1,
    borderColor:     COLORS.border,
  },
  skipBtnText: {
    color:      COLORS.textLight,
    fontFamily: FONTS.regular,
    fontSize:   13,
  },
  btnDisabled:  { opacity: 0.4 },
  thankYou: {
    fontSize:     15,
    fontFamily:   FONTS.bold,
    color:        '#27AE60',
    textAlign:    'center',
    marginBottom: SPACING.xs,
  },
  thankYouSub: {
    fontSize:   12,
    fontFamily: FONTS.regular,
    color:      COLORS.textLight,
    textAlign:  'center',
  },
});
