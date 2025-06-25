import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const StatsScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Study Statistics</Text>
      <Text style={styles.subtitle}>Stats Screen - Coming Soon!</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
});

export default StatsScreen;