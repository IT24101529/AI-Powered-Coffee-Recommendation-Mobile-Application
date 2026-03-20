// screens/ReviewScreen.js
// Reviews & Ratings screen for the Coffee Recommendation App.
// Shows all reviews for a product and lets users submit / delete their own review.
// Owner: Ekanayake E.M.T.D.B. | IT24100917

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, ScrollView,
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Change this to your backend URL (Ranasinghe's deployed Render URL in production)
const API_BASE = 'http://192.168.1.x:5000/api';   // ← replace x with your IP

// ── Star Rating Component ─────────────────────────────────────
function StarRating({ rating, onSelect, size = 28 }) {
  return (
    <View style={styles.starRow}>
      {[1, 2, 3, 4, 5].map(star => (
        <TouchableOpacity
          key={star}
          onPress={() => onSelect && onSelect(star)}
          disabled={!onSelect}
        >
          <Text style={[styles.star, { fontSize: size }, star <= rating && styles.starFilled]}>
            {star <= rating ? '★' : '☆'}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ── Review Card Component ─────────────────────────────────────
function ReviewCard({ review, currentUserId, onDelete }) {
  const isOwner = review.userId?._id === currentUserId || review.userId === currentUserId;

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.reviewer}>{review.userId?.name ?? 'Anonymous'}</Text>
        <StarRating rating={review.rating} size={16} />
      </View>
      <Text style={styles.comment}>{review.comment}</Text>
      {review.sentiment && (
        <Text style={[
          styles.sentimentBadge,
          review.sentiment === 'Positive' ? styles.pos : review.sentiment === 'Negative' ? styles.neg : styles.neu,
        ]}>
          {review.sentiment}
        </Text>
      )}
      <Text style={styles.date}>{new Date(review.createdAt).toLocaleDateString()}</Text>
      {isOwner && (
        <TouchableOpacity style={styles.deleteBtn} onPress={() => onDelete(review._id)}>
          <Text style={styles.deleteTxt}>Delete my review</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────────
export default function ReviewScreen({ route }) {
  const { productId, productName } = route.params;

  const [reviews,        setReviews]        = useState([]);
  const [avgRating,      setAvgRating]      = useState(0);
  const [distribution,   setDistribution]   = useState({});
  const [loading,        setLoading]        = useState(true);
  const [submitting,     setSubmitting]     = useState(false);

  // Form state
  const [selectedRating, setSelectedRating] = useState(0);
  const [comment,        setComment]        = useState('');

  // Auth
  const [token,          setToken]          = useState(null);
  const [currentUserId,  setCurrentUserId]  = useState(null);
  const [myReviewId,     setMyReviewId]     = useState(null);   // existing review id if any

  // ── Load auth token & current user id ──────────────────────
  useEffect(() => {
    (async () => {
      const t  = await AsyncStorage.getItem('token');
      const id = await AsyncStorage.getItem('userId');
      setToken(t);
      setCurrentUserId(id);
    })();
  }, []);

  // ── Fetch reviews for this product ─────────────────────────
  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/reviews/product/${productId}`);
      setReviews(res.data.reviews);
      setAvgRating(res.data.avgRating);
      setDistribution(res.data.distribution ?? {});

      // Check if user already reviewed
      const mine = res.data.reviews.find(
        r => r.userId?._id === currentUserId || r.userId === currentUserId
      );
      setMyReviewId(mine?._id ?? null);
    } catch (err) {
      Alert.alert('Error', 'Could not load reviews.');
    } finally {
      setLoading(false);
    }
  }, [productId, currentUserId]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  // ── Submit a review ────────────────────────────────────────
  const handleSubmit = async () => {
    if (!token) {
      Alert.alert('Login required', 'Please log in to submit a review.');
      return;
    }
    if (selectedRating === 0) {
      Alert.alert('Rating required', 'Please select a star rating.');
      return;
    }
    if (!comment.trim()) {
      Alert.alert('Comment required', 'Please write a comment.');
      return;
    }

    setSubmitting(true);
    try {
      await axios.post(
        `${API_BASE}/reviews`,
        { productId, rating: selectedRating, comment },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSelectedRating(0);
      setComment('');
      await fetchReviews();
      Alert.alert('Thank you!', 'Your review has been submitted.');
    } catch (err) {
      const msg = err.response?.data?.message ?? 'Failed to submit review.';
      Alert.alert('Error', msg);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Delete a review ────────────────────────────────────────
  const handleDelete = (reviewId) => {
    Alert.alert(
      'Delete review',
      'Are you sure you want to delete your review?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete(`${API_BASE}/reviews/${reviewId}`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              await fetchReviews();
            } catch (err) {
              Alert.alert('Error', 'Failed to delete review.');
            }
          },
        },
      ]
    );
  };

  // ── Render ─────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6F4E37" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      {/* Header */}
      <Text style={styles.title}>{productName}</Text>
      <Text style={styles.subtitle}>Customer Reviews</Text>

      {/* Average rating summary */}
      <View style={styles.summaryBox}>
        <Text style={styles.avgNumber}>{avgRating}</Text>
        <StarRating rating={Math.round(avgRating)} size={24} />
        <Text style={styles.totalText}>{reviews.length} review{reviews.length !== 1 ? 's' : ''}</Text>
      </View>

      {/* Rating distribution bar */}
      {reviews.length > 0 && (
        <View style={styles.distBox}>
          {[5, 4, 3, 2, 1].map(star => (
            <View key={star} style={styles.distRow}>
              <Text style={styles.distLabel}>{star}★</Text>
              <View style={styles.distBarBg}>
                <View
                  style={[
                    styles.distBar,
                    { width: `${((distribution[star] ?? 0) / reviews.length) * 100}%` },
                  ]}
                />
              </View>
              <Text style={styles.distCount}>{distribution[star] ?? 0}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Submit form — hide if user already reviewed */}
      {!myReviewId && (
        <View style={styles.formBox}>
          <Text style={styles.formTitle}>Write a Review</Text>
          <StarRating rating={selectedRating} onSelect={setSelectedRating} />
          <TextInput
            style={styles.textInput}
            placeholder="Share your thoughts about this coffee..."
            placeholderTextColor="#999"
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={4}
            maxLength={1000}
          />
          <TouchableOpacity
            style={[styles.submitBtn, (submitting || selectedRating === 0) && styles.disabled]}
            onPress={handleSubmit}
            disabled={submitting || selectedRating === 0}
          >
            {submitting
              ? <ActivityIndicator color="#FFF" />
              : <Text style={styles.submitTxt}>Submit Review</Text>
            }
          </TouchableOpacity>
        </View>
      )}

      {myReviewId && (
        <View style={styles.alreadyBox}>
          <Text style={styles.alreadyTxt}>You have already reviewed this product.</Text>
        </View>
      )}

      {/* Reviews list */}
      {reviews.length === 0
        ? <Text style={styles.empty}>No reviews yet. Be the first!</Text>
        : reviews.map(r => (
            <ReviewCard
              key={r._id}
              review={r}
              currentUserId={currentUserId}
              onDelete={handleDelete}
            />
          ))
      }
    </ScrollView>
  );
}

// ── Styles ────────────────────────────────────────────────────
const BROWN  = '#6F4E37';
const CREAM  = '#FFF8F0';
const GOLD   = '#F39C12';
const RED    = '#922B21';

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: CREAM, padding: 16 },
  center:       { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: CREAM },
  title:        { fontSize: 22, fontWeight: 'bold', color: BROWN, textAlign: 'center', marginBottom: 2 },
  subtitle:     { fontSize: 14, color: '#888', textAlign: 'center', marginBottom: 16 },

  // Average rating summary
  summaryBox:   { alignItems: 'center', backgroundColor: '#FFF', borderRadius: 12, padding: 16,
                  marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4 },
  avgNumber:    { fontSize: 48, fontWeight: 'bold', color: BROWN },
  totalText:    { fontSize: 13, color: '#888', marginTop: 4 },

  // Distribution
  distBox:      { backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginBottom: 12 },
  distRow:      { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  distLabel:    { width: 28, fontSize: 12, color: '#555' },
  distBarBg:    { flex: 1, height: 8, backgroundColor: '#EEE', borderRadius: 4, marginHorizontal: 8 },
  distBar:      { height: 8, backgroundColor: GOLD, borderRadius: 4 },
  distCount:    { width: 24, fontSize: 12, color: '#555', textAlign: 'right' },

  // Form
  formBox:      { backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginBottom: 16, elevation: 2 },
  formTitle:    { fontSize: 16, fontWeight: 'bold', color: BROWN, marginBottom: 12 },
  starRow:      { flexDirection: 'row', marginBottom: 12 },
  star:         { color: '#CCC', marginRight: 4 },
  starFilled:   { color: GOLD },
  textInput:    { borderWidth: 1, borderColor: '#DDD', borderRadius: 8, padding: 12,
                  minHeight: 80, textAlignVertical: 'top', color: '#333', fontSize: 14 },
  submitBtn:    { backgroundColor: RED, padding: 14, borderRadius: 10, alignItems: 'center', marginTop: 12 },
  submitTxt:    { color: '#FFF', fontWeight: 'bold', fontSize: 15 },
  disabled:     { opacity: 0.5 },

  alreadyBox:   { backgroundColor: '#E8F5E9', borderRadius: 10, padding: 12, marginBottom: 16,
                  alignItems: 'center' },
  alreadyTxt:   { color: '#2E7D32', fontSize: 14 },

  empty:        { textAlign: 'center', color: '#AAA', fontSize: 14, marginTop: 20 },

  // Review card
  card:         { backgroundColor: '#FFF', borderRadius: 12, padding: 14, marginBottom: 12,
                  borderLeftWidth: 4, borderLeftColor: BROWN, elevation: 1 },
  cardHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  reviewer:     { fontSize: 14, fontWeight: 'bold', color: '#333' },
  comment:      { fontSize: 14, color: '#555', lineHeight: 20 },
  sentimentBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2,
                    borderRadius: 10, fontSize: 11, marginTop: 6, overflow: 'hidden' },
  pos:          { backgroundColor: '#E8F5E9', color: '#2E7D32' },
  neg:          { backgroundColor: '#FFEBEE', color: '#C62828' },
  neu:          { backgroundColor: '#F5F5F5', color: '#555' },
  date:         { fontSize: 11, color: '#BBB', marginTop: 6 },
  deleteBtn:    { marginTop: 8, alignSelf: 'flex-end' },
  deleteTxt:    { color: RED, fontSize: 12 },
});
