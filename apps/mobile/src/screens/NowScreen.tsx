import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { PolarSunDiagram } from '@sunscope/ui';
import { SunSample, SunTimes } from '@sunscope/core';

export interface NowScreenProps {
  currentTime: Date;
  currentSample: SunSample;
  samples: SunSample[];
  sunTimes: SunTimes;
  onOpenShadow: () => void;
}

export function NowScreen(props: NowScreenProps): React.JSX.Element {
  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>Now</Text>
      <Text style={styles.title}>{`${props.currentSample.altitude.toFixed(1)}° altitude`}</Text>
      <Text style={styles.subtitle}>{`${props.currentSample.azimuth.toFixed(1)}° azimuth`}</Text>
      <PolarSunDiagram samples={props.samples} currentTime={props.currentTime} />
      <Pressable style={styles.button} onPress={props.onOpenShadow}>
        <Text style={styles.buttonText}>Open Shadow Sheet</Text>
      </Pressable>
      <Text style={styles.caption}>{`Rise ${props.sunTimes.sunrise.toISOString().slice(11, 16)} · Noon ${props.sunTimes.solarNoon.toISOString().slice(11, 16)} · Set ${props.sunTimes.sunset.toISOString().slice(11, 16)}`}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12
  },
  eyebrow: {
    color: '#9FB5CC',
    textTransform: 'uppercase',
    letterSpacing: 1.2
  },
  title: {
    color: '#F3F8FF',
    fontSize: 28,
    fontWeight: '700'
  },
  subtitle: {
    color: '#D7E5F2'
  },
  button: {
    backgroundColor: '#F4A623',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center'
  },
  buttonText: {
    color: '#08111F',
    fontWeight: '700'
  },
  caption: {
    color: '#9FB5CC'
  }
});
