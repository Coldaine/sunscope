/**
 * @fileoverview Shadow calculator sheet.
 */

import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { ShadowSheetProps } from './types';

export function ShadowSheet(props: ShadowSheetProps): React.JSX.Element {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Shadow Calculator</Text>
      <TextInput
        value={props.heightValue}
        onChangeText={props.onHeightChange}
        placeholder="Height"
        style={styles.input}
      />
      <View style={styles.row}>
        <Pressable onPress={() => props.onUnitChange('feet')} style={[styles.unitButton, props.unit === 'feet' ? styles.unitButtonActive : null]}>
          <Text style={styles.unitText}>Feet</Text>
        </Pressable>
        <Pressable onPress={() => props.onUnitChange('meters')} style={[styles.unitButton, props.unit === 'meters' ? styles.unitButtonActive : null]}>
          <Text style={styles.unitText}>Meters</Text>
        </Pressable>
      </View>
      <Text style={styles.value}>{`Length: ${Number.isFinite(props.shadowResult.length) ? props.shadowResult.length.toFixed(2) : 'Infinity'}m`}</Text>
      <Text style={styles.value}>{`Direction: ${props.shadowResult.direction.toFixed(0)}°`}</Text>
      <Text style={styles.value}>{props.shadowResult.clamped ? 'Clamp active: low sun angle' : 'Shortest-shadow guidance: near solar noon'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#102038',
    borderRadius: 18,
    padding: 16,
    gap: 10
  },
  title: {
    color: '#F3F8FF',
    fontSize: 18,
    fontWeight: '600'
  },
  input: {
    backgroundColor: '#0A1628',
    color: '#F3F8FF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  row: {
    flexDirection: 'row',
    gap: 8
  },
  unitButton: {
    backgroundColor: '#1A2C44',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999
  },
  unitButtonActive: {
    backgroundColor: '#F4A623'
  },
  unitText: {
    color: '#F3F8FF',
    fontWeight: '600'
  },
  value: {
    color: '#D7E5F2'
  }
});
