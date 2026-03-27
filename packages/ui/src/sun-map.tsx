/**
 * @fileoverview Map-style directional ray preview with a draggable pin.
 */

import React, { useState } from 'react';
import { PanResponder, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Text as SvgText } from 'react-native-svg';
import { SunMapProps } from './types';

const SIZE = 280;

function rayEndpoint(centerX: number, centerY: number, azimuth: number, radius: number): { x: number; y: number } {
  const radians = (azimuth * Math.PI) / 180;
  return {
    x: centerX + radius * Math.sin(radians),
    y: centerY - radius * Math.cos(radians)
  };
}

export function SunMap(props: SunMapProps): React.JSX.Element {
  const [pin, setPin] = useState({ x: SIZE / 2, y: SIZE / 2 });
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: (_event, gestureState) => {
      setPin((current) => ({
        x: Math.max(40, Math.min(SIZE - 40, current.x + gestureState.dx * 0.02)),
        y: Math.max(40, Math.min(SIZE - 40, current.y + gestureState.dy * 0.02))
      }));
    }
  });

  const sunrise = rayEndpoint(pin.x, pin.y, props.sunriseAzimuth, 96);
  const solarNoon = rayEndpoint(pin.x, pin.y, props.solarNoonAzimuth, 82);
  const sunset = rayEndpoint(pin.x, pin.y, props.sunsetAzimuth, 96);

  return (
    <View style={styles.card} {...panResponder.panHandlers}>
      <Text style={styles.title}>Sun Map</Text>
      <Text style={styles.subtitle}>{props.locationLabel}</Text>
      <Svg width={SIZE} height={SIZE}>
        <Line x1={pin.x} y1={pin.y} x2={sunrise.x} y2={sunrise.y} stroke="#F4A623" strokeWidth={3} />
        <Line x1={pin.x} y1={pin.y} x2={solarNoon.x} y2={solarNoon.y} stroke="#F7D24C" strokeWidth={3} />
        <Line x1={pin.x} y1={pin.y} x2={sunset.x} y2={sunset.y} stroke="#4A90D9" strokeWidth={3} />
        <Circle cx={pin.x} cy={pin.y} r={10} fill="#F3F8FF" stroke="#0A1628" strokeWidth={2} />
        <SvgText x={sunrise.x + 4} y={sunrise.y} fill="#F4A623" fontSize="12">Rise</SvgText>
        <SvgText x={solarNoon.x + 4} y={solarNoon.y} fill="#F7D24C" fontSize="12">Noon</SvgText>
        <SvgText x={sunset.x + 4} y={sunset.y} fill="#4A90D9" fontSize="12">Set</SvgText>
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
    fontWeight: '600'
  },
  subtitle: {
    color: '#9FB5CC',
    marginBottom: 8
  }
});
