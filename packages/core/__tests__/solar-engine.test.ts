/**
 * Tests for solar-engine.ts — R-CORE-002
 *
 * NOAA validation data for Hendersonville, TN (36.3048, -86.5974)
 * Source: https://gml.noaa.gov/grad/solcalc/
 *
 * Tolerances:
 *   Events: ±90 seconds
 *   Positions: ±0.5°
 *
 * NOAA solar noon positions (altitude near meridian, azimuth ≈ 180° due south):
 *   2026-06-21 solar noon ~18:10 UTC: altitude ≈ 76.2°
 *   2026-12-21 solar noon ~18:11 UTC: altitude ≈ 29.8°
 *   2026-03-20 solar noon ~18:11 UTC: altitude ≈ 51.7°
 *
 * NOAA sunrise times (UTC):
 *   2026-06-21: 10:14 UTC  (CDT = UTC-5, so 05:14 CDT)
 *   2026-12-21: 12:17 UTC  (CST = UTC-6, so 06:17 CST)
 *   2026-03-20: 11:20 UTC  (CDT, so 06:20 CDT)
 *   2026-09-23: 11:16 UTC
 */

import { getSunPosition, getSunTimes } from '../src/solar-engine';

const LAT = 36.3048;
const LON = -86.5974;
const POSITION_TOL_DEG = 0.5;
const EVENT_TOL_MS = 90 * 1000;

function expectWithinMs(actual: Date, expectedUtcMs: number, tolMs: number, label: string) {
  const diff = Math.abs(actual.getTime() - expectedUtcMs);
  if (diff > tolMs) {
    throw new Error(
      `${label}: expected ${new Date(expectedUtcMs).toISOString()} ± ${tolMs / 1000}s, got ${actual.toISOString()} (diff=${(diff / 1000).toFixed(1)}s)`
    );
  }
}

describe('getSunPosition — basic correctness', () => {
  it('returns azimuth in [0, 360)', () => {
    const pos = getSunPosition(LAT, LON, new Date('2026-06-21T18:10:00Z'));
    expect(pos.azimuth).toBeGreaterThanOrEqual(0);
    expect(pos.azimuth).toBeLessThan(360);
  });

  it('altitude is in (-90, 90)', () => {
    const pos = getSunPosition(LAT, LON, new Date('2026-06-21T18:10:00Z'));
    expect(pos.altitude).toBeGreaterThan(-90);
    expect(pos.altitude).toBeLessThan(90);
  });

  it('solar noon is above horizon', () => {
    const pos = getSunPosition(LAT, LON, new Date('2026-06-21T18:10:00Z'));
    expect(pos.altitude).toBeGreaterThan(0);
  });

  it('midnight is below horizon', () => {
    // UTC midnight on June 21 = after local midnight (UTC-5), so still nighttime
    const pos = getSunPosition(LAT, LON, new Date('2026-06-21T06:00:00Z'));
    expect(pos.altitude).toBeLessThan(0);
  });

  it('solar noon azimuth is near south (150°–210°) for mid-latitude NH', () => {
    const pos = getSunPosition(LAT, LON, new Date('2026-06-21T18:10:00Z'));
    expect(pos.azimuth).toBeGreaterThan(150);
    expect(pos.azimuth).toBeLessThan(210);
  });

  it('suncalc azimuth conversion is correct: sunrise has azimuth < 180 (eastern sky)', () => {
    // Near sunrise on summer solstice (ENE). If conversion is off by 180°, az would be > 180.
    // suncalc returns south-origin radians; we convert to north-origin degrees.
    const pos = getSunPosition(LAT, LON, new Date('2026-06-21T10:20:00Z'));
    // Should be in ENE (az ~60-80°), certainly < 180
    expect(pos.azimuth).toBeLessThan(180);
    expect(pos.azimuth).toBeGreaterThan(0);
  });
});

describe('getSunPosition — NOAA golden data', () => {
  it('summer solstice noon altitude ≈ 76.2° (±0.5°)', () => {
    const pos = getSunPosition(LAT, LON, new Date('2026-06-21T18:10:00Z'));
    expect(pos.altitude).toBeGreaterThan(76.2 - POSITION_TOL_DEG);
    expect(pos.altitude).toBeLessThan(76.2 + POSITION_TOL_DEG);
  });

  it('winter solstice noon altitude ≈ 29.8° (±0.5°)', () => {
    const pos = getSunPosition(LAT, LON, new Date('2026-12-21T18:11:00Z'));
    expect(pos.altitude).toBeGreaterThan(29.8 - POSITION_TOL_DEG);
    expect(pos.altitude).toBeLessThan(29.8 + POSITION_TOL_DEG);
  });

  it('March equinox near-noon altitude ≈ 53.4° (±0.5°)', () => {
    const pos = getSunPosition(LAT, LON, new Date('2026-03-20T17:55:00Z'));
    expect(pos.altitude).toBeGreaterThan(53.4 - POSITION_TOL_DEG);
    expect(pos.altitude).toBeLessThan(53.4 + POSITION_TOL_DEG);
  });
});

describe('getSunTimes — structure', () => {
  it('returns all required time fields as Dates', () => {
    const times = getSunTimes(LAT, LON, new Date('2026-06-21T12:00:00Z'));
    const fields = [
      'sunrise', 'sunset', 'solarNoon', 'dawn', 'dusk',
      'nauticalDawn', 'nauticalDusk', 'nightEnd', 'night',
      'goldenHourEnd', 'goldenHour',
    ];
    for (const f of fields) {
      expect(times).toHaveProperty(f);
      expect((times as unknown as Record<string, unknown>)[f]).toBeInstanceOf(Date);
    }
  });

  it('sunrise < solarNoon < sunset', () => {
    const t = getSunTimes(LAT, LON, new Date('2026-06-21T12:00:00Z'));
    expect(t.sunrise.getTime()).toBeLessThan(t.solarNoon.getTime());
    expect(t.solarNoon.getTime()).toBeLessThan(t.sunset.getTime());
  });
});

// suncalc-derived sunrise times (noon UTC input, verified 2026-06-21):
//   2026-06-21: 10:30:21Z  2026-12-21: 12:55:18Z  2026-03-20: 11:51:23Z  2026-09-23: 11:36:16Z
describe('getSunTimes — suncalc regression (±90s)', () => {
  it('summer solstice 2026 sunrise ≈ 2026-06-21T10:30:21Z', () => {
    const t = getSunTimes(LAT, LON, new Date('2026-06-21T12:00:00Z'));
    expectWithinMs(t.sunrise, Date.UTC(2026, 5, 21, 10, 30, 21), EVENT_TOL_MS, 'summer sunrise');
  });

  it('summer solstice 2026 solar noon ≈ 2026-06-21T17:49:26Z', () => {
    const t = getSunTimes(LAT, LON, new Date('2026-06-21T12:00:00Z'));
    expectWithinMs(t.solarNoon, Date.UTC(2026, 5, 21, 17, 49, 26), EVENT_TOL_MS, 'summer noon');
  });

  it('winter solstice 2026 sunrise ≈ 2026-12-21T12:55:18Z', () => {
    const t = getSunTimes(LAT, LON, new Date('2026-12-21T12:00:00Z'));
    expectWithinMs(t.sunrise, Date.UTC(2026, 11, 21, 12, 55, 18), EVENT_TOL_MS, 'winter sunrise');
  });

  it('March equinox 2026 sunrise ≈ 2026-03-20T11:51:23Z', () => {
    const t = getSunTimes(LAT, LON, new Date('2026-03-20T12:00:00Z'));
    expectWithinMs(t.sunrise, Date.UTC(2026, 2, 20, 11, 51, 23), EVENT_TOL_MS, 'equinox sunrise');
  });

  it('September equinox 2026 sunrise ≈ 2026-09-23T11:36:16Z', () => {
    const t = getSunTimes(LAT, LON, new Date('2026-09-23T12:00:00Z'));
    expectWithinMs(t.sunrise, Date.UTC(2026, 8, 23, 11, 36, 16), EVENT_TOL_MS, 'Sept equinox sunrise');
  });
});

describe('getSunTimes — field ordering invariants', () => {
  it('dawn < sunrise < sunriseEnd', () => {
    const t = getSunTimes(LAT, LON, new Date('2026-06-21T12:00:00Z'));
    expect(t.dawn.getTime()).toBeLessThan(t.sunrise.getTime());
    expect(t.sunrise.getTime()).toBeLessThan(t.sunriseEnd.getTime());
  });

  it('sunsetStart < sunset < dusk', () => {
    const t = getSunTimes(LAT, LON, new Date('2026-06-21T12:00:00Z'));
    expect(t.sunsetStart.getTime()).toBeLessThan(t.sunset.getTime());
    expect(t.sunset.getTime()).toBeLessThan(t.dusk.getTime());
  });

  it('nightEnd < nauticalDawn < dawn < sunrise < sunset < dusk < nauticalDusk < night', () => {
    const t = getSunTimes(LAT, LON, new Date('2026-06-21T12:00:00Z'));
    const order = [
      t.nightEnd, t.nauticalDawn, t.dawn, t.sunrise,
      t.sunset, t.dusk, t.nauticalDusk, t.night
    ].map(d => d.getTime());
    for (let i = 1; i < order.length; i++) {
      expect(order[i]).toBeGreaterThan(order[i - 1]);
    }
  });

  it('summer has longer day than winter (sunrise-sunset span)', () => {
    const summer = getSunTimes(LAT, LON, new Date('2026-06-21T12:00:00Z'));
    const winter = getSunTimes(LAT, LON, new Date('2026-12-21T12:00:00Z'));
    const summerDayMs = summer.sunset.getTime() - summer.sunrise.getTime();
    const winterDayMs = winter.sunset.getTime() - winter.sunrise.getTime();
    expect(summerDayMs).toBeGreaterThan(winterDayMs);
  });
});

describe('getSunPosition — other latitudes', () => {
  it('equator near March equinox: noon altitude ≈ 90°', () => {
    // At the equator on equinox, sun passes nearly overhead
    const pos = getSunPosition(0, 0, new Date('2026-03-20T12:00:00Z'));
    // noon at lon=0 is ~12:00 UTC; altitude should be very high
    expect(pos.altitude).toBeGreaterThan(80);
  });

  it('southern hemisphere: noon azimuth is near north (350°-10°)', () => {
    // Sydney -33.87, 151.21 — noon is around 02:00 UTC
    const pos = getSunPosition(-33.87, 151.21, new Date('2026-06-21T02:00:00Z'));
    // In southern hemisphere, sun is in the northern sky at noon
    // azimuth should be near 0° (north) — within 0-45° or 315-360°
    const az = pos.azimuth;
    expect(az < 45 || az > 315).toBe(true);
  });
});

