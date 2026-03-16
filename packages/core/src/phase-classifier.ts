/**
 * @module phase-classifier
 * @description Classifies a sun position into a named solar phase.
 *
 * Dependencies: @sunscope/core/solar-engine (for golden hour times), suncalc via solar-engine
 * Conventions:
 *   - All altitudes in degrees
 *   - All timestamps are UTC Date objects
 *   - Blue hour is NOT in suncalc; compute from altitude band -6° to -4° AND within 45 min of sunrise/sunset
 *   - Golden hour: uses suncalc's goldenHour / goldenHourEnd times
 *
 * Phase priority (highest to lowest):
 *   Night → Astronomical twilight → Nautical twilight → Civil twilight / Blue Hour → Golden Hour → Day
 */

import { Logger, DefaultLogger } from './logger';
import { SunTimes } from './core-types';

export type SunPhase =
  | 'night'
  | 'astronomical_twilight'
  | 'nautical_twilight'
  | 'blue_hour'
  | 'civil_twilight'
  | 'golden_hour'
  | 'day';

export interface PhaseClassification {
  phase: SunPhase;
  altitudeDeg: number;
}

const BLUE_HOUR_LOW_DEG = -6;
const BLUE_HOUR_HIGH_DEG = -4;
const BLUE_HOUR_WINDOW_MS = 45 * 60 * 1000; // 45 minutes in ms

/**
 * Classify the sun phase at the given time given sun altitude and the day's sun times.
 *
 * @param altitudeDeg Current sun altitude in degrees
 * @param date UTC Date of the current moment
 * @param sunTimes SunTimes from getSunTimes() for that day
 * @param log Injectable logger
 */
export function classifySunPhase(
  altitudeDeg: number,
  date: Date,
  sunTimes: SunTimes,
  log: Logger = new DefaultLogger('phase-classifier')
): PhaseClassification {
  const start = Date.now();
  let phase: SunPhase;

  const t = date.getTime();
  const sunrise = sunTimes.sunrise.getTime();
  const sunset = sunTimes.sunset.getTime();
  const goldenHourEnd = sunTimes.goldenHourEnd.getTime();
  const goldenHour = sunTimes.goldenHour.getTime();
  const nightEnd = sunTimes.nightEnd.getTime();
  const night = sunTimes.night.getTime();
  const nauticalDawn = sunTimes.nauticalDawn.getTime();
  const nauticalDusk = sunTimes.nauticalDusk.getTime();

  const nearSunrise = Math.abs(t - sunrise) <= BLUE_HOUR_WINDOW_MS;
  const nearSunset = Math.abs(t - sunset) <= BLUE_HOUR_WINDOW_MS;

  if (altitudeDeg > 6) {
    // Above golden hour band — full daylight unless in golden hour window
    if (t <= goldenHourEnd || t >= goldenHour) {
      phase = 'golden_hour';
      log.debug('Phase: golden_hour (suncalc window)', { altitudeDeg, elapsedMs: Date.now() - start });
    } else {
      phase = 'day';
      log.debug('Phase: day', { altitudeDeg, elapsedMs: Date.now() - start });
    }
  } else if (altitudeDeg >= 0) {
    // Low sun: could be golden hour or civil twilight
    if (t <= goldenHourEnd || t >= goldenHour) {
      phase = 'golden_hour';
    } else {
      phase = 'civil_twilight';
    }
    log.debug('Phase: golden/civil (low positive)', { altitudeDeg, phase, elapsedMs: Date.now() - start });
  } else if (altitudeDeg >= BLUE_HOUR_LOW_DEG && altitudeDeg <= BLUE_HOUR_HIGH_DEG && (nearSunrise || nearSunset)) {
    // Blue hour band: -6° to -4° AND within 45 min of sunrise/sunset
    phase = 'blue_hour';
    log.debug('Phase: blue_hour', { altitudeDeg, nearSunrise, nearSunset, elapsedMs: Date.now() - start });
  } else if (altitudeDeg >= -6) {
    phase = 'civil_twilight';
    log.debug('Phase: civil_twilight', { altitudeDeg, elapsedMs: Date.now() - start });
  } else if (t >= nauticalDawn && t <= nauticalDusk) {
    phase = 'nautical_twilight';
    log.debug('Phase: nautical_twilight', { altitudeDeg, elapsedMs: Date.now() - start });
  } else if (t >= nightEnd && t <= night) {
    phase = 'astronomical_twilight';
    log.debug('Phase: astronomical_twilight', { altitudeDeg, elapsedMs: Date.now() - start });
  } else {
    phase = 'night';
    log.debug('Phase: night', { altitudeDeg, elapsedMs: Date.now() - start });
  }

  return { phase, altitudeDeg };
}
