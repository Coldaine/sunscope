import { TestLogger, createLogger } from '../src/logger';

describe('logger', () => {
  it('captures structured entries in UTC for assertions', () => {
    const testLogger = new TestLogger();
    const logger = createLogger({
      moduleName: 'logger-test',
      sink: testLogger
    });

    logger.debug('sample.message', { value: 42 });

    expect(testLogger.entries).toContainEqual(
      expect.objectContaining({
        module: 'logger-test',
        level: 'DEBUG',
        message: 'sample.message',
        data: { value: 42 }
      })
    );
    expect(testLogger.entries[0]?.timestamp.endsWith('Z')).toBe(true);
  });

  it('supports child module loggers', () => {
    const testLogger = new TestLogger();
    const parent = createLogger({
      moduleName: 'parent',
      sink: testLogger
    });

    parent.child('child').info('child.message', { branch: 'test' });

    expect(testLogger.entries).toContainEqual(
      expect.objectContaining({
        module: 'child',
        level: 'INFO',
        message: 'child.message'
      })
    );
  });
});
