/**
 * @fileoverview Solar phase classification.
 *
 * This module classifies a single solar sample into the UI-facing phase bands
 * used across charts, maps, and AR overlays. It depends on `SunTimes` from the
 * solar engine to identify golden hour and a custom blue-hour rule.
 */

import { Logger, createLogger, measureElapsedMs } from './logger';
import { SunPhase, SunTimes } from './types';

const BLUE_HOUR_WINDOW_MS = 45 * 60 * 1000;

function getLogger(logger?: Logger): Logger {
  return logger ?? createLogger({ moduleName: 'phase-classifier' });
}

function isWithinInclusiveRange(value: number, lower: number, upper: number): boolean {
  return value >= lower && value <= upper;
}

function isBetween(date: Date, start: Date, end: Date): boolean {
  return date.getTime() >= start.getTime() && date.getTime() <= end.getTime();
}

function isWithinBlueHourWindow(date: Date, sunrise: Date, sunset: Date): boolean {
  return (
    Math.abs(date.getTime() - sunrise.getTime()) <= BLUE_HOUR_WINDOW_MS ||
    Math.abs(date.getTime() - sunset.getTime()) <= BLUE_HOUR_WINDOW_MS
  );
}

export function classifySunPhase(
  date: Date,
  altitude: number,
  sunTimes: SunTimes,
  logger?: Logger
): SunPhase {
  const moduleLogger = getLogger(logger);
  const startTime = process.hrtime.bigint();
  moduleLogger.debug('classifySunPhase.entry', {
    date: date.toISOString(),
    altitude,
    sunrise: sunTimes.sunrise.toISOString(),
    sunset: sunTimes.sunset.toISOString()
  });

  let phase: SunPhase;
  let trigger: string;

  const morningGoldenHour = isBetween(date, sunTimes.sunrise, sunTimes.goldenHourEnd);
  const eveningGoldenHour = isBetween(date, sunTimes.goldenHour, sunTimes.sunset);
  const blueHour = isWithinInclusiveRange(altitude, -6, -4) &&
    isWithinBlueHourWindow(date, sunTimes.sunrise, sunTimes.sunset);

  if (morningGoldenHour || eveningGoldenHour) {
    phase = 'GoldenHour';
    trigger = morningGoldenHour ? 'morningGoldenHour' : 'eveningGoldenHour';
  } else if (blueHour) {
    phase = 'BlueHour';
    trigger = 'blueHourWindow';
  } else if (altitude >= 0) {
    phase = 'Daylight';
    trigger = 'altitude>=0';
  } else if (altitude >= -6) {
    phase = 'CivilTwilight';
    trigger = 'civilTwilight';
  } else if (altitude >= -12) {
    phase = 'NauticalTwilight';
    trigger = 'nauticalTwilight';
  } else if (altitude >= -18) {
    phase = 'AstronomicalTwilight';
    trigger = 'astronomicalTwilight';
  } else {
    phase = 'Night';
    trigger = 'night';
  }

  moduleLogger.debug('classifySunPhase.exit', {
    date: date.toISOString(),
    altitude,
    phase,
    trigger,
    elapsedMs: measureElapsedMs(startTime)
  });
  return phase;
}
