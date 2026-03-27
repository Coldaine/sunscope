import { startTransition, useEffect, useState } from 'react';
import type { LocationObject } from 'expo-location';
import {
  Logger,
  LocationState,
  createLocationState,
  setCurrentLocation,
  setManualLocation
} from '@sunscope/core';

type ExpoLocationModule = typeof import('expo-location');

function locationToState(locationState: LocationState, current: LocationObject): LocationState {
  return setCurrentLocation(locationState, {
    latitude: current.coords.latitude,
    longitude: current.coords.longitude,
    source: 'GPS',
    timestamp: new Date(current.timestamp)
  });
}

export function useLocation(logger: Logger): LocationState {
  const [state, setState] = useState<LocationState>(createLocationState(logger.child('location-store')));

  useEffect(() => {
    let active = true;

    async function resolveLocation(): Promise<void> {
      try {
        const locationModule: ExpoLocationModule = await import('expo-location');
        const permission = await locationModule.requestForegroundPermissionsAsync();
        if (permission.status !== 'granted') {
          logger.warn('useLocation.permissionDenied', { status: permission.status });
          startTransition(() => {
            setState((currentState) => setManualLocation(currentState, null, logger.child('location-store')));
          });
          return;
        }

        const current = await locationModule.getCurrentPositionAsync({});
        if (!active) {
          return;
        }

        startTransition(() => {
          setState((currentState) => locationToState(currentState, current));
        });
      } catch (error) {
        logger.warn('useLocation.unavailable', {
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    void resolveLocation();

    return () => {
      active = false;
    };
  }, [logger]);

  return state;
}
