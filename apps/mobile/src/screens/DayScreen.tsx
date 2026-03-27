import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AltitudeChart, EventCards, TimeScrubber } from '@sunscope/ui';
import { SunSample, SunTimes } from '@sunscope/core';

export interface DayScreenProps {
  currentTime: Date;
  samples: SunSample[];
  sunTimes: SunTimes;
  onChangeTime: (date: Date) => void;
  onOpenShadow: () => void;
}

export function DayScreen(props: DayScreenProps): React.JSX.Element {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Day</Text>
      <AltitudeChart samples={props.samples} />
      <TimeScrubber currentTime={props.currentTime} sunTimes={props.sunTimes} onChange={props.onChangeTime} />
      <EventCards sunTimes={props.sunTimes} />
      <Pressable style={styles.button} onPress={props.onOpenShadow}>
        <Text style={styles.buttonText}>Shadow Calculator</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 14,
    paddingBottom: 32
  },
  title: {
    color: '#F3F8FF',
    fontSize: 28,
    fontWeight: '700'
  },
  button: {
    backgroundColor: '#1C3150',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center'
  },
  buttonText: {
    color: '#F3F8FF',
    fontWeight: '700'
  }
});
