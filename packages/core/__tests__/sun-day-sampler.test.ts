/**
 * Tests for sun-day-sampler.ts — R-CORE-003
 */

import { sampleSunDay } from '../src/sun-day-sampler';
import { TestLogger } from '../src/logger';

const LAT = 36.3048;
const LON = -86.5974;

describe('sampleSunDay — output structure', () => {
  let samples: ReturnType<typeof sampleSunDay>;

  beforeAll(() => {
    samples = sampleSunDay(LAT, LON, new Date('2026-06-21T00:00:00Z'), {
      log: new TestLogger(),
    });
  });

  it('generates exactly 288 samples at default 5-min interval', () => {
    expect(samples.length).toBe(288);
  });

  it('each sample has date, azimuth, altitude, phase', () => {
    for (const s of samples) {
      expect(s.date).toBeInstanceOf(Date);
      expect(typeof s.azimuth).toBe('number');
      expect(typeof s.altitude).toBe('number');
      expect(typeof s.phase).toBe('string');
    }
  });

  it('sample dates span exactly 0:00 to 23:55 UTC', () => {
    const first = samples[0].date;
    const last = samples[287].date;
    expect(first.getUTCHours()).toBe(0);
    expect(first.getUTCMinutes()).toBe(0);
    expect(last.getUTCHours()).toBe(23);
    expect(last.getUTCMinutes()).toBe(55);
  });

  it('samples are exactly 5 minutes apart', () => {
    const diff = samples[1].date.getTime() - samples[0].date.getTime();
    expect(diff).toBe(5 * 60 * 1000);
  });

  it('azimuth values are in [0, 360)', () => {
    for (const s of samples) {
      expect(s.azimuth).toBeGreaterThanOrEqual(0);
      expect(s.azimuth).toBeLessThan(360);
    }
  });

  it('altitude values are in (-90, 90)', () => {
    for (const s of samples) {
      expect(s.altitude).toBeGreaterThan(-90);
      expect(s.altitude).toBeLessThan(90);
    }
  });

  it('some samples are above horizon and some below (full day)', () => {
    const above = samples.filter(s => s.altitude > 0);
    const below = samples.filter(s => s.altitude <= 0);
    expect(above.length).toBeGreaterThan(0);
    expect(below.length).toBeGreaterThan(0);
  });

  it('sample dates all have Z-based UTC representation (no local time parsing)', () => {
    // Verify the internal Date objects represent UTC by checking UTC midnight anchor
    const firstSampleMs = samples[0].date.getTime();
    const anchorMs = Date.UTC(2026, 5, 21, 0, 0, 0, 0);
    expect(firstSampleMs).toBe(anchorMs);
  });
});

describe('sampleSunDay — custom interval', () => {
  it('1-minute interval gives 1440 samples', () => {
    const samples = sampleSunDay(LAT, LON, new Date('2026-06-21T00:00:00Z'), {
      intervalMinutes: 1,
      log: new TestLogger(),
    });
    expect(samples.length).toBe(1440);
  });

  it('30-minute interval gives 48 samples', () => {
    const samples = sampleSunDay(LAT, LON, new Date('2026-06-21T00:00:00Z'), {
      intervalMinutes: 30,
      log: new TestLogger(),
    });
    expect(samples.length).toBe(48);
  });
});

describe('sampleSunDay — phase distribution', () => {
  it('samples contain multiple distinct phases for a full day', () => {
    const samples = sampleSunDay(LAT, LON, new Date('2026-06-21T00:00:00Z'), {
      log: new TestLogger(),
    });
    const phases = new Set(samples.map(s => s.phase));
    // A full day should have at least day and night
    expect(phases.has('day')).toBe(true);
    expect(phases.has('night')).toBe(true);
    expect(phases.size).toBeGreaterThanOrEqual(3); // day, night, + at least one twilight/golden
  });
});

describe('sampleSunDay — mid-day anchor', () => {
  it('passing a mid-day date still anchors to UTC midnight', () => {
    const midDay = new Date('2026-06-21T15:30:00Z');
    const samples = sampleSunDay(LAT, LON, midDay, { log: new TestLogger() });
    // First sample should be at 00:00 UTC on June 21
    expect(samples[0].date.getUTCHours()).toBe(0);
    expect(samples[0].date.getUTCMinutes()).toBe(0);
    expect(samples[0].date.getUTCDate()).toBe(21);
  });
});

describe('sampleSunDay — winter vs summer', () => {
  it('winter solstice has fewer above-horizon samples than summer', () => {
    const log = new TestLogger();
    const summer = sampleSunDay(LAT, LON, new Date('2026-06-21T00:00:00Z'), { log });
    const winter = sampleSunDay(LAT, LON, new Date('2026-12-21T00:00:00Z'), { log });
    const summerAbove = summer.filter(s => s.altitude > 0).length;
    const winterAbove = winter.filter(s => s.altitude > 0).length;
    expect(summerAbove).toBeGreaterThan(winterAbove);
  });
});

describe('sampleSunDay — logging', () => {
  it('logs completion info entry', () => {
    const log = new TestLogger();
    sampleSunDay(LAT, LON, new Date('2026-06-21T00:00:00Z'), { log });
    expect(log.at('INFO')).toContainEqual(
      expect.objectContaining({ message: 'sampleSunDay complete' })
    );
  });
});

describe('sampleSunDay — performance', () => {
  it('288 samples complete in under 200ms', () => {
    const t0 = Date.now();
    sampleSunDay(LAT, LON, new Date('2026-06-21T00:00:00Z'), { log: new TestLogger() });
    const elapsed = Date.now() - t0;
    expect(elapsed).toBeLessThan(200);
  });
});

describe('sampleSunDay — phase values', () => {
  it('includes "day" phase during midday', () => {
    const samples = sampleSunDay(LAT, LON, new Date('2026-06-21T00:00:00Z'), { log: new TestLogger() });
    const dayPhases = samples.filter(s => s.phase === 'day');
    expect(dayPhases.length).toBeGreaterThan(0);
  });

  it('includes "night" phase near midnight', () => {
    const samples = sampleSunDay(LAT, LON, new Date('2026-06-21T00:00:00Z'), { log: new TestLogger() });
    const nightPhases = samples.filter(s => s.phase === 'night');
    expect(nightPhases.length).toBeGreaterThan(0);
  });
});
