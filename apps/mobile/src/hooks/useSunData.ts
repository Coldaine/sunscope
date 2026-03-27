import { startTransition, useDeferredValue, useEffect, useState } from 'react';
import { Logger, SunSample, SunTimes, getSunPosition, getSunTimes, sampleSunDay } from '@sunscope/core';

export interface UseSunDataResult {
  currentPosition: {
    azimuth: number;
    altitude: number;
  };
  sunTimes: SunTimes;
  samples: SunSample[];
}

export function useSunData(
  latitude: number,
  longitude: number,
  selectedDate: Date,
  logger: Logger
): UseSunDataResult {
  const deferredDate = useDeferredValue(selectedDate);
  const [data, setData] = useState<UseSunDataResult>(() => ({
    currentPosition: getSunPosition(latitude, longitude, deferredDate, logger.child('solar-engine')),
    sunTimes: getSunTimes(latitude, longitude, deferredDate, logger.child('solar-engine')),
    samples: sampleSunDay(latitude, longitude, deferredDate, 5, logger.child('sun-day-sampler'))
  }));

  useEffect(() => {
    const nextData: UseSunDataResult = {
      currentPosition: getSunPosition(latitude, longitude, deferredDate, logger.child('solar-engine')),
      sunTimes: getSunTimes(latitude, longitude, deferredDate, logger.child('solar-engine')),
      samples: sampleSunDay(latitude, longitude, deferredDate, 5, logger.child('sun-day-sampler'))
    };
    startTransition(() => {
      setData(nextData);
    });
  }, [deferredDate, latitude, logger, longitude]);

  return data;
}
