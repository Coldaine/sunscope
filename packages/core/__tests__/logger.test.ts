/**
 * @module @sunscope/core/__tests__/logger
 * @description Tests for structured logger
 */

import {
  TestLogger,
  NullLogger,
  LogLevel,
  ILogger
} from '../src/logger';

describe('Logger', () => {
  describe('TestLogger', () => {
    let logger: TestLogger;

    beforeEach(() => {
      logger = new TestLogger('test-module');
    });

    afterEach(() => {
      logger.clear();
    });

    it('should capture debug entries', () => {
      logger.debug('test debug', { key: 'value' });
      
      expect(logger.entries).toHaveLength(1);
      expect(logger.entries[0].level).toBe(LogLevel.DEBUG);
      expect(logger.entries[0].message).toBe('test debug');
      expect(logger.entries[0].module).toBe('test-module');
      expect(logger.entries[0].data).toEqual({ key: 'value' });
    });

    it('should capture info entries', () => {
      logger.info('test info');
      
      expect(logger.entries[0].level).toBe(LogLevel.INFO);
    });

    it('should capture warn entries', () => {
      logger.warn('test warn');
      
      expect(logger.entries[0].level).toBe(LogLevel.WARN);
    });

    it('should capture error entries', () => {
      logger.error('test error');
      
      expect(logger.entries[0].level).toBe(LogLevel.ERROR);
    });

    it('should clear entries', () => {
      logger.debug('message');
      logger.clear();
      
      expect(logger.entries).toHaveLength(0);
    });

    it('should filter by level', () => {
      logger.debug('debug');
      logger.info('info');
      logger.error('error');
      
      const errors = logger.getEntriesByLevel(LogLevel.ERROR);
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toBe('error');
    });

    it('should find by message substring', () => {
      logger.debug('first message');
      logger.debug('second message');
      
      const found = logger.findByMessage('second');
      expect(found).toBeDefined();
      expect(found!.message).toBe('second message');
    });

    it('should check hasEntry predicate', () => {
      logger.debug('test', { count: 5 });
      
      const hasCount5 = logger.hasEntry(e => e.data?.count === 5);
      expect(hasCount5).toBe(true);
      
      const hasCount10 = logger.hasEntry(e => e.data?.count === 10);
      expect(hasCount10).toBe(false);
    });

    it('should have ISO timestamp', () => {
      logger.debug('test');
      
      const entry = logger.entries[0];
      expect(entry.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('should get last entry', () => {
      logger.debug('first');
      logger.debug('second');
      
      const last = logger.getLastEntry();
      expect(last?.message).toBe('second');
    });

    it('should return undefined for last entry when empty', () => {
      expect(logger.getLastEntry()).toBeUndefined();
    });

    it('should get entry count', () => {
      expect(logger.count).toBe(0);
      logger.debug('test');
      expect(logger.count).toBe(1);
      logger.info('test2');
      expect(logger.count).toBe(2);
    });
  });

  describe('NullLogger', () => {
    it('should not throw or store anything', () => {
      const logger: ILogger = new NullLogger();
      
      expect(() => {
        logger.debug('test');
        logger.info('test');
        logger.warn('test');
        logger.error('test');
      }).not.toThrow();
    });
  });
});
