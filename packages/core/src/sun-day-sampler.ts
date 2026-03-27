/**
 * @fileoverview Day-wide solar sample generation.
 *
 * This module precomputes a UTC day's solar samples at a fixed interval using
 * the solar engine and phase classifier. The result shape is the canonical data
 * contract consumed by AR, sky-detection, and UI packages.
 */

import { Logger, createLogger, measureElapsedMs } from './logger';
import { getSunPosition, getSunTimes } from './solar-engine';
import { classifySunPhase } from './phase-classifier';
import { SunSample } from './types';

function getLogger(logger?: Logger): Logger {
  return logger ?? createLogger({ moduleName: 'sun-day-sampler' });
}

function createUtcDayStart(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0));
}

export function sampleSunDay(
  latitude: number,
  longitude: number,
  date: Date,
  intervalMinutes = 5,
  logger?: Logger
): SunSample[] {
  const moduleLogger = getLogger(logger);
  const startTime = process.hrtime.bigint();
  moduleLogger.debug('sampleSunDay.entry', {
    coordinatesRedacted: true,
    date: date.toISOString(),
    intervalMinutes
  });

  if (intervalMinutes <= 0 || 1440 % intervalMinutes !== 0) {
    moduleLogger.error('sampleSunDay.invalidInterval', { intervalMinutes });
    throw new Error('Interval minutes must be a positive divisor of 1440');
  }

  const dayStart = createUtcDayStart(date);
  const sampleCount = 1440 / intervalMinutes;
  const sunTimes = getSunTimes(latitude, longitude, date, moduleLogger.child('solar-engine'));
  const samples: SunSample[] = [];

  for (let index = 0; index < sampleCount; index += 1) {
    const sampleDate = new Date(dayStart.getTime() + index * intervalMinutes * 60_000);
    const position = getSunPosition(latitude, longitude, sampleDate, moduleLogger.child('solar-engine'));
    const phase = classifySunPhase(sampleDate, position.altitude, sunTimes, moduleLogger.child('phase-classifier'));

    samples.push({
      date: sampleDate,
      azimuth: position.azimuth,
      altitude: position.altitude,
      phase
    });
  }

  moduleLogger.debug('sampleSunDay.exit', {
    coordinatesRedacted: true,
    date: date.toISOString(),
    intervalMinutes,
    sampleCount: samples.length,
    firstSample: samples[0]?.date.toISOString(),
    lastSample: samples[samples.length - 1]?.date.toISOString(),
    elapsedMs: measureElapsedMs(startTime)
  });

  return samples;
}
