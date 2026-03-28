import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function MyRewardsScreen() {
  return (
    <View style={styles.container}>
      <Text>MyRewardsScreen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
