import * as suncalc from 'suncalc';
import { Logger, DefaultLogger } from './logger';
import { suncalcToCompass, radToDeg } from './solar-convert';
import { SunPosition, SunTimes } from './core-types';

/**
 * Gets sun position at a given time and location using suncalc,
 * returning angles adhering to app conventions (degrees, north-origin).
 *
 * @param lat Latitude 
 * @param lon Longitude
 * @param date UTC Date
 * @returns SunPosition { azimuth: number, altitude: number }
 */
export function getSunPosition(lat: number, lon: number, date: Date, log?: Logger): SunPosition {
  const l = log ?? new DefaultLogger('solar-engine');
  const startMs = Date.now();
  
  const rawPos = suncalc.getPosition(date, lat, lon);
  
  const azimuthDeg = suncalcToCompass(rawPos.azimuth);
  const altitudeDeg = radToDeg(rawPos.altitude);
  
  const result: SunPosition = {
    azimuth: azimuthDeg,
    altitude: altitudeDeg
  };

  l.debug('getSunPosition computed', {
    input: { lat, lon, date: date.toISOString() },
    rawOutput: { azimuth: rawPos.azimuth, altitude: rawPos.altitude },
    convertedOutput: result,
    elapsedMs: Date.now() - startMs
  });

  return result;
}

/**
 * Gets sun times for a given day and location using suncalc.
 * Returns times in UTC.
 *
 * @param lat Latitude
 * @param lon Longitude
 * @param date UTC Date
 * @returns SunTimes object
 */
export function getSunTimes(lat: number, lon: number, date: Date, log?: Logger): SunTimes {
  const l = log ?? new DefaultLogger('solar-engine');
  const startMs = Date.now();
  
  const rawTimes = suncalc.getTimes(date, lat, lon);
  
  l.debug('getSunTimes computed', {
    input: { lat, lon, date: date.toISOString() },
    elapsedMs: Date.now() - startMs
  });
  
  // They are already Date objects (in local timezone originally depending on environment,
  // but suncalc actually returns Date objects. Date objects internally represent UTC.)
  return {
    solarNoon: rawTimes.solarNoon,
    nadir: rawTimes.nadir,
    sunrise: rawTimes.sunrise,
    sunset: rawTimes.sunset,
    sunriseEnd: rawTimes.sunriseEnd,
    sunsetStart: rawTimes.sunsetStart,
    dawn: rawTimes.dawn,
    dusk: rawTimes.dusk,
    nauticalDawn: rawTimes.nauticalDawn, // 'dawn' is typically civil, check suncalc docs
    nauticalDusk: rawTimes.nauticalDusk,
    nightEnd: rawTimes.nightEnd,
    night: rawTimes.night,
    goldenHourEnd: rawTimes.goldenHourEnd,
    goldenHour: rawTimes.goldenHour
  } as SunTimes;
}
