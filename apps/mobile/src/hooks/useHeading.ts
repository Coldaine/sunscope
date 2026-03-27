import { startTransition, useEffect, useRef, useState } from 'react';
import type { LocationHeadingObject, LocationSubscription } from 'expo-location';
import { HeadingState, HeadingStore, Logger } from '@sunscope/core';

type ExpoLocationModule = typeof import('expo-location');

function buildHeadingSample(event: LocationHeadingObject): { heading: number; headingAccuracy: number } {
  const heading = event.trueHeading >= 0 ? event.trueHeading : event.magHeading;
  return {
    heading,
    headingAccuracy: event.accuracy
  };
}

export function useHeading(logger: Logger): HeadingState {
  const storeRef = useRef(new HeadingStore(logger.child('heading-store')));
  const [state, setState] = useState<HeadingState>(storeRef.current.getState());

  useEffect(() => {
    let active = true;
    let subscription: LocationSubscription | null = null;

    async function startHeadingUpdates(): Promise<void> {
      try {
        const locationModule: ExpoLocationModule = await import('expo-location');
        const permission = await locationModule.requestForegroundPermissionsAsync();
        if (permission.status !== 'granted') {
          logger.warn('useHeading.permissionDenied', { status: permission.status });
          return;
        }

        subscription = await locationModule.watchHeadingAsync((event) => {
          if (!active) {
            return;
          }
          const sample = buildHeadingSample(event);
          const nextState = storeRef.current.update({
            heading: sample.heading,
            headingAccuracy: sample.headingAccuracy,
            timestamp: new Date()
          });
          startTransition(() => {
            setState(nextState);
          });
        });
      } catch (error) {
        logger.warn('useHeading.unavailable', {
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    void startHeadingUpdates();

    return () => {
      active = false;
      subscription?.remove();
    };
  }, [logger]);

  return state;
}
