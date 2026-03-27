/**
 * @fileoverview Polar sun-path diagram rendered with React Native and SVG.
 *
 * This component draws a semicircular sky-dome projection with hourly tick
 * marks, cardinal labels, phase-colored arc segments, and the current sun
 * marker. It consumes the canonical `SunSample` contract from `@sunscope/core`.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg';
import { SunSample } from '@sunscope/core';
import { PolarSunDiagramProps } from './types';

const WIDTH = 320;
const HEIGHT = 220;
const CENTER_X = WIDTH / 2;
const CENTER_Y = HEIGHT - 20;
const RADIUS = 140;

function phaseColor(phase: SunSample['phase']): string {
  switch (phase) {
    case 'GoldenHour':
      return '#F4A623';
    case 'BlueHour':
      return '#4A90D9';
    case 'Daylight':
      return '#F7D24C';
    case 'Night':
      return '#16243A';
    default:
      return '#7C8DA6';
  }
}

function projectSample(sample: SunSample): { x: number; y: number } {
  const normalizedAzimuth = ((sample.azimuth % 360) + 360) % 360;
  const angle = Math.PI - (normalizedAzimuth / 360) * Math.PI;
  const radialDistance = RADIUS * (1 - Math.max(0, Math.min(90, sample.altitude)) / 90);
  return {
    x: CENTER_X + radialDistance * Math.cos(angle),
    y: CENTER_Y - radialDistance * Math.sin(angle)
  };
}

function buildSegmentPath(start: SunSample, end: SunSample): string {
  const startPoint = projectSample(start);
  const endPoint = projectSample(end);
  return `M ${startPoint.x} ${startPoint.y} L ${endPoint.x} ${endPoint.y}`;
}

function getCurrentSample(samples: SunSample[], currentTime: Date): SunSample | undefined {
  let closest = samples[0];
  let smallestDelta = Number.POSITIVE_INFINITY;

  samples.forEach((sample) => {
    const delta = Math.abs(sample.date.getTime() - currentTime.getTime());
    if (delta < smallestDelta) {
      smallestDelta = delta;
      closest = sample;
    }
  });

  return closest;
}

export function PolarSunDiagram(props: PolarSunDiagramProps): React.JSX.Element {
  const currentSample = getCurrentSample(props.samples, props.currentTime);
  const currentPoint = currentSample === undefined ? null : projectSample(currentSample);
  const hourSamples = props.samples.filter((sample) => sample.date.getUTCMinutes() === 0);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Polar Sun Diagram</Text>
      <Svg width={WIDTH} height={HEIGHT}>
        <Path d={`M 20 ${CENTER_Y} A ${RADIUS} ${RADIUS} 0 0 1 ${WIDTH - 20} ${CENTER_Y}`} stroke="#30445F" strokeWidth={2} fill="none" />
        {props.samples.slice(0, -1).map((sample, index) => (
          <Path
            key={`${sample.date.toISOString()}-${index}`}
            d={buildSegmentPath(sample, props.samples[index + 1])}
            stroke={phaseColor(sample.phase)}
            strokeWidth={3}
            fill="none"
          />
        ))}
        {hourSamples.map((sample) => {
          const point = projectSample({
            ...sample,
            altitude: 0
          });
          const inner = projectSample({
            ...sample,
            altitude: 8
          });
          return (
            <Line
              key={`tick-${sample.date.toISOString()}`}
              x1={point.x}
              y1={point.y}
              x2={inner.x}
              y2={inner.y}
              stroke="#7C8DA6"
              strokeWidth={1}
            />
          );
        })}
        <SvgText x={20} y={CENTER_Y + 18} fill="#C9D8E8" fontSize="12">N</SvgText>
        <SvgText x={WIDTH * 0.26} y={CENTER_Y - 70} fill="#C9D8E8" fontSize="12">E</SvgText>
        <SvgText x={CENTER_X - 4} y={40} fill="#C9D8E8" fontSize="12">S</SvgText>
        <SvgText x={WIDTH * 0.72} y={CENTER_Y - 70} fill="#C9D8E8" fontSize="12">W</SvgText>
        <SvgText x={WIDTH - 26} y={CENTER_Y + 18} fill="#C9D8E8" fontSize="12">N</SvgText>
        {currentPoint === null ? null : (
          <Circle cx={currentPoint.x} cy={currentPoint.y} r={6} fill="#FFF4CC" stroke="#F4A623" strokeWidth={2} />
        )}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0A1628',
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
