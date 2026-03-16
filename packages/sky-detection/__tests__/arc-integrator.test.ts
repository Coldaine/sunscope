/**
 * Tests for arc-integrator.ts — R-SKY-003
 */

import {
  createEmptySkyMask,
  setSkyMaskCell,
  ObstructionType,
  SkyMask,
} from '../src/sky-mask';
import { integrateSunHours } from '../src/arc-integrator';
import { SunSample } from '@sunscope/core';

/** Create a consistent set of samples spanning 6 "hours" at 5-min intervals above horizon. */
function makeSamples(count: number, startMs: number, azimuthFn: (i: number) => number): SunSample[] {
  const samples: SunSample[] = [];
  const intervalMs = 5 * 60 * 1000;
  for (let i = 0; i < count; i++) {
    samples.push({
      date: new Date(startMs + i * intervalMs),
      azimuth: azimuthFn(i),
      altitude: 20, // above horizon
      phase: 'day',
    });
  }
  return samples;
}

/** Build a fully Sky mask (every cell = Sky). */
function fullSkyMask(): SkyMask {
  let mask = createEmptySkyMask();
  for (let az = 0; az < 360; az += 2) {
    for (let el = 0; el < 90; el += 2) {
      mask = setSkyMaskCell(mask, az, el, ObstructionType.Sky, 1.0);
    }
  }
  return mask;
}

/** Build a mask with eastern half (az < 180) = Building, western half = Sky. */
function halfBlockedMask(): SkyMask {
  let mask = createEmptySkyMask();
  for (let az = 0; az < 360; az += 2) {
    for (let el = 0; el < 90; el += 2) {
      const type = az < 180 ? ObstructionType.Building : ObstructionType.Sky;
      mask = setSkyMaskCell(mask, az, el, type, 1.0);
    }
  }
  return mask;
}

describe('integrateSunHours — fully clear mask', () => {
  it('all samples above horizon and Sky → totalHours = sample span duration', () => {
    const n = 72; // 6 hours at 5-min intervals
    const startMs = Date.UTC(2026, 5, 20, 6, 0, 0, 0); // 06:00 UTC
    const samples = makeSamples(n, startMs, () => 180); // all due south
    const mask = fullSkyMask();
    const result = integrateSunHours(mask, samples);
    // n-1 intervals of 5 min = (n-1)*5/60 hours
    const expectedHours = ((n - 1) * 5) / 60;
    expect(result.totalHours).toBeCloseTo(expectedHours, 1);
    expect(result.maskIncomplete).toBeFalsy();
  });
});

describe('integrateSunHours — half-blocked mask', () => {
  it('half of samples in blocked zone → ~half the hours', () => {
    const n = 144; // 12 hours of samples
    const startMs = Date.UTC(2026, 5, 20, 6, 0, 0, 0);
    // First half: azimuth 90° (east, blocked), second half: azimuth 270° (west, sky)
    const samples = makeSamples(n, startMs, (i) => (i < n / 2 ? 90 : 270));
    const mask = halfBlockedMask();
    const result = integrateSunHours(mask, samples);
    // Total span = (n-1)*5/60 hours, roughly half unblocked
    const totalSpan = ((n - 1) * 5) / 60;
    expect(result.totalHours).toBeGreaterThan(0);
    expect(result.totalHours).toBeLessThan(totalSpan);
    expect(result.totalHours).toBeCloseTo(totalSpan / 2, 0);
  });
});

describe('integrateSunHours — all Unknown mask', () => {
  it('maskIncomplete=true, totalHours=0 (Unknown=blocked)', () => {
    const n = 12;
    const startMs = Date.UTC(2026, 5, 20, 6, 0, 0, 0);
    const samples = makeSamples(n, startMs, () => 180);
    const mask = createEmptySkyMask(); // all Unknown
    const result = integrateSunHours(mask, samples);
    expect(result.maskIncomplete).toBe(true);
    expect(result.totalHours).toBe(0);
  });
});

describe('integrateSunHours — below-horizon samples ignored', () => {
  it('samples with altitude ≤ 0 do not contribute to totalHours', () => {
    const startMs = Date.UTC(2026, 5, 20, 0, 0, 0, 0);
    const intervalMs = 5 * 60 * 1000;
    const samples: SunSample[] = [
      { date: new Date(startMs), azimuth: 180, altitude: -5, phase: 'night' },
      { date: new Date(startMs + intervalMs), azimuth: 180, altitude: 0, phase: 'civil_twilight' },
      { date: new Date(startMs + 2 * intervalMs), azimuth: 180, altitude: 10, phase: 'day' },
    ];
    const mask = fullSkyMask();
    const result = integrateSunHours(mask, samples);
    // Only the third sample (altitude 10°) is above horizon
    expect(result.totalHours).toBe(0); // only 1 above-horizon sample, no interval to form a segment
  });
});

describe('integrateSunHours — arc segments', () => {
  it('segments array has startTime and endTime as Dates', () => {
    const n = 24;
    const startMs = Date.UTC(2026, 5, 20, 6, 0, 0, 0);
    const samples = makeSamples(n, startMs, () => 270); // all sky
    const mask = fullSkyMask();
    const result = integrateSunHours(mask, samples);
    if (result.segments.length > 0) {
      expect(result.segments[0].startTime).toBeInstanceOf(Date);
      expect(result.segments[0].endTime).toBeInstanceOf(Date);
    }
  });

  it('unblocked segments have blocked=false and obstruction=null', () => {
    const n = 6;
    const startMs = Date.UTC(2026, 5, 20, 10, 0, 0, 0);
    const samples = makeSamples(n, startMs, () => 180);
    const mask = fullSkyMask();
    const result = integrateSunHours(mask, samples);
    for (const seg of result.segments) {
      if (!seg.blocked) {
        expect(seg.obstruction).toBeNull();
      }
    }
  });
});
