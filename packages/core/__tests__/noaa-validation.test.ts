import fixture from './fixtures/noaa-hendersonville.json';
import { TestLogger, createLogger } from '../src/logger';
import { getSunPosition, getSunTimes } from '../src/solar-engine';

const TOLERANCE_SECONDS = 90;
const TOLERANCE_DEGREES = 0.5;

function differenceSeconds(left: Date, right: Date): number {
  return Math.abs(left.getTime() - right.getTime()) / 1000;
}

describe('noaa-validation', () => {
  it('matches NOAA sunrise, sunset, solar noon, and noon position references', () => {
    const sink = new TestLogger();
    const logger = createLogger({
      moduleName: 'noaa-validation',
      sink
    });

    let passedChecks = 0;
    let totalChecks = 0;

    Object.entries(fixture.referenceDates).forEach(([dateKey, reference]) => {
      const referenceDate = new Date(reference.solarNoon);
      const times = getSunTimes(
        fixture.location.latitude,
        fixture.location.longitude,
        referenceDate,
        logger.child('solar-engine')
      );
      const position = getSunPosition(
        fixture.location.latitude,
        fixture.location.longitude,
        new Date(reference.solarNoon),
        logger.child('solar-engine')
      );

      const sunriseDiff = differenceSeconds(times.sunrise, new Date(reference.sunrise));
      const sunsetDiff = differenceSeconds(times.sunset, new Date(reference.sunset));
      const noonDiff = differenceSeconds(times.solarNoon, new Date(reference.solarNoon));
      const azimuthDiff = Math.abs(position.azimuth - reference.solarNoonAzimuth);
      const altitudeDiff = Math.abs(position.altitude - reference.solarNoonAltitude);

      totalChecks += 5;
      passedChecks += Number(sunriseDiff <= TOLERANCE_SECONDS);
      passedChecks += Number(sunsetDiff <= TOLERANCE_SECONDS);
      passedChecks += Number(noonDiff <= TOLERANCE_SECONDS);
      passedChecks += Number(azimuthDiff <= TOLERANCE_DEGREES);
      passedChecks += Number(altitudeDiff <= TOLERANCE_DEGREES);

      expect(sunriseDiff).toBeLessThanOrEqual(TOLERANCE_SECONDS);
      expect(sunsetDiff).toBeLessThanOrEqual(TOLERANCE_SECONDS);
      expect(noonDiff).toBeLessThanOrEqual(TOLERANCE_SECONDS);
      expect(azimuthDiff).toBeLessThanOrEqual(TOLERANCE_DEGREES);
      expect(altitudeDiff).toBeLessThanOrEqual(TOLERANCE_DEGREES);
    });

    logger.info(`${passedChecks}/${totalChecks} NOAA validations passed`, {
      passedChecks,
      totalChecks,
      source: fixture.source
    });

    expect(sink.entries).toContainEqual(
      expect.objectContaining({
        module: 'noaa-validation',
        level: 'INFO',
        message: `${passedChecks}/${totalChecks} NOAA validations passed`
      })
    );
  });
});
