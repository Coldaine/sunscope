/**
 * @module sun-day-sampler
 * @description Generates a full day of sun position samples at 5-minute intervals.
 *
 * Dependencies: solar-engine (getSunPosition, getSunTimes), phase-classifier
 * Conventions:
 *   - Output: SunSample[] with date (UTC), azimuth (compass deg), altitude (deg), phase
 *   - 288 samples per day at default 5-min interval (24*60/5 = 288)
 *   - Blue hour computed from altitude band −6° to −4° + proximity to suntimes
 *   - Computation time < 200ms, measured and logged
 *
 * Watch Out:
 *   All Date construction uses Z suffix or explicit UTC arithmetic — never local time.
 */

import { Logger, DefaultLogger } from './logger';
import { getSunPosition, getSunTimes } from './solar-engine';
import { classifySunPhase } from './phase-classifier';
import { SunSample } from './types';

export interface SamplerOptions {
  intervalMinutes?: number; // default 5
  log?: Logger;
}

/**
 * Generate sun position samples for a full UTC calendar day.
 *
 * @param lat Latitude
 * @param lon Longitude
 * @param dayDateUtc Any Date within the target day (UTC midnight is used as day anchor)
 * @param opts Optional configuration
 */
export function sampleSunDay(
  lat: number,
  lon: number,
  dayDateUtc: Date,
  opts: SamplerOptions = {}
): SunSample[] {
  const { intervalMinutes = 5, log = new DefaultLogger('sun-day-sampler') } = opts;
  const start = Date.now();

  // Anchor to UTC midnight of the given day
  const anchor = Date.UTC(
    dayDateUtc.getUTCFullYear(),
    dayDateUtc.getUTCMonth(),
    dayDateUtc.getUTCDate(),
    0, 0, 0, 0
  );

  const sunTimes = getSunTimes(lat, lon, new Date(anchor));
  const totalSamples = Math.floor((24 * 60) / intervalMinutes);
  const intervalMs = intervalMinutes * 60 * 1000;

  const samples: SunSample[] = [];

  for (let i = 0; i < totalSamples; i++) {
    const sampleTime = new Date(anchor + i * intervalMs);
    const pos = getSunPosition(lat, lon, sampleTime);
    const phaseResult = classifySunPhase(pos.altitude, sampleTime, sunTimes, log);

    samples.push({
      date: sampleTime,
      azimuth: pos.azimuth,
      altitude: pos.altitude,
      phase: phaseResult.phase,
    });
  }

  const elapsedMs = Date.now() - start;
  log.info('sampleSunDay complete', {
    day: new Date(anchor).toISOString(),
    totalSamples: samples.length,
    intervalMinutes,
    coordinatesRedacted: true,
    elapsedMs,
  });

  if (elapsedMs > 200) {
    log.warn('sampleSunDay exceeded 200ms target', { elapsedMs });
  }

  return samples;
}
