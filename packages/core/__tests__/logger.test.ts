/**
 * Tests for logger.ts — R-CORE-010
 */

import { TestLogger, DefaultLogger, LogLevel } from '../src/logger';

describe('TestLogger', () => {
  let log: TestLogger;

  beforeEach(() => { log = new TestLogger('test-module'); });

  it('captures DEBUG entries', () => {
    log.debug('hello', { x: 1 });
    expect(log.entries).toContainEqual(expect.objectContaining({
      level: 'DEBUG',
      message: 'hello',
    }));
  });

  it('captures INFO entries', () => {
    log.info('info message');
    expect(log.entries).toContainEqual(expect.objectContaining({ level: 'INFO', message: 'info message' }));
  });

  it('captures WARN entries', () => {
    log.warn('warning');
    expect(log.entries).toContainEqual(expect.objectContaining({ level: 'WARN' }));
  });

  it('captures ERROR entries', () => {
    log.error('bad thing', { code: 500 });
    expect(log.entries).toContainEqual(expect.objectContaining({ level: 'ERROR', message: 'bad thing' }));
  });

  it('entries have ISO UTC timestamps', () => {
    log.info('ts test');
    const ts = log.entries[0].timestamp;
    expect(ts).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    // Must end with Z (UTC)
    expect(ts).toMatch(/Z$/);
  });

  it('entries include module name', () => {
    log.info('module test');
    expect(log.entries[0].module).toBe('test-module');
  });

  it('entries include data payload when provided', () => {
    log.debug('with data', { key: 'value' });
    const entry = log.entries.find(e => e.message === 'with data');
    expect(entry?.data).toEqual({ key: 'value' });
  });

  it('.at() filters by level', () => {
    log.debug('d1');
    log.info('i1');
    log.warn('w1');
    log.debug('d2');
    const debugs = log.at('DEBUG');
    expect(debugs.length).toBe(2);
    expect(debugs.every(e => e.level === 'DEBUG')).toBe(true);
  });

  it('.clear() empties entries', () => {
    log.info('x');
    log.clear();
    expect(log.entries.length).toBe(0);
  });

  it('does not include data key when no data given', () => {
    log.info('no data');
    const entry = log.entries[0];
    expect(entry).not.toHaveProperty('data');
  });
});

describe('DefaultLogger', () => {
  it('can be instantiated without errors', () => {
    const log = new DefaultLogger('default-test');
    // Should not throw — writes to stderr which we don't capture in tests
    expect(() => log.debug('test')).not.toThrow();
    expect(() => log.info('test')).not.toThrow();
    expect(() => log.warn('test')).not.toThrow();
    expect(() => log.error('test')).not.toThrow();
  });

  it('respects minLevel — INFO level suppresses DEBUG', () => {
    const stderrSpy = jest.spyOn(process.stderr, 'write').mockImplementation(() => true);
    const log = new DefaultLogger('test', 'INFO');
    log.debug('should be suppressed');
    expect(stderrSpy).not.toHaveBeenCalled();
    log.info('should be emitted');
    expect(stderrSpy).toHaveBeenCalledTimes(1);
    stderrSpy.mockRestore();
  });

  it('writes structured JSON to stderr', () => {
    const stderrSpy = jest.spyOn(process.stderr, 'write').mockImplementation(() => true);
    const log = new DefaultLogger('json-test');
    log.info('hello', { key: 42 });
    expect(stderrSpy).toHaveBeenCalledTimes(1);
    const written = (stderrSpy.mock.calls[0][0] as string).trim();
    const parsed = JSON.parse(written);
    expect(parsed.module).toBe('json-test');
    expect(parsed.level).toBe('INFO');
    expect(parsed.message).toBe('hello');
    expect(parsed.data.key).toBe(42);
    stderrSpy.mockRestore();
  });
});

describe('TestLogger — defaults', () => {
  it('default module name is "test"', () => {
    const log = new TestLogger();
    log.info('x');
    expect(log.entries[0].module).toBe('test');
  });

  it('entries preserve insertion order', () => {
    const log = new TestLogger();
    log.info('first');
    log.warn('second');
    log.error('third');
    expect(log.entries[0].message).toBe('first');
    expect(log.entries[1].message).toBe('second');
    expect(log.entries[2].message).toBe('third');
  });
});
