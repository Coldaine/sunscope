/**
 * @fileoverview Day altitude chart with a horizon line and phase bands.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Line, Path, Rect } from 'react-native-svg';
import { SunSample } from '@sunscope/core';
import { AltitudeChartProps } from './types';

const WIDTH = 320;
const HEIGHT = 180;
const PADDING = 16;
const MIN_ALTITUDE = -20;
const MAX_ALTITUDE = 90;

function phaseBandColor(phase: SunSample['phase']): string {
  switch (phase) {
    case 'GoldenHour':
      return 'rgba(244,166,35,0.24)';
    case 'BlueHour':
      return 'rgba(74,144,217,0.22)';
    case 'Daylight':
      return 'rgba(247,210,76,0.16)';
    case 'Night':
      return 'rgba(18,36,58,0.6)';
    default:
      return 'rgba(124,141,166,0.15)';
  }
}

function xForIndex(index: number, total: number): number {
  return PADDING + (index / Math.max(1, total - 1)) * (WIDTH - PADDING * 2);
}

function yForAltitude(altitude: number): number {
  const normalized = (Math.max(MIN_ALTITUDE, Math.min(MAX_ALTITUDE, altitude)) - MIN_ALTITUDE) / (MAX_ALTITUDE - MIN_ALTITUDE);
  return HEIGHT - PADDING - normalized * (HEIGHT - PADDING * 2);
}

function buildLine(samples: SunSample[]): string {
  return samples
    .map((sample, index) => {
      const command = index === 0 ? 'M' : 'L';
      return `${command} ${xForIndex(index, samples.length)} ${yForAltitude(sample.altitude)}`;
    })
    .join(' ');
}

export function AltitudeChart(props: AltitudeChartProps): React.JSX.Element {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Altitude Chart</Text>
      <Svg width={WIDTH} height={HEIGHT}>
        {props.samples.map((sample, index) => (
          <Rect
            key={`${sample.date.toISOString()}-band`}
            x={xForIndex(index, props.samples.length)}
            y={PADDING}
            width={(WIDTH - PADDING * 2) / props.samples.length + 1}
            height={HEIGHT - PADDING * 2}
            fill={phaseBandColor(sample.phase)}
          />
        ))}
        <Line
          x1={PADDING}
          y1={yForAltitude(0)}
          x2={WIDTH - PADDING}
          y2={yForAltitude(0)}
          stroke="#F3F8FF"
          strokeWidth={1.5}
        />
        <Path d={buildLine(props.samples)} stroke="#F7D24C" strokeWidth={2.5} fill="none" />
      </Svg>
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
    marginBottom: 12
  }
});
