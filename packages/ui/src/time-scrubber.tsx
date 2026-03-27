/**
 * @fileoverview Full-width time scrubber with solar event ticks.
 */

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { TimeScrubberProps } from './types';

function formatTime(date: Date): string {
  return date.toISOString().slice(11, 16);
}

export function TimeScrubber(props: TimeScrubberProps): React.JSX.Element {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Time Scrubber</Text>
      <Text style={styles.current}>{formatTime(props.currentTime)}</Text>
      <View style={styles.row}>
        <Pressable onPress={() => props.onChange(props.sunTimes.sunrise)} style={styles.tickButton}>
          <Text style={styles.tickText}>{`Rise ${formatTime(props.sunTimes.sunrise)}`}</Text>
        </Pressable>
        <Pressable onPress={() => props.onChange(props.sunTimes.solarNoon)} style={styles.tickButton}>
          <Text style={styles.tickText}>{`Noon ${formatTime(props.sunTimes.solarNoon)}`}</Text>
        </Pressable>
        <Pressable onPress={() => props.onChange(props.sunTimes.sunset)} style={styles.tickButton}>
          <Text style={styles.tickText}>{`Set ${formatTime(props.sunTimes.sunset)}`}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#102038',
    borderRadius: 18,
    padding: 16
  },
  title: {
    color: '#F3F8FF',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8
  },
  current: {
    color: '#F4A623',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 12
  },
  row: {
    flexDirection: 'row',
    gap: 8
  },
  tickButton: {
    flex: 1,
    backgroundColor: '#1A2C44',
    borderRadius: 12,
    padding: 10
  },
  tickText: {
    color: '#D7E5F2',
    textAlign: 'center'
  }
});
