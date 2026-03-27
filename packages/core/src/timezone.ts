/**
 * @fileoverview Timezone lookup and formatting utilities.
 *
 * All internal values remain UTC. This module only resolves a location's IANA
 * timezone and prepares display-friendly values for view-layer consumption.
 */

import tzLookup from 'tz-lookup';
import { Logger, createLogger, measureElapsedMs } from './logger';

function getLogger(logger?: Logger): Logger {
  return logger ?? createLogger({ moduleName: 'timezone' });
}

export function getTimeZoneForCoordinates(
  latitude: number,
  longitude: number,
  logger?: Logger
): string {
  const moduleLogger = getLogger(logger);
  const startTime = process.hrtime.bigint();
  moduleLogger.debug('getTimeZoneForCoordinates.entry', {
    coordinatesRedacted: true
  });

  const timeZone = tzLookup(latitude, longitude);

  moduleLogger.debug('getTimeZoneForCoordinates.exit', {
    timeZone,
    elapsedMs: measureElapsedMs(startTime)
  });
  return timeZone;
}

export function formatUtcDateForTimeZone(
  date: Date,
  timeZone: string,
  logger?: Logger
): string {
  const moduleLogger = getLogger(logger);
  const startTime = process.hrtime.bigint();
  const formatted = new Intl.DateTimeFormat('en-US', {
    timeZone,
    dateStyle: 'medium',
    timeStyle: 'short',
    hour12: false
  }).format(date);

  moduleLogger.debug('formatUtcDateForTimeZone.exit', {
    date: date.toISOString(),
    timeZone,
    formatted,
    elapsedMs: measureElapsedMs(startTime)
  });

  return formatted;
}
