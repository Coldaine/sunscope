/**
 * @module @sunscope/mobile
 * @description SunScope mobile app entry point
 */

// TODO: Initialize a DefaultLogger from @sunscope/core and pass it down via React context
// when real features are integrated.

import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>SunScope</Text>
      <Text style={styles.subtitle}>Solar tracking for iOS</Text>
      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A1628',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#F4A623',
    fontSize: 32,
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#4A90D9',
    fontSize: 16,
    marginTop: 8,
  },
});
