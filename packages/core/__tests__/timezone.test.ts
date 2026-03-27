import fs from 'node:fs';
import path from 'node:path';
import { TestLogger, createLogger } from '../src/logger';
import { formatUtcDateForTimeZone, getTimeZoneForCoordinates } from '../src/timezone';

function walkFiles(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'coverage') {
        return [];
      }
      return walkFiles(fullPath);
    }
    return [fullPath];
  });
}

describe('timezone', () => {
  it('resolves Hendersonville to America/Chicago', () => {
    expect(getTimeZoneForCoordinates(36.3048, -86.5974)).toBe('America/Chicago');
  });

  it('redacts coordinates from timezone lookup logs', () => {
    const sink = new TestLogger();
    const logger = createLogger({
      moduleName: 'timezone',
      sink
    });

    getTimeZoneForCoordinates(12.3456, -78.9012, logger);

    const payload = JSON.stringify(sink.entries);
    expect(payload).not.toContain('12.3456');
    expect(payload).not.toContain('-78.9012');
  });

  it('formats UTC instants for a target timezone without mutating the input', () => {
    const date = new Date('2026-03-16T18:00:00Z');

    expect(formatUtcDateForTimeZone(date, 'America/Chicago')).toContain('13:00');
    expect(date.toISOString()).toBe('2026-03-16T18:00:00.000Z');
  });

  it('does not create dates from timezone-implicit ISO strings', () => {
    const packageRoot = path.resolve(__dirname, '..');
    const files = walkFiles(packageRoot).filter((filePath) => /\.(ts|tsx)$/.test(filePath));
    const offenders: string[] = [];

    files.forEach((filePath) => {
      const content = fs.readFileSync(filePath, 'utf8');
      const matches = content.match(/new Date\('(\d{4}-\d{2}-\d{2}T[^']*)'\)/g) ?? [];
      matches.forEach((match) => {
        if (!match.includes('Z')) {
          offenders.push(`${filePath}: ${match}`);
        }
      });
    });

    expect(offenders).toEqual([]);
  });
});
