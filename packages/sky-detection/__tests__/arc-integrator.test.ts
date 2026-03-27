import { sampleSunDay } from '@sunscope/core';
import { integrateSunHours } from '../src/arc-integrator';
import { createEmptySkyMask, setSkyMaskCell } from '../src/sky-mask';
import { ObstructionType } from '../src/types';

function createAllSkyMask() {
  let mask = createEmptySkyMask();
  for (let azimuth = 0; azimuth < 360; azimuth += 2) {
    for (let elevation = 0; elevation <= 90; elevation += 2) {
      mask = setSkyMaskCell(
        mask,
        azimuth,
        elevation,
        ObstructionType.Sky,
        1,
        new Date('2026-03-16T00:00:00Z')
      );
    }
  }
  return mask;
}

describe('arc-integrator', () => {
  it('matches daylight duration for a fully clear mask', () => {
    const samples = sampleSunDay(36.3048, -86.5974, new Date('2026-06-20T00:00:00Z'));
    const result = integrateSunHours(createAllSkyMask(), samples);
    const daylightHours = samples.filter((sample) => sample.altitude > 0).length * (5 / 60);

    expect(result.totalHours).toBeCloseTo(daylightHours, 1);
    expect(result.maskIncomplete).toBe(false);
  });

  it('treats east-of-south obstructions as roughly half the day blocked', () => {
    const samples = sampleSunDay(36.3048, -86.5974, new Date('2026-06-20T00:00:00Z'));
    let mask = createAllSkyMask();
    for (let azimuth = 90; azimuth < 180; azimuth += 2) {
      for (let elevation = 0; elevation <= 90; elevation += 2) {
        mask = setSkyMaskCell(
          mask,
          azimuth,
          elevation,
          ObstructionType.Building,
          1,
          new Date('2026-03-16T00:00:00Z')
        );
      }
    }

    const result = integrateSunHours(mask, samples);
    const daylightHours = samples.filter((sample) => sample.altitude > 0).length * (5 / 60);

    expect(result.totalHours).toBeGreaterThan(daylightHours * 0.35);
    expect(result.totalHours).toBeLessThan(daylightHours * 0.8);
  });

  it('flags incomplete masks and treats Unknown as blocked', () => {
    const samples = sampleSunDay(36.3048, -86.5974, new Date('2026-06-20T00:00:00Z'));
    const result = integrateSunHours(createEmptySkyMask(), samples);

    expect(result.maskIncomplete).toBe(true);
    expect(result.totalHours).toBe(0);
    expect(result.segments.some((segment) => segment.obstruction === ObstructionType.Unknown)).toBe(true);
  });
});
