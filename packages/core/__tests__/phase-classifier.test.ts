import { classifySunPhase } from '../src/phase-classifier';
import { SunTimes } from '../src/types';

const sunTimes: SunTimes = {
  sunrise: new Date('2026-06-20T10:30:00Z'),
  sunset: new Date('2026-06-21T01:08:00Z'),
  solarNoon: new Date('2026-06-20T17:49:00Z'),
  dawn: new Date('2026-06-20T09:58:00Z'),
  dusk: new Date('2026-06-21T01:40:00Z'),
  nauticalDawn: new Date('2026-06-20T09:18:00Z'),
  nauticalDusk: new Date('2026-06-21T02:20:00Z'),
  nightEnd: new Date('2026-06-20T08:33:00Z'),
  night: new Date('2026-06-21T03:05:00Z'),
  goldenHour: new Date('2026-06-21T00:07:00Z'),
  goldenHourEnd: new Date('2026-06-20T11:33:00Z'),
  nadir: new Date('2026-06-20T05:49:00Z')
};

describe('phase-classifier', () => {
  it('classifies golden hour using suncalc event windows', () => {
    expect(classifySunPhase(new Date('2026-06-20T10:45:00Z'), 3, sunTimes)).toBe('GoldenHour');
    expect(classifySunPhase(new Date('2026-06-21T00:30:00Z'), 4, sunTimes)).toBe('GoldenHour');
  });

  it('classifies blue hour only near sunrise and sunset', () => {
    expect(classifySunPhase(new Date('2026-06-20T10:00:00Z'), -5, sunTimes)).toBe('BlueHour');
    expect(classifySunPhase(new Date('2026-06-20T14:00:00Z'), -5, sunTimes)).toBe('CivilTwilight');
  });

  it('classifies twilight bands and night', () => {
    expect(classifySunPhase(new Date('2026-06-20T09:45:00Z'), -3, sunTimes)).toBe('CivilTwilight');
    expect(classifySunPhase(new Date('2026-06-20T09:00:00Z'), -8, sunTimes)).toBe('NauticalTwilight');
    expect(classifySunPhase(new Date('2026-06-20T08:00:00Z'), -15, sunTimes)).toBe('AstronomicalTwilight');
    expect(classifySunPhase(new Date('2026-06-20T05:00:00Z'), -25, sunTimes)).toBe('Night');
  });
});
