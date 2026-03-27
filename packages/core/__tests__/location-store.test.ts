import {
  DEFAULT_LOCATION,
  addFavoriteLocation,
  createLocationState,
  deserializeLocationState,
  serializeLocationState,
  setCurrentLocation,
  setManualLocation,
  validateCoordinates
} from '../src/location-store';
import { TestLogger, createLogger } from '../src/logger';

describe('location-store', () => {
  it('uses Hendersonville as the default location', () => {
    const state = createLocationState();

    expect(state.current.latitude).toBe(DEFAULT_LOCATION.latitude);
    expect(state.current.longitude).toBe(DEFAULT_LOCATION.longitude);
    expect(state.current.source).toBe('default');
  });

  it('validates coordinate ranges', () => {
    expect(() => validateCoordinates({ latitude: 91, longitude: 0 })).toThrow('Invalid latitude');
    expect(() => validateCoordinates({ latitude: 0, longitude: 181 })).toThrow('Invalid longitude');
  });

  it('updates current and manual locations immutably', () => {
    const state = createLocationState();
    const current = setCurrentLocation(state, {
      latitude: 36.5,
      longitude: -86.6,
      source: 'GPS',
      timestamp: new Date('2026-03-16T12:00:00Z')
    });
    const manual = setManualLocation(current, {
      latitude: 36.4,
      longitude: -86.5,
      name: 'Manual'
    });

    expect(state.current.latitude).toBe(DEFAULT_LOCATION.latitude);
    expect(current.current.latitude).toBe(36.5);
    expect(manual.manual?.name).toBe('Manual');
  });

  it('serializes and deserializes JSON-safe state', () => {
    const state = addFavoriteLocation(createLocationState(), {
      id: 'hendersonville',
      name: 'Hendersonville',
      latitude: 36.3048,
      longitude: -86.5974,
      createdAt: new Date('2026-03-16T00:00:00Z')
    });

    const payload = serializeLocationState(state);
    const restored = deserializeLocationState(payload);

    expect(restored.favorites[0]?.createdAt.toISOString()).toBe('2026-03-16T00:00:00.000Z');
  });

  it('redacts coordinates from location logs', () => {
    const sink = new TestLogger();
    const logger = createLogger({
      moduleName: 'location-store',
      sink
    });
    const state = createLocationState(logger);
    const current = setCurrentLocation(
      state,
      {
        latitude: 12.3456,
        longitude: -78.9012,
        source: 'GPS',
        timestamp: new Date('2026-03-16T12:00:00Z')
      },
      logger
    );

    setManualLocation(
      current,
      {
        latitude: 12.3456,
        longitude: -78.9012,
        name: 'Manual'
      },
      logger
    );

    addFavoriteLocation(
      current,
      {
        id: 'favorite',
        name: 'Favorite',
        latitude: 12.3456,
        longitude: -78.9012,
        createdAt: new Date('2026-03-16T12:00:00Z')
      },
      logger
    );

    const payload = JSON.stringify(sink.entries);
    expect(payload).not.toContain('12.3456');
    expect(payload).not.toContain('-78.9012');
  });
});
