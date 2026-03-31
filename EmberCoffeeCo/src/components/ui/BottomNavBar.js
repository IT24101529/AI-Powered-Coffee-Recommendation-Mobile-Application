import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import colors from '../../theme/colors';
import { fonts, fontSizes } from '../../theme/typography';

const TABS = [
  { key: 'Home',    icon: '🏠' },
  { key: 'Menu',    icon: '☕' },
  { key: 'Rewards', icon: '🎁' },
  { key: 'Orders',  icon: '📦' },
  { key: 'Profile', icon: '👤' },
];

export default function BottomNavBar({ activeTab, onTabPress }) {
  return (
    <View style={styles.bar}>
      {TABS.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.tab}
            onPress={() => onTabPress && onTabPress(tab.key)}
            activeOpacity={0.7}
          >
            <Text style={styles.icon}>{tab.icon}</Text>
            <Text style={[styles.label, isActive ? styles.labelActive : styles.labelInactive]}>
              {tab.key}
            </Text>
            {isActive ? <View style={styles.activeDot} /> : null}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: 60,
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.08)',
    backgroundColor: '#FFFFFF',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 6,
  },
  icon: {
    fontSize: 18,
    lineHeight: 22,
  },
  label: {
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.xs,
    marginTop: 2,
  },
  labelActive: {
    color: colors.primary,
  },
  labelInactive: {
    color: '#9E9E9E',
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
    marginTop: 2,
  },
});
