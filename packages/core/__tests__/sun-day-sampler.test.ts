import { TestLogger, createLogger } from '../src/logger';
import { sampleSunDay } from '../src/sun-day-sampler';

describe('sun-day-sampler', () => {
  it('creates 288 samples at the default 5 minute interval', () => {
    const samples = sampleSunDay(36.3048, -86.5974, new Date('2026-06-20T00:00:00Z'));

    expect(samples).toHaveLength(288);
    expect(samples[0]?.date.toISOString()).toBe('2026-06-20T00:00:00.000Z');
    expect(samples[287]?.date.toISOString()).toBe('2026-06-20T23:55:00.000Z');
  });

  it('returns data shaped for downstream packages', () => {
    const samples = sampleSunDay(36.3048, -86.5974, new Date('2026-06-20T00:00:00Z'));
    const daylightSample = samples.find((sample) => sample.phase === 'Daylight');

    expect(daylightSample).toEqual(
      expect.objectContaining({
        date: expect.any(Date),
        azimuth: expect.any(Number),
        altitude: expect.any(Number),
        phase: expect.any(String)
      })
    );
  });

  it('logs the computation duration', () => {
    const sink = new TestLogger();
    const logger = createLogger({
      moduleName: 'sun-day-sampler',
      sink
    });

    sampleSunDay(36.3048, -86.5974, new Date('2026-06-20T00:00:00Z'), 5, logger);

    expect(sink.entries).toContainEqual(
      expect.objectContaining({
        message: 'sampleSunDay.exit',
        data: expect.objectContaining({
          sampleCount: 288,
          elapsedMs: expect.any(Number)
        })
      })
    );
  });

  it('redacts coordinates from sampler logs', () => {
    const sink = new TestLogger();
    const logger = createLogger({
      moduleName: 'sun-day-sampler',
      sink
    });

    sampleSunDay(12.3456, -78.9012, new Date('2026-06-20T00:00:00Z'), 5, logger);

    const payload = JSON.stringify(sink.entries);
    expect(payload).not.toContain('12.3456');
    expect(payload).not.toContain('-78.9012');
  });
});
