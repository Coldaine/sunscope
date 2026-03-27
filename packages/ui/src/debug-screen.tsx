/**
 * @fileoverview Debug screen for heading, location, and log inspection.
 */

import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { DebugScreenProps } from './types';

export function DebugScreen(props: DebugScreenProps): React.JSX.Element {
  return (
    <ScrollView style={styles.card}>
      <Text style={styles.title}>Debug</Text>
      <Text style={styles.row}>{`Raw azimuth rad: ${props.rawAzimuthRad.toFixed(4)}`}</Text>
      <Text style={styles.row}>{`Converted azimuth: ${props.convertedAzimuthDeg.toFixed(2)}°`}</Text>
      <Text style={styles.row}>{`Location: ${props.locationText}`}</Text>
      <Text style={styles.row}>{`Raw heading: ${props.headingState.rawHeading ?? 'n/a'}`}</Text>
      <Text style={styles.row}>{`Smoothed heading: ${props.headingState.smoothedHeading ?? 'n/a'}`}</Text>
      <Text style={styles.row}>{`Accuracy: ${props.headingState.headingAccuracy ?? 'n/a'}`}</Text>
      <View style={styles.logBlock}>
        {props.logs.slice(-20).map((entry) => (
          <Text key={`${entry.timestamp}-${entry.message}`} style={styles.logLine}>
            {`${entry.level} ${entry.module}: ${entry.message}`}
          </Text>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#08111F',
    borderRadius: 18,
    padding: 16,
    maxHeight: 320
  },
  title: {
    color: '#F3F8FF',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8
  },
  row: {
    color: '#D7E5F2',
    marginBottom: 4
  },
  logBlock: {
    marginTop: 10,
    gap: 4
  },
  logLine: {
    color: '#9FB5CC',
    fontSize: 12
  }
});
