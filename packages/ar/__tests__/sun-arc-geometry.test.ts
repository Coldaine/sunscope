import { computeArcPoints } from '../src/sun-arc-geometry';
import { SunSample, SunHoursResult } from '@sunscope/core';

describe('Sun Arc Geometry', () => {
  it('should compute valid 3D points for given samples', () => {
    const samples: SunSample[] = [
      { date: new Date('2026-06-20T12:00:00Z'), azimuth: 180, altitude: 45, phase: 'day' },
      { date: new Date('2026-06-20T06:00:00Z'), azimuth: 90, altitude: 0, phase: 'sunrise' },
      { date: new Date('2026-06-20T18:00:00Z'), azimuth: 270, altitude: 0, phase: 'sunset' },
      { date: new Date('2026-06-20T00:00:00Z'), azimuth: 0, altitude: -10, phase: 'night' }, // Should be filtered
    ];

    const points = computeArcPoints(samples, 50);

    // One point filtered out due to altitude <= -5
    expect(points.length).toBe(3);

    // solar noon (azimuth 180, altitude 45) -> south
    const noon = points[0];
    expect(noon.y).toBeGreaterThan(0);
    expect(noon.z).toBeCloseTo(50 * Math.cos(Math.PI/4)); // south is +z or -z? Wait, -z is north, so southis +z
    expect(noon.x).toBeCloseTo(0);

    // sunrise (azimuth 90) -> east (+x)
    const sunrise = points[1];
    expect(sunrise.x).toBeCloseTo(50);
    expect(sunrise.z).toBeCloseTo(0);
    expect(sunrise.y).toBeCloseTo(0);

    // sunset (azimuth 270) -> west (-x)
    const sunset = points[2];
    expect(sunset.x).toBeCloseTo(-50);
    expect(sunset.z).toBeCloseTo(0);
    expect(sunset.y).toBeCloseTo(0);
  });

  it('should map blocked segments to points when sunHours provided', () => {
    const samples: SunSample[] = [
      { date: new Date('2026-06-20T10:00:00Z'), azimuth: 135, altitude: 30, phase: 'day' }, // blocked
      { date: new Date('2026-06-20T14:00:00Z'), azimuth: 225, altitude: 30, phase: 'day' }, // unblocked
    ];

    const sunHours: SunHoursResult = {
      totalHours: 4,
      segments: [
        { startTime: new Date('2026-06-20T09:00:00Z'), endTime: new Date('2026-06-20T11:00:00Z'), blocked: true, obstruction: 'Building' },
        { startTime: new Date('2026-06-20T13:00:00Z'), endTime: new Date('2026-06-20T15:00:00Z'), blocked: false, obstruction: null },
      ]
    };

    const points = computeArcPoints(samples, 50, sunHours);
    expect(points[0].blocked).toBe(true);
    expect(points[1].blocked).toBe(false);
  });
});
