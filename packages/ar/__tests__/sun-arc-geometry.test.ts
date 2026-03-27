import { sampleSunDay } from '@sunscope/core';
import { computeArcPoints } from '../src/sun-arc-geometry';

describe('sun-arc-geometry', () => {
  it('places sunrise in the east and sunset in the west', () => {
    const samples = sampleSunDay(36.3048, -86.5974, new Date('2026-06-20T00:00:00Z'));
    const points = computeArcPoints(samples);
    const sunrisePoint = points.find((point) => point.altitude > -1 && point.azimuth > 45 && point.azimuth < 135);
    const sunsetPoint = [...points].reverse().find((point) => point.altitude > -1 && point.azimuth > 225 && point.azimuth < 315);

    expect(sunrisePoint?.x).toBeGreaterThan(0);
    expect(sunsetPoint?.x).toBeLessThan(0);
  });

  it('places solar noon near due south with positive height', () => {
    const samples = sampleSunDay(36.3048, -86.5974, new Date('2026-06-20T00:00:00Z'));
    const points = computeArcPoints(samples);
    const solarNoonPoint = points.reduce((highest, point) => (point.y > highest.y ? point : highest), points[0]!);

    expect(solarNoonPoint.y).toBeGreaterThan(0);
    expect(Math.abs(solarNoonPoint.x)).toBeLessThan(5);
    expect(solarNoonPoint.z).toBeGreaterThan(0);
  });

  it('accepts blocked segments for point coloring', () => {
    const samples = sampleSunDay(36.3048, -86.5974, new Date('2026-06-20T00:00:00Z'));
    const points = computeArcPoints(samples, 50, {
      segments: [
        {
          startTime: new Date('2026-06-20T10:30:00Z'),
          endTime: new Date('2026-06-20T12:00:00Z'),
          blocked: true
        }
      ]
    });

    expect(points.some((point) => point.blocked === true)).toBe(true);
  });
});
