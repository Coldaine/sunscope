import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SunMap } from '@sunscope/ui';

export interface PlaceScreenProps {
  locationLabel: string;
  sunriseAzimuth: number;
  solarNoonAzimuth: number;
  sunsetAzimuth: number;
}

export function PlaceScreen(props: PlaceScreenProps): React.JSX.Element {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Place</Text>
      <SunMap
        sunriseAzimuth={props.sunriseAzimuth}
        solarNoonAzimuth={props.solarNoonAzimuth}
        sunsetAzimuth={props.sunsetAzimuth}
        locationLabel={props.locationLabel}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 14
  },
  title: {
    color: '#F3F8FF',
    fontSize: 28,
    fontWeight: '700'
  }
});
