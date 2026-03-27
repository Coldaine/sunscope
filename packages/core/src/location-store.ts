/**
 * @fileoverview Serializable location state management.
 *
 * This module holds current, manual, and favorite locations as plain
 * TypeScript data with explicit validation and JSON-safe serialization rules.
 */

import { Logger, createLogger, measureElapsedMs } from './logger';
import {
  Coordinates,
  CurrentLocation,
  LocationState,
  ManualLocation,
  SavedLocation,
  SerializedLocationState
} from './types';

export const DEFAULT_LOCATION: CurrentLocation = {
  latitude: 36.3048,
  longitude: -86.5974,
  source: 'default',
  timestamp: new Date('2026-03-16T00:00:00Z')
};

function getLogger(logger?: Logger): Logger {
  return logger ?? createLogger({ moduleName: 'location-store' });
}

function summarizeCurrentLocation(location: CurrentLocation): Record<string, unknown> {
  return {
    source: location.source,
    timestamp: location.timestamp.toISOString()
  };
}

function summarizeManualLocation(manual: ManualLocation | null): Record<string, unknown> {
  if (manual === null) {
    return { manual: null };
  }

  return {
    name: manual.name
  };
}

function assertCoordinateRange(name: 'latitude' | 'longitude', value: number): void {
  const [min, max] = name === 'latitude' ? [-90, 90] : [-180, 180];
  if (!Number.isFinite(value) || value < min || value > max) {
    throw new Error(`Invalid ${name}: expected ${min}..${max}`);
  }
}

export function validateCoordinates(coordinates: Coordinates, logger?: Logger): Coordinates {
  const moduleLogger = getLogger(logger);
  const startTime = process.hrtime.bigint();
  moduleLogger.debug('validateCoordinates.entry', {
    coordinatesRedacted: true
  });

  assertCoordinateRange('latitude', coordinates.latitude);
  assertCoordinateRange('longitude', coordinates.longitude);

  moduleLogger.debug('validateCoordinates.exit', {
    elapsedMs: measureElapsedMs(startTime)
  });
  return coordinates;
}

export function createLocationState(logger?: Logger): LocationState {
  const moduleLogger = getLogger(logger);
  moduleLogger.info('createLocationState.default', summarizeCurrentLocation(DEFAULT_LOCATION));
  return {
    current: { ...DEFAULT_LOCATION },
    manual: null,
    favorites: []
  };
}

export function setCurrentLocation(
  state: LocationState,
  location: CurrentLocation,
  logger?: Logger
): LocationState {
  const moduleLogger = getLogger(logger);
  validateCoordinates(location, moduleLogger);
  moduleLogger.info('setCurrentLocation', {
    from: summarizeCurrentLocation(state.current),
    to: summarizeCurrentLocation(location)
  });
  return {
    ...state,
    current: { ...location }
  };
}

export function setManualLocation(
  state: LocationState,
  manual: ManualLocation | null,
  logger?: Logger
): LocationState {
  const moduleLogger = getLogger(logger);
  const startTime = process.hrtime.bigint();
  if (manual !== null) {
    validateCoordinates(manual, moduleLogger);
  }
  moduleLogger.info('setManualLocation', {
    previous: summarizeManualLocation(state.manual),
    next: summarizeManualLocation(manual),
    elapsedMs: measureElapsedMs(startTime)
  });
  return {
    ...state,
    manual: manual === null ? null : { ...manual }
  };
}

export function addFavoriteLocation(
  state: LocationState,
  favorite: SavedLocation,
  logger?: Logger
): LocationState {
  const moduleLogger = getLogger(logger);
  const startTime = process.hrtime.bigint();
  validateCoordinates(favorite, moduleLogger);
  moduleLogger.info('addFavoriteLocation', {
    id: favorite.id,
    name: favorite.name
  });
  return {
    ...state,
    favorites: [...state.favorites, { ...favorite }]
  };
}

export function serializeLocationState(state: LocationState, logger?: Logger): string {
  const moduleLogger = getLogger(logger);
  const startTime = process.hrtime.bigint();
  const serialized: SerializedLocationState = {
    current: {
      ...state.current,
      timestamp: state.current.timestamp.toISOString()
    },
    manual: state.manual === null ? null : { ...state.manual },
    favorites: state.favorites.map((favorite) => ({
      ...favorite,
      createdAt: favorite.createdAt.toISOString()
    }))
  };
  const json = JSON.stringify(serialized);
  moduleLogger.debug('serializeLocationState.exit', {
    favoritesCount: state.favorites.length,
    length: json.length,
    elapsedMs: measureElapsedMs(startTime)
  });
  return json;
}

export function deserializeLocationState(payload: string, logger?: Logger): LocationState {
  const moduleLogger = getLogger(logger);
  const startTime = process.hrtime.bigint();
  const parsed = JSON.parse(payload) as SerializedLocationState;
  const state: LocationState = {
    current: {
      ...parsed.current,
      timestamp: new Date(parsed.current.timestamp)
    },
    manual: parsed.manual,
    favorites: parsed.favorites.map((favorite) => ({
      ...favorite,
      createdAt: new Date(favorite.createdAt)
    }))
  };
  moduleLogger.debug('deserializeLocationState.exit', {
    favoritesCount: state.favorites.length,
    elapsedMs: measureElapsedMs(startTime)
  });
  return state;
}
