/**
 * @fileoverview Horizontal scroll of solar event cards.
 */

import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { EventCardsProps } from './types';

function eventItems(sunTimes: EventCardsProps['sunTimes']): Array<{ label: string; value: Date }> {
  return [
    { label: 'Sunrise', value: sunTimes.sunrise },
    { label: 'Solar Noon', value: sunTimes.solarNoon },
    { label: 'Sunset', value: sunTimes.sunset },
    { label: 'Dawn', value: sunTimes.dawn },
    { label: 'Dusk', value: sunTimes.dusk }
  ];
}

export function EventCards(props: EventCardsProps): React.JSX.Element {
  return (
    <ScrollView horizontal={true} showsHorizontalScrollIndicator={false} contentContainerStyle={styles.container}>
      {eventItems(props.sunTimes).map((item) => (
        <View key={item.label} style={styles.card}>
          <Text style={styles.label}>{item.label}</Text>
          <Text style={styles.value}>{item.value.toISOString().slice(11, 16)}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
    paddingVertical: 4
  },
  card: {
    backgroundColor: '#102038',
    borderRadius: 16,
    padding: 14,
    minWidth: 116
  },
  label: {
    color: '#9FB5CC',
    marginBottom: 6
  },
  value: {
    color: '#F3F8FF',
    fontSize: 20,
    fontWeight: '700'
  }
});
