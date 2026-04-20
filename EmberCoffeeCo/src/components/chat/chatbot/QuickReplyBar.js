// components/chatbot/QuickReplyBar.js
import React from 'react';
import {
  View, Text, TouchableOpacity,
  ScrollView, StyleSheet,
} from 'react-native';
import { COLORS, FONTS, SPACING, RADIUS } from '../theme';

// Props:
//   replies  (array of strings) — the quick reply options
//   onPress  (fn)               — called with the selected reply text
export default function QuickReplyBar({ replies = [], onPress }) {
  if (!replies || replies.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroll}
      contentContainerStyle={styles.container}
    >
      {replies.map((reply, index) => (
        <TouchableOpacity
          key={index}
          style={styles.chip}
          onPress={() => onPress(reply)}
        >
          <Text style={styles.chipText}>{reply}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    maxHeight: 50,
  },
  container: {
    paddingHorizontal: SPACING.md,
    paddingVertical:   SPACING.sm,
    gap:               SPACING.sm,
  },
  chip: {
    backgroundColor:   COLORS.surface,
    borderRadius:      RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical:   SPACING.sm,
    borderWidth:       1.5,
    borderColor:       COLORS.primary,
  },
  chipText: {
    color:      COLORS.primary,
    fontSize:   13,
    fontFamily: FONTS.semiBold,
  },
});
