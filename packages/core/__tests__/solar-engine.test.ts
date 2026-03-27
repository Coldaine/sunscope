import { TestLogger, createLogger } from '../src/logger';
import { getSunPosition, getSunTimes } from '../src/solar-engine';

const HENDERSONVILLE = {
  latitude: 36.3048,
  longitude: -86.5974
};

describe('solar-engine', () => {
  it('returns north-origin azimuth and degree altitude', () => {
    const position = getSunPosition(
      HENDERSONVILLE.latitude,
      HENDERSONVILLE.longitude,
      new Date('2026-06-20T17:49:00Z')
    );

    expect(position.azimuth).toBeGreaterThan(170);
    expect(position.azimuth).toBeLessThan(190);
    expect(position.altitude).toBeGreaterThan(70);
  });

  it('returns UTC dates from sun times', () => {
    const times = getSunTimes(
      HENDERSONVILLE.latitude,
      HENDERSONVILLE.longitude,
      new Date('2026-06-20T00:00:00Z')
    );

    expect(times.sunrise.toISOString().endsWith('Z')).toBe(true);
    expect(times.sunset.toISOString().endsWith('Z')).toBe(true);
  });

  it('logs raw and converted values for suncalc calls', () => {
    const sink = new TestLogger();
    const logger = createLogger({
      moduleName: 'solar-engine',
      sink
    });

    getSunPosition(
      HENDERSONVILLE.latitude,
      HENDERSONVILLE.longitude,
      new Date('2026-06-20T17:49:00Z'),
      logger
    );

    expect(sink.entries).toContainEqual(
      expect.objectContaining({
        module: 'solar-engine',
        message: 'getSunPosition.entry'
      })
    );
    expect(sink.entries).toContainEqual(
      expect.objectContaining({
        message: 'getSunPosition.exit',
        data: expect.objectContaining({
          converted: expect.objectContaining({
            azimuth: expect.any(Number),
            altitude: expect.any(Number)
          })
        })
      })
    );
  });

  it('redacts coordinates from solar-engine logs', () => {
    const sink = new TestLogger();
    const logger = createLogger({
      moduleName: 'solar-engine',
      sink
    });

    getSunPosition(12.3456, -78.9012, new Date('2026-06-20T17:49:00Z'), logger);
    getSunTimes(12.3456, -78.9012, new Date('2026-06-20T00:00:00Z'), logger);

    const payload = JSON.stringify(sink.entries);
    expect(payload).not.toContain('12.3456');
    expect(payload).not.toContain('-78.9012');
  });
});
