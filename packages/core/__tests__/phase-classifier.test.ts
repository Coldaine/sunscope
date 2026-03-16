/**
 * Tests for phase-classifier.ts — R-CORE-007
 */

import { classifySunPhase } from '../src/phase-classifier';
import { getSunTimes } from '../src/solar-engine';
import { TestLogger } from '../src/logger';

const LAT = 36.3048;
const LON = -86.5974;
const SUMMER_DAY = new Date('2026-06-21T12:00:00Z'); // noon UTC ensures correct local day for suncalc

function makeMockSunTimes() {
  return getSunTimes(LAT, LON, SUMMER_DAY);
}

describe('classifySunPhase', () => {
  const log = new TestLogger();

  it('high altitude during day → "day"', () => {
    const sunTimes = makeMockSunTimes();
    // Midday, sun well above 6°
    const result = classifySunPhase(60, new Date('2026-06-21T16:00:00Z'), sunTimes, log);
    expect(result.phase).toBe('day');
  });

  it('altitude ≤ 0 before dawn → "night" or astronomical twilight', () => {
    const sunTimes = makeMockSunTimes();
    // Well before dawn (UTC midnight = local pre-dawn)
    const result = classifySunPhase(-20, new Date('2026-06-21T06:00:00Z'), sunTimes, log);
    expect(['night', 'astronomical_twilight']).toContain(result.phase);
  });

  it('altitude in blue hour band near sunrise → "blue_hour"', () => {
    const sunTimes = makeMockSunTimes();
    // Sunrise is around 10:14 UTC; 10:00 UTC is within 45 min window
    // Altitude -5° (between -6° and -4°)
    const result = classifySunPhase(-5, new Date('2026-06-21T10:00:00Z'), sunTimes, log);
    expect(result.phase).toBe('blue_hour');
  });

  it('altitude -5° far from sunrise/sunset → not blue_hour', () => {
    const sunTimes = makeMockSunTimes();
    // Midday UTC — nowhere near sunrise or sunset
    const result = classifySunPhase(-5, new Date('2026-06-21T18:00:00Z'), sunTimes, log);
    expect(result.phase).not.toBe('blue_hour');
  });

  it('altitude in golden hour window → "golden_hour"', () => {
    const sunTimes = makeMockSunTimes();
    // Golden hour end ≈ shortly after sunrise, golden hour ≈ before sunset
    // Use a time within the golden hour window (pre-sunset)
    const result = classifySunPhase(3, sunTimes.goldenHour, sunTimes, log);
    expect(result.phase).toBe('golden_hour');
  });

  it('very low altitude near horizon but positive → "golden_hour" or "civil_twilight"', () => {
    const sunTimes = makeMockSunTimes();
    const result = classifySunPhase(1, new Date('2026-06-21T10:30:00Z'), sunTimes, log);
    expect(['golden_hour', 'civil_twilight']).toContain(result.phase);
  });

  it('altitude in civil twilight band (-6° to 0°) → not night', () => {
    const sunTimes = makeMockSunTimes();
    const result = classifySunPhase(-2, new Date('2026-06-21T10:05:00Z'), sunTimes, log);
    expect(result.phase).not.toBe('night');
  });

  it('logs which threshold triggered', () => {
    const l = new TestLogger();
    const sunTimes = makeMockSunTimes();
    classifySunPhase(60, new Date('2026-06-21T16:00:00Z'), sunTimes, l);
    expect(l.at('DEBUG').length).toBeGreaterThan(0);
    // The log entry should include altitudeDeg
    expect(l.entries).toContainEqual(expect.objectContaining({
      level: 'DEBUG',
      data: expect.objectContaining({ altitudeDeg: 60 }),
    }));
  });

  it('returns altitudeDeg in result', () => {
    const sunTimes = makeMockSunTimes();
    const result = classifySunPhase(45, new Date('2026-06-21T16:00:00Z'), sunTimes, log);
    expect(result.altitudeDeg).toBe(45);
  });
});
