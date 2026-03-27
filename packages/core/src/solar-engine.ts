/**
 * @fileoverview suncalc wrapper for SunScope.
 *
 * This module is the single integration point with `suncalc`. It converts raw
 * outputs into SunScope conventions and logs the raw and converted values for
 * every computation so downstream modules remain deterministic and traceable.
 */

import SunCalc from 'suncalc';
import { Logger, createLogger, measureElapsedMs } from './logger';
import { SunPosition, SunTimes } from './types';
import { radToDeg, suncalcToCompass } from './solar-convert';

const SEARCH_STEP_MS = 5 * 60 * 1000;
const CROSSING_SEARCH_WINDOW_MS = 18 * 60 * 60 * 1000;
const SOLAR_NOON_WINDOW_MS = 60 * 60 * 1000;
const NOON_SEARCH_ITERATIONS = 40;
const CROSSING_SEARCH_ITERATIONS = 35;
const SUNRISE_ALTITUDE_DEGREES = -0.833;
const DAWN_ALTITUDE_DEGREES = -6;
const NAUTICAL_ALTITUDE_DEGREES = -12;
const NIGHT_ALTITUDE_DEGREES = -18;
const GOLDEN_HOUR_ALTITUDE_DEGREES = 6;

interface ThresholdSearchResult {
  date: Date;
  fallbackUsed: boolean;
}

function getLogger(logger?: Logger): Logger {
  return logger ?? createLogger({ moduleName: 'solar-engine' });
}

function describeDate(date: Date): string {
  return Number.isNaN(date.getTime()) ? String(date) : date.toISOString();
}

function validateCoordinate(name: 'latitude' | 'longitude', value: number, logger: Logger): void {
  if (!Number.isFinite(value)) {
    logger.error('validateCoordinate.invalid', { name, valueRedacted: true });
    throw new Error(`Invalid ${name}: must be finite`);
  }
}

function validateDate(date: Date, logger: Logger): void {
  if (Number.isNaN(date.getTime())) {
    logger.error('validateDate.invalid', { received: String(date) });
    throw new Error('Invalid date: expected a valid UTC Date');
  }
}

export function getSunPosition(
  latitude: number,
  longitude: number,
  date: Date,
  logger?: Logger
): SunPosition {
  const moduleLogger = getLogger(logger);
  const startTime = process.hrtime.bigint();
  moduleLogger.debug('getSunPosition.entry', {
    coordinatesRedacted: true,
    date: describeDate(date)
  });

  validateCoordinate('latitude', latitude, moduleLogger);
  validateCoordinate('longitude', longitude, moduleLogger);
  validateDate(date, moduleLogger);

  const rawPosition = SunCalc.getPosition(date, latitude, longitude);
  const azimuth = suncalcToCompass(rawPosition.azimuth, moduleLogger.child('solar-convert'));
  const altitude = radToDeg(rawPosition.altitude, moduleLogger.child('solar-convert'));

  if (!Number.isFinite(azimuth) || !Number.isFinite(altitude)) {
    moduleLogger.error('getSunPosition.nan', {
      rawAzimuthRad: rawPosition.azimuth,
      rawAltitudeRad: rawPosition.altitude,
      azimuth,
      altitude
    });
    throw new Error('suncalc returned invalid sun position');
  }

  moduleLogger.debug('getSunPosition.exit', {
    raw: {
      azimuthRad: rawPosition.azimuth,
      altitudeRad: rawPosition.altitude
    },
    converted: {
      azimuth,
      altitude
    },
    elapsedMs: measureElapsedMs(startTime)
  });

  return { azimuth, altitude };
}

function getAltitudeDegreesAt(date: Date, latitude: number, longitude: number): number {
  return radToDeg(SunCalc.getPosition(date, latitude, longitude).altitude);
}

function findSolarNoon(
  approximateSolarNoon: Date,
  latitude: number,
  longitude: number,
  logger: Logger
): Date {
  let left = approximateSolarNoon.getTime() - SOLAR_NOON_WINDOW_MS;
  let right = approximateSolarNoon.getTime() + SOLAR_NOON_WINDOW_MS;

  for (let index = 0; index < NOON_SEARCH_ITERATIONS; index += 1) {
    const leftThird = left + (right - left) / 3;
    const rightThird = right - (right - left) / 3;
    const leftAltitude = getAltitudeDegreesAt(new Date(leftThird), latitude, longitude);
    const rightAltitude = getAltitudeDegreesAt(new Date(rightThird), latitude, longitude);

    if (leftAltitude < rightAltitude) {
      left = leftThird;
    } else {
      right = rightThird;
    }
  }

  const refinedSolarNoon = new Date((left + right) / 2);
  logger.debug('findSolarNoon.exit', {
    approximateSolarNoon: approximateSolarNoon.toISOString(),
    refinedSolarNoon: refinedSolarNoon.toISOString(),
    searchWindowMinutes: (2 * SOLAR_NOON_WINDOW_MS) / 60_000
  });
  return refinedSolarNoon;
}

function findBracket(
  startTimeMs: number,
  endTimeMs: number,
  thresholdDegrees: number,
  latitude: number,
  longitude: number,
  ascending: boolean
): [number, number] | null {
  let previousTimeMs = startTimeMs;
  let previousAltitude = getAltitudeDegreesAt(new Date(previousTimeMs), latitude, longitude);

  for (let currentTimeMs = startTimeMs + SEARCH_STEP_MS; currentTimeMs <= endTimeMs; currentTimeMs += SEARCH_STEP_MS) {
    const currentAltitude = getAltitudeDegreesAt(new Date(currentTimeMs), latitude, longitude);
    const crossedThreshold = ascending
      ? previousAltitude < thresholdDegrees && currentAltitude >= thresholdDegrees
      : previousAltitude > thresholdDegrees && currentAltitude <= thresholdDegrees;

    if (crossedThreshold) {
      return [previousTimeMs, currentTimeMs];
    }

    previousTimeMs = currentTimeMs;
    previousAltitude = currentAltitude;
  }

  return null;
}

function refineThresholdCrossing(
  bracket: [number, number],
  thresholdDegrees: number,
  latitude: number,
  longitude: number,
  ascending: boolean
): Date {
  let [left, right] = bracket;

  for (let index = 0; index < CROSSING_SEARCH_ITERATIONS; index += 1) {
    const midpoint = (left + right) / 2;
    const midpointAltitude = getAltitudeDegreesAt(new Date(midpoint), latitude, longitude);
    const moveRight = ascending ? midpointAltitude < thresholdDegrees : midpointAltitude > thresholdDegrees;

    if (moveRight) {
      left = midpoint;
    } else {
      right = midpoint;
    }
  }

  return new Date((left + right) / 2);
}

function resolveThresholdEvent(
  eventName: keyof Pick<
    SunTimes,
    'sunrise' | 'sunset' | 'dawn' | 'dusk' | 'nauticalDawn' | 'nauticalDusk' | 'nightEnd' | 'night' | 'goldenHour' | 'goldenHourEnd'
  >,
  thresholdDegrees: number,
  solarNoon: Date,
  latitude: number,
  longitude: number,
  fallback: Date,
  ascending: boolean,
  logger: Logger
): ThresholdSearchResult {
  const startTimeMs = ascending
    ? solarNoon.getTime() - CROSSING_SEARCH_WINDOW_MS
    : solarNoon.getTime();
  const endTimeMs = ascending
    ? solarNoon.getTime()
    : solarNoon.getTime() + CROSSING_SEARCH_WINDOW_MS;
  const bracket = findBracket(startTimeMs, endTimeMs, thresholdDegrees, latitude, longitude, ascending);

  if (bracket === null) {
    logger.warn('resolveThresholdEvent.fallback', {
      eventName,
      thresholdDegrees,
      direction: ascending ? 'ascending' : 'descending',
      fallback: fallback.toISOString()
    });
    return {
      date: fallback,
      fallbackUsed: true
    };
  }

  const resolvedDate = refineThresholdCrossing(bracket, thresholdDegrees, latitude, longitude, ascending);
  logger.debug('resolveThresholdEvent.exit', {
    eventName,
    thresholdDegrees,
    direction: ascending ? 'ascending' : 'descending',
    bracketStart: new Date(bracket[0]).toISOString(),
    bracketEnd: new Date(bracket[1]).toISOString(),
    resolvedDate: resolvedDate.toISOString()
  });

  return {
    date: resolvedDate,
    fallbackUsed: false
  };
}

export function getSunTimes(
  latitude: number,
  longitude: number,
  date: Date,
  logger?: Logger
): SunTimes {
  const moduleLogger = getLogger(logger);
  const startTime = process.hrtime.bigint();
  moduleLogger.debug('getSunTimes.entry', {
    coordinatesRedacted: true,
    date: describeDate(date)
  });

  validateCoordinate('latitude', latitude, moduleLogger);
  validateCoordinate('longitude', longitude, moduleLogger);
  validateDate(date, moduleLogger);

  const rawTimes = SunCalc.getTimes(date, latitude, longitude);
  const refinedSolarNoon = findSolarNoon(
    rawTimes.solarNoon,
    latitude,
    longitude,
    moduleLogger.child('solar-noon')
  );
  const sunrise = resolveThresholdEvent(
    'sunrise',
    SUNRISE_ALTITUDE_DEGREES,
    refinedSolarNoon,
    latitude,
    longitude,
    rawTimes.sunrise,
    true,
    moduleLogger.child('sunrise')
  );
  const sunset = resolveThresholdEvent(
    'sunset',
    SUNRISE_ALTITUDE_DEGREES,
    refinedSolarNoon,
    latitude,
    longitude,
    rawTimes.sunset,
    false,
    moduleLogger.child('sunset')
  );
  const dawn = resolveThresholdEvent(
    'dawn',
    DAWN_ALTITUDE_DEGREES,
    refinedSolarNoon,
    latitude,
    longitude,
    rawTimes.dawn,
    true,
    moduleLogger.child('dawn')
  );
  const dusk = resolveThresholdEvent(
    'dusk',
    DAWN_ALTITUDE_DEGREES,
    refinedSolarNoon,
    latitude,
    longitude,
    rawTimes.dusk,
    false,
    moduleLogger.child('dusk')
  );
  const nauticalDawn = resolveThresholdEvent(
    'nauticalDawn',
    NAUTICAL_ALTITUDE_DEGREES,
    refinedSolarNoon,
    latitude,
    longitude,
    rawTimes.nauticalDawn,
    true,
    moduleLogger.child('nauticalDawn')
  );
  const nauticalDusk = resolveThresholdEvent(
    'nauticalDusk',
    NAUTICAL_ALTITUDE_DEGREES,
    refinedSolarNoon,
    latitude,
    longitude,
    rawTimes.nauticalDusk,
    false,
    moduleLogger.child('nauticalDusk')
  );
  const nightEnd = resolveThresholdEvent(
    'nightEnd',
    NIGHT_ALTITUDE_DEGREES,
    refinedSolarNoon,
    latitude,
    longitude,
    rawTimes.nightEnd,
    true,
    moduleLogger.child('nightEnd')
  );
  const night = resolveThresholdEvent(
    'night',
    NIGHT_ALTITUDE_DEGREES,
    refinedSolarNoon,
    latitude,
    longitude,
    rawTimes.night,
    false,
    moduleLogger.child('night')
  );
  const goldenHourEnd = resolveThresholdEvent(
    'goldenHourEnd',
    GOLDEN_HOUR_ALTITUDE_DEGREES,
    refinedSolarNoon,
    latitude,
    longitude,
    rawTimes.goldenHourEnd,
    true,
    moduleLogger.child('goldenHourEnd')
  );
  const goldenHour = resolveThresholdEvent(
    'goldenHour',
    GOLDEN_HOUR_ALTITUDE_DEGREES,
    refinedSolarNoon,
    latitude,
    longitude,
    rawTimes.goldenHour,
    false,
    moduleLogger.child('goldenHour')
  );

  const converted: SunTimes = {
    sunrise: sunrise.date,
    sunset: sunset.date,
    solarNoon: refinedSolarNoon,
    dawn: dawn.date,
    dusk: dusk.date,
    nauticalDawn: nauticalDawn.date,
    nauticalDusk: nauticalDusk.date,
    nightEnd: nightEnd.date,
    night: night.date,
    goldenHour: goldenHour.date,
    goldenHourEnd: goldenHourEnd.date,
    nadir: rawTimes.nadir
  };

  moduleLogger.debug('getSunTimes.exit', {
    raw: {
      sunrise: rawTimes.sunrise.toISOString(),
      sunset: rawTimes.sunset.toISOString(),
      solarNoon: rawTimes.solarNoon.toISOString()
    },
    converted: {
      sunrise: converted.sunrise.toISOString(),
      sunset: converted.sunset.toISOString(),
      solarNoon: converted.solarNoon.toISOString()
    },
    searchSummary: {
      fallbackCount: [
        sunrise,
        sunset,
        dawn,
        dusk,
        nauticalDawn,
        nauticalDusk,
        nightEnd,
        night,
        goldenHour,
        goldenHourEnd
      ].filter((result) => result.fallbackUsed).length
    },
    elapsedMs: measureElapsedMs(startTime)
  });

  return converted;
}
