/**
 * @module location-store
 * @description Pure TypeScript location store for SunScope. No React Native imports.
 * Serializable to JSON. Default location is Hendersonville, TN.
 *
 * Conventions: lat in [-90, 90], lon in [-180, 180].
 * Timezone lookup is deferred to the phase classifier / view layer.
 */

import { Logger, DefaultLogger } from './logger';

export interface Location {
  lat: number;
  lon: number;
  label?: string;
  timezone?: string;
}

export class LocationValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LocationValidationError';
  }
}

/** Hendersonville, TN — the app's default location. */
export const DEFAULT_LOCATION: Location = {
  lat: 36.3048,
  lon: -86.5974,
  label: 'Hendersonville, TN',
  timezone: 'America/Chicago',
};

/**
 * Validates lat/lon ranges. Throws LocationValidationError on bad input.
 * Pure function, no side effects.
 */
export function validateLocation(loc: Location, log: Logger = new DefaultLogger('location-store')): Location {
  if (loc.lat < -90 || loc.lat > 90) {
    const msg = `Invalid latitude ${loc.lat}: must be in [-90, 90]`;
    log.error(msg, { lat: loc.lat });
    throw new LocationValidationError(msg);
  }
  if (loc.lon < -180 || loc.lon > 180) {
    const msg = `Invalid longitude ${loc.lon}: must be in [-180, 180]`;
    log.error(msg, { lon: loc.lon });
    throw new LocationValidationError(msg);
  }
  log.debug('Location validated', { lat: loc.lat, lon: loc.lon });
  return loc;
}

/** Serialize a Location to a plain JSON-safe object. */
export function serializeLocation(loc: Location): Record<string, unknown> {
  return {
    lat: loc.lat,
    lon: loc.lon,
    ...(loc.label !== undefined ? { label: loc.label } : {}),
    ...(loc.timezone !== undefined ? { timezone: loc.timezone } : {}),
  };
}

/** Deserialize a plain object back to a Location, with validation. */
export function deserializeLocation(obj: Record<string, unknown>, log?: Logger): Location {
  const loc: Location = {
    lat: typeof obj.lat === 'number' ? obj.lat : Number(obj.lat),
    lon: typeof obj.lon === 'number' ? obj.lon : Number(obj.lon),
    ...(typeof obj.label === 'string' ? { label: obj.label } : {}),
    ...(typeof obj.timezone === 'string' ? { timezone: obj.timezone } : {}),
  };
  return validateLocation(loc, log);
}
