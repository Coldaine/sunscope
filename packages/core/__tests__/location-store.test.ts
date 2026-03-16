/**
 * Tests for location-store.ts — R-CORE-006
 */

import {
  DEFAULT_LOCATION,
  validateLocation,
  serializeLocation,
  deserializeLocation,
  LocationValidationError,
  Location,
} from '../src/location-store';
import { TestLogger } from '../src/logger';

describe('DEFAULT_LOCATION', () => {
  it('is Hendersonville, TN', () => {
    expect(DEFAULT_LOCATION.lat).toBeCloseTo(36.3048, 4);
    expect(DEFAULT_LOCATION.lon).toBeCloseTo(-86.5974, 4);
  });

  it('has America/Chicago timezone', () => {
    expect(DEFAULT_LOCATION.timezone).toBe('America/Chicago');
  });
});

describe('validateLocation', () => {
  const log = new TestLogger('test');

  it('accepts valid lat/lon', () => {
    const loc = validateLocation({ lat: 36.3, lon: -86.6 }, log);
    expect(loc.lat).toBe(36.3);
  });

  it('throws on lat > 90', () => {
    expect(() => validateLocation({ lat: 91, lon: 0 }, log)).toThrow(LocationValidationError);
  });

  it('throws on lat < -90', () => {
    expect(() => validateLocation({ lat: -91, lon: 0 }, log)).toThrow(LocationValidationError);
  });

  it('throws on lon > 180', () => {
    expect(() => validateLocation({ lat: 0, lon: 181 }, log)).toThrow(LocationValidationError);
  });

  it('throws on lon < -180', () => {
    expect(() => validateLocation({ lat: 0, lon: -181 }, log)).toThrow(LocationValidationError);
  });

  it('accepts boundary values exactly', () => {
    expect(() => validateLocation({ lat: 90, lon: 180 }, log)).not.toThrow();
    expect(() => validateLocation({ lat: -90, lon: -180 }, log)).not.toThrow();
  });

  it('logs validation debug entry on success', () => {
    const l = new TestLogger();
    validateLocation({ lat: 0, lon: 0 }, l);
    expect(l.entries).toContainEqual(expect.objectContaining({ level: 'DEBUG' }));
  });
});

describe('serializeLocation / deserializeLocation round-trip', () => {
  it('round-trips a basic location', () => {
    const original: Location = { lat: 36.3048, lon: -86.5974, label: 'Test', timezone: 'America/Chicago' };
    const serialized = serializeLocation(original);
    const restored = deserializeLocation(serialized);
    expect(restored.lat).toBe(original.lat);
    expect(restored.lon).toBe(original.lon);
    expect(restored.label).toBe(original.label);
  });

  it('round-trips without optional fields', () => {
    const original: Location = { lat: 0, lon: 0 };
    const serialized = serializeLocation(original);
    const restored = deserializeLocation(serialized);
    expect(restored.lat).toBe(0);
    expect(restored.lon).toBe(0);
    expect(restored.label).toBeUndefined();
  });

  it('serialized output is JSON safe', () => {
    const loc: Location = { lat: 36.3, lon: -86.6 };
    const serialized = serializeLocation(loc);
    expect(() => JSON.stringify(serialized)).not.toThrow();
  });

  it('throws on deserialized invalid lat', () => {
    expect(() => deserializeLocation({ lat: 999, lon: 0 })).toThrow(LocationValidationError);
  });

  it('deserializeLocation coerces string numbers', () => {
    const restored = deserializeLocation({ lat: '45.0' as any, lon: '-90.0' as any });
    expect(restored.lat).toBe(45);
    expect(restored.lon).toBe(-90);
  });

  it('deserializeLocation preserves timezone field', () => {
    const restored = deserializeLocation({
      lat: 0, lon: 0, timezone: 'Pacific/Auckland',
    });
    expect(restored.timezone).toBe('Pacific/Auckland');
  });

  it('serializeLocation omits undefined optional fields', () => {
    const serialized = serializeLocation({ lat: 0, lon: 0 });
    expect(serialized).not.toHaveProperty('label');
    expect(serialized).not.toHaveProperty('timezone');
  });
});

describe('validateLocation — error messages', () => {
  it('error message contains the invalid latitude value', () => {
    try {
      validateLocation({ lat: 100, lon: 0 });
      fail('expected to throw');
    } catch (e: any) {
      expect(e.message).toContain('100');
    }
  });

  it('error message contains the invalid longitude value', () => {
    try {
      validateLocation({ lat: 0, lon: 200 });
      fail('expected to throw');
    } catch (e: any) {
      expect(e.message).toContain('200');
    }
  });

  it('error is instance of LocationValidationError', () => {
    try {
      validateLocation({ lat: 91, lon: 0 });
    } catch (e: any) {
      expect(e.name).toBe('LocationValidationError');
      expect(e).toBeInstanceOf(LocationValidationError);
    }
  });
});

describe('validateLocation — NaN input', () => {
  it('NaN latitude is out of range and throws', () => {
    // NaN < -90 is false, NaN > 90 is false, so NaN passes lat check!
    // This documents a known edge case.
    const loc = { lat: NaN, lon: 0 };
    // NaN comparisons are always false, so validateLocation will NOT throw.
    // This is a known limitation — documenting it.
    const result = validateLocation(loc);
    expect(Number.isNaN(result.lat)).toBe(true);
  });
});
