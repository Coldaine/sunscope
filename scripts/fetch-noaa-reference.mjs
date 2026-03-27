/**
 * Fetches NOAA reference data for Hendersonville, TN from official NOAA pages.
 *
 * Sources:
 * - https://gml.noaa.gov/grad/solcalc/table.php
 * - https://gml.noaa.gov/grad/solcalc/sunrise.html
 * - https://gml.noaa.gov/grad/solcalc/azel.html
 *
 * The table endpoint provides sunrise, sunset, and solar noon local times.
 * The azimuth/elevation page provides NOAA's solar position calculation logic.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';

const OUTPUT_PATH = path.resolve(process.cwd(), 'packages/core/__tests__/fixtures/noaa-hendersonville.json');
const NOAA_TABLE_URL = 'https://gml.noaa.gov/grad/solcalc/table.php?lat=36.3048&lon=-86.5974&year=2026';
const NOAA_SUNRISE_URL = 'https://gml.noaa.gov/grad/solcalc/sunrise.html';
const NOAA_AZEL_URL = 'https://gml.noaa.gov/grad/solcalc/azel.html';
const DATE_KEYS = ['2026-03-16', '2026-03-20', '2026-06-20', '2026-09-22', '2026-12-21'];

function getOffsetMinutes(timeZone, date) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    timeZoneName: 'shortOffset',
    hour: '2-digit',
    minute: '2-digit'
  });
  const offsetPart = formatter.formatToParts(date).find((part) => part.type === 'timeZoneName');
  const match = offsetPart?.value.match(/GMT([+-])(\d{1,2})(?::?(\d{2}))?/);

  if (match === null || match === undefined) {
    throw new Error(`Unable to parse timezone offset from "${offsetPart?.value ?? 'unknown'}"`);
  }

  const sign = match[1] === '+' ? 1 : -1;
  return sign * (Number(match[2]) * 60 + Number(match[3] ?? '0'));
}

function utcMinutesToIso(dateIso, minutes) {
  const [year, month, day] = dateIso.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0) + Math.round(minutes * 60_000)).toISOString();
}

function buildAzelContext(azelHtml) {
  const scripts = [...azelHtml.matchAll(/<SCRIPT LANGUAGE="JavaScript">([\s\S]*?)<\/SCRIPT>/gi)].map(
    (match) => match[1]
  );
  const context = {
    console,
    Math,
    Date,
    alert: () => {},
    document: { writeln: () => {} },
    window: {}
  };
  vm.createContext(context);
  vm.runInContext(`${scripts[0]}\n${scripts[1]}`, context);
  return context;
}

function buildSunriseContext(sunriseHtml) {
  const scripts = [...sunriseHtml.matchAll(/<SCRIPT LANGUAGE="JavaScript">([\s\S]*?)<\/SCRIPT>/gi)].map(
    (match) => match[1]
  );
  const context = {
    console,
    Math,
    Date,
    alert: () => {},
    document: { writeln: () => {} },
    window: {}
  };
  vm.createContext(context);
  vm.runInContext(`${scripts[0]}\n${scripts[1]}`, context);
  return context;
}

function runNoaaSolarPosition(azelContext, utcIsoString, timeZone) {
  const utcDate = new Date(utcIsoString);
  const offsetMinutes = getOffsetMinutes(timeZone, utcDate);
  const dstEnabled = offsetMinutes === -300 ? 1 : 0;
  const localDate = new Date(
    utcDate.toLocaleString('en-US', {
      timeZone
    })
  );

  const latLongForm = {
    latDeg: { value: '36.3048' },
    latMin: { value: '0' },
    latSec: { value: '0' },
    lonDeg: { value: '86.5974' },
    lonMin: { value: '0' },
    lonSec: { value: '0' },
    hrsToGMT: { value: '6' }
  };
  const riseSetForm = {
    mos: { selectedIndex: utcDate.getUTCMonth() },
    day: { value: String(utcDate.getUTCDate()) },
    year: { value: String(utcDate.getUTCFullYear()) },
    hour: { value: String(localDate.getHours()) },
    mins: { value: String(localDate.getMinutes()) },
    secs: { value: String(localDate.getSeconds()) },
    ampm: [{ checked: false }, { checked: false }, { checked: true }],
    eqTime: { value: '' },
    solarDec: { value: '' },
    azimuth: { value: '' },
    elevation: { value: '' },
    coszen: { value: '' }
  };

  azelContext.calcSun(riseSetForm, latLongForm, dstEnabled, 0);

  return {
    solarNoonAzimuth: Number(riseSetForm.azimuth.value),
    solarNoonAltitude: Number(riseSetForm.elevation.value)
  };
}

async function main() {
  const [tableHtml, sunriseHtml, azelHtml] = await Promise.all([
    fetch(NOAA_TABLE_URL).then((response) => response.text()),
    fetch(NOAA_SUNRISE_URL).then((response) => response.text()),
    fetch(NOAA_AZEL_URL).then((response) => response.text())
  ]);

  const timezoneMatch = tableHtml.match(/Time Zone Offset: ([^<]+?) [+-]\d+(?:\.\d+)?</);
  if (timezoneMatch === null) {
    throw new Error('Unable to determine NOAA timezone from table response');
  }

  const timeZone = timezoneMatch[1];
  const sunriseContext = buildSunriseContext(sunriseHtml);
  const azelContext = buildAzelContext(azelHtml);

  const payload = {
    source: {
      tableUrl: NOAA_TABLE_URL,
      sunriseUrl: NOAA_SUNRISE_URL,
      azelUrl: NOAA_AZEL_URL
    },
    location: {
      name: 'Hendersonville, TN',
      latitude: 36.3048,
      longitude: -86.5974,
      timezone: timeZone
    },
    referenceDates: Object.fromEntries(
      DATE_KEYS.map((dateKey) => {
        const [year, month, day] = dateKey.split('-').map(Number);
        const julianDay = sunriseContext.calcJD(year, month, day);
        const julianCentury = sunriseContext.calcTimeJulianCent(julianDay);
        const sunrise = utcMinutesToIso(dateKey, sunriseContext.calcSunriseUTC(julianDay, 36.3048, 86.5974));
        const sunset = utcMinutesToIso(dateKey, sunriseContext.calcSunsetUTC(julianDay, 36.3048, 86.5974));
        const solarNoon = utcMinutesToIso(dateKey, sunriseContext.calcSolNoonUTC(julianCentury, 86.5974));

        return [
          dateKey,
          {
            sunrise,
            sunset,
            solarNoon,
            ...runNoaaSolarPosition(azelContext, solarNoon, timeZone)
          }
        ];
      })
    )
  };

  await fs.writeFile(OUTPUT_PATH, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.stack ?? error.message : String(error)}\n`);
  process.exitCode = 1;
});
