import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function AdminProductsScreen() {
  return (
    <View style={styles.container}>
      <Text>AdminProductsScreen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
