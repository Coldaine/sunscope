/**
 * @module logger
 * @description Structured logger for SunScope. Injectable across all modules.
 * TestLogger captures entries in an array for test assertions.
 * DefaultLogger writes structured JSON to process.stderr (no console.log anywhere).
 *
 * Pattern:
 *   expect(testLogger.entries).toContainEqual(expect.objectContaining({ level: 'DEBUG', message: '...' }))
 */

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

export interface LogContext {
  [key: string]: unknown;
}

export interface LogEntry {
  timestamp: string; // ISO UTC
  module: string;
  level: LogLevel;
  message: string;
  data?: LogContext;
}

export interface Logger {
  debug(message: string, data?: LogContext): void;
  info(message: string, data?: LogContext): void;
  warn(message: string, data?: LogContext): void;
  error(message: string, data?: LogContext): void;
}

const LEVEL_RANK: Record<LogLevel, number> = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 };

/** Writes structured JSON lines to process.stderr. No console.log. */
export class DefaultLogger implements Logger {
  constructor(
    private readonly moduleName: string = 'sunscope',
    private readonly minLevel: LogLevel = 'DEBUG'
  ) {}

  private write(level: LogLevel, message: string, data?: LogContext): void {
    if (LEVEL_RANK[level] < LEVEL_RANK[this.minLevel]) return;
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      module: this.moduleName,
      level,
      message,
      ...(data !== undefined ? { data } : {}),
    };
    process.stderr.write(JSON.stringify(entry) + '\n');
  }

  debug(message: string, data?: LogContext): void { this.write('DEBUG', message, data); }
  info(message: string, data?: LogContext): void { this.write('INFO', message, data); }
  warn(message: string, data?: LogContext): void { this.write('WARN', message, data); }
  error(message: string, data?: LogContext): void { this.write('ERROR', message, data); }
}

/** Captures log entries in-memory for test assertions. */
export class TestLogger implements Logger {
  public entries: LogEntry[] = [];

  constructor(private readonly moduleName: string = 'test') {}

  private capture(level: LogLevel, message: string, data?: LogContext): void {
    this.entries.push({
      timestamp: new Date().toISOString(),
      module: this.moduleName,
      level,
      message,
      ...(data !== undefined ? { data } : {}),
    });
  }

  debug(message: string, data?: LogContext): void { this.capture('DEBUG', message, data); }
  info(message: string, data?: LogContext): void { this.capture('INFO', message, data); }
  warn(message: string, data?: LogContext): void { this.capture('WARN', message, data); }
  error(message: string, data?: LogContext): void { this.capture('ERROR', message, data); }

  /** Convenience: all entries at a specific level */
  at(level: LogLevel): LogEntry[] {
    return this.entries.filter(e => e.level === level);
  }

  clear(): void { this.entries = []; }
}

/** Default singleton. Modules should prefer accepting a Logger via constructor for testability. */
export const logger: Logger = new DefaultLogger();
