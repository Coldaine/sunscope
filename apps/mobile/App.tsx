/**
 * @fileoverview Expo application shell for SunScope.
 *
 * This app wires the monorepo packages together for Expo web and device usage.
 * It keeps AR imports out of the top level, drives core computations through
 * hooks, and exposes a hidden triple-tap gesture that reveals the debug screen.
 */

import React, { useRef, useState } from 'react';
import { Modal, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import SunCalc from 'suncalc';
import { StatusBar } from 'expo-status-bar';
import { DebugScreen, ShadowSheet } from '@sunscope/ui';
import { calculateShadow, suncalcToCompass } from '@sunscope/core';
import { useHeading } from './src/hooks/useHeading';
import { useLocation } from './src/hooks/useLocation';
import { useSunData } from './src/hooks/useSunData';
import { BottomTabs } from './src/navigation';
import { DayScreen } from './src/screens/DayScreen';
import { NowScreen } from './src/screens/NowScreen';
import { PlaceScreen } from './src/screens/PlaceScreen';
import { AppStateProvider, useAppState } from './src/state';
import { BufferedLogSink, createAppLogger } from './src/state/logging';

function findClosestSampleAzimuth(
  targetDate: Date,
  samples: Array<{ date: Date; azimuth: number }>
): number {
  return samples.reduce((closestSample, sample) => {
    const closestDelta = Math.abs(closestSample.date.getTime() - targetDate.getTime());
    const sampleDelta = Math.abs(sample.date.getTime() - targetDate.getTime());
    return sampleDelta < closestDelta ? sample : closestSample;
  }, samples[0]).azimuth;
}

function AppShell(): React.JSX.Element {
  const sinkRef = useRef(new BufferedLogSink(20));
  const loggerRef = useRef(createAppLogger(sinkRef.current));
  const logger = loggerRef.current;
  const appState = useAppState();
  const [heightValue, setHeightValue] = useState('2');
  const [unit, setUnit] = useState<'feet' | 'meters'>('meters');
  const [tapCount, setTapCount] = useState(0);
  const headingState = useHeading(logger);
  const locationState = useLocation(logger);
  const sunData = useSunData(
    locationState.current.latitude,
    locationState.current.longitude,
    appState.selectedDate,
    logger
  );
  const rawPosition = SunCalc.getPosition(
    appState.selectedDate,
    locationState.current.latitude,
    locationState.current.longitude
  );

  React.useEffect(() => {
    appState.setCurrentLocation(locationState);
  }, [appState, locationState]);

  const currentSample = sunData.samples.reduce((closest, sample) => {
    const previousDelta = Math.abs(closest.date.getTime() - appState.selectedDate.getTime());
    const nextDelta = Math.abs(sample.date.getTime() - appState.selectedDate.getTime());
    return nextDelta < previousDelta ? sample : closest;
  }, sunData.samples[0]);

  const shadowHeightMeters = unit === 'meters' ? Number(heightValue || '0') : Number(heightValue || '0') * 0.3048;
  const shadowResult = calculateShadow(
    shadowHeightMeters,
    currentSample.altitude,
    currentSample.azimuth,
    logger.child('shadow-calculator')
  );

  const locationLabel = `${locationState.current.latitude.toFixed(4)}, ${locationState.current.longitude.toFixed(4)}`;

  function handleTripleTap(): void {
    const nextTapCount = tapCount + 1;
    setTapCount(nextTapCount);
    if (nextTapCount >= 3) {
      appState.setDebugVisible(!appState.debugVisible);
      setTapCount(0);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.brand}>SunScope</Text>
        <BottomTabs activeTab={appState.activeTab} onSelectTab={appState.setActiveTab} />
        <View style={styles.screenHost}>
          {appState.activeTab === 'Now' ? (
            <NowScreen
              currentTime={appState.selectedDate}
              currentSample={currentSample}
              samples={sunData.samples}
              sunTimes={sunData.sunTimes}
              onOpenShadow={() => appState.setShadowOpen(true)}
            />
          ) : null}
          {appState.activeTab === 'Day' ? (
            <DayScreen
              currentTime={appState.selectedDate}
              samples={sunData.samples}
              sunTimes={sunData.sunTimes}
              onChangeTime={(date) => {
                appState.setMode('scrubbed');
                appState.setSelectedDate(date);
              }}
              onOpenShadow={() => appState.setShadowOpen(true)}
            />
          ) : null}
          {appState.activeTab === 'Place' ? (
            <PlaceScreen
              locationLabel={locationLabel}
              sunriseAzimuth={findClosestSampleAzimuth(sunData.sunTimes.sunrise, sunData.samples)}
              solarNoonAzimuth={sunData.currentPosition.azimuth}
              sunsetAzimuth={findClosestSampleAzimuth(sunData.sunTimes.sunset, sunData.samples)}
            />
          ) : null}
        </View>
        {appState.debugVisible ? (
          <DebugScreen
            rawAzimuthRad={rawPosition.azimuth}
            convertedAzimuthDeg={suncalcToCompass(rawPosition.azimuth, logger.child('solar-convert'))}
            headingState={headingState}
            locationText={locationLabel}
            logs={sinkRef.current.entries.map((entry) => ({
              timestamp: entry.timestamp,
              module: entry.module,
              level: entry.level,
              message: entry.message
            }))}
          />
        ) : null}
        <Pressable onPress={handleTripleTap}>
          <Text style={styles.version}>v1.0.0</Text>
        </Pressable>
      </ScrollView>
      <Modal visible={appState.shadowOpen} transparent={true} animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <ShadowSheet
              shadowResult={shadowResult}
              heightValue={heightValue}
              unit={unit}
              onHeightChange={setHeightValue}
              onUnitChange={setUnit}
            />
            <Pressable style={styles.closeButton} onPress={() => appState.setShadowOpen(false)}>
              <Text style={styles.closeButtonText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

export default function App(): React.JSX.Element {
  return (
    <AppStateProvider>
      <AppShell />
    </AppStateProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#06101D'
  },
  container: {
    padding: 18,
    gap: 18
  },
  brand: {
    color: '#F3F8FF',
    fontSize: 34,
    fontWeight: '800'
  },
  screenHost: {
    gap: 16
  },
  version: {
    color: '#7388A0',
    textAlign: 'center',
    paddingVertical: 12
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)'
  },
  modalCard: {
    backgroundColor: '#08111F',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    gap: 16
  },
  closeButton: {
    backgroundColor: '#F4A623',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center'
  },
  closeButtonText: {
    color: '#08111F',
    fontWeight: '700'
  }
});
