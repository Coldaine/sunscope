/**
 * @module @sunscope/core/logger
 * @description Structured logging with injectable TestLogger for testing
 * 
 * All modules receive a logger instance. Tests use TestLogger that captures
 * entries in an array for assertions.
 * 
 * Dependencies: None (pure TypeScript)
 * Conventions: Never use console.log anywhere in the codebase
 */

/** Log levels */
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR'
}

/** Log entry structure */
export interface LogEntry {
  /** ISO 8601 timestamp in UTC */
  timestamp: string;
  /** Module/component name */
  module: string;
  /** Log level */
  level: LogLevel;
  /** Log message */
  message: string;
  /** Additional data payload */
  data?: Record<string, unknown>;
}

/** Logger interface */
export interface ILogger {
  debug(message: string, data?: Record<string, unknown>): void;
  info(message: string, data?: Record<string, unknown>): void;
  warn(message: string, data?: Record<string, unknown>): void;
  error(message: string, data?: Record<string, unknown>): void;
}

/**
 * Create a timestamp in ISO 8601 UTC format
 * @returns ISO timestamp string
 */
function createTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Console logger implementation
 * Uses console methods but with structured format
 */
export class ConsoleLogger implements ILogger {
  constructor(private module: string) {}

  private log(level: LogLevel, message: string, data?: Record<string, unknown>): void {
    const entry: LogEntry = {
      timestamp: createTimestamp(),
      module: this.module,
      level,
      message,
      data
    };

    const formatted = `[${entry.timestamp}] [${level}] [${this.module}] ${message}`;
    
    switch (level) {
      case LogLevel.DEBUG:
        // Debug only in development
        if (process.env.NODE_ENV !== 'production') {
          console.debug(formatted, data ? JSON.stringify(data) : '');
        }
        break;
      case LogLevel.INFO:
        console.info(formatted, data ? JSON.stringify(data) : '');
        break;
      case LogLevel.WARN:
        console.warn(formatted, data ? JSON.stringify(data) : '');
        break;
      case LogLevel.ERROR:
        console.error(formatted, data ? JSON.stringify(data) : '');
        break;
    }
  }

  debug(message: string, data?: Record<string, unknown>): void {
    this.log(LogLevel.DEBUG, message, data);
  }

  info(message: string, data?: Record<string, unknown>): void {
    this.log(LogLevel.INFO, message, data);
  }

  warn(message: string, data?: Record<string, unknown>): void {
    this.log(LogLevel.WARN, message, data);
  }

  error(message: string, data?: Record<string, unknown>): void {
    this.log(LogLevel.ERROR, message, data);
  }
}

/**
 * Test logger that captures entries for assertions
 * Use this in tests to verify logging behavior
 */
export class TestLogger implements ILogger {
  public entries: LogEntry[] = [];

  constructor(private module: string) {}

  private log(level: LogLevel, message: string, data?: Record<string, unknown>): void {
    this.entries.push({
      timestamp: createTimestamp(),
      module: this.module,
      level,
      message,
      data
    });
  }

  debug(message: string, data?: Record<string, unknown>): void {
    this.log(LogLevel.DEBUG, message, data);
  }

  info(message: string, data?: Record<string, unknown>): void {
    this.log(LogLevel.INFO, message, data);
  }

  warn(message: string, data?: Record<string, unknown>): void {
    this.log(LogLevel.WARN, message, data);
  }

  error(message: string, data?: Record<string, unknown>): void {
    this.log(LogLevel.ERROR, message, data);
  }

  /**
   * Clear all captured entries
   */
  clear(): void {
    this.entries = [];
  }

  /**
   * Get entries filtered by level
   */
  getEntriesByLevel(level: LogLevel): LogEntry[] {
    return this.entries.filter(e => e.level === level);
  }

  /**
   * Check if any entry matches the predicate
   */
  hasEntry(predicate: (entry: LogEntry) => boolean): boolean {
    return this.entries.some(predicate);
  }

  /**
   * Find entry by message substring
   */
  findByMessage(substring: string): LogEntry | undefined {
    return this.entries.find(e => e.message.includes(substring));
  }
}

/**
 * Null logger that does nothing
 * Use this when you explicitly don't want logging
 */
export class NullLogger implements ILogger {
  debug(): void {}
  info(): void {}
  warn(): void {}
  error(): void {}
}

/**
 * Logger factory - create appropriate logger based on environment
 */
export function createLogger(module: string): ILogger {
  if (process.env.NODE_ENV === 'test') {
    return new TestLogger(module);
  }
  return new ConsoleLogger(module);
}
