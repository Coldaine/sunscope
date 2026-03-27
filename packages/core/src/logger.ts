/**
 * @fileoverview Injectable structured logging for SunScope.
 *
 * Every module receives a logger instance rather than writing directly to the
 * console. Tests use `TestLogger` to capture entries for assertions. Production
 * callers can provide any sink that persists or forwards `LogEntry` objects.
 */

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

export interface LogEntry {
  timestamp: string;
  module: string;
  level: LogLevel;
  message: string;
  data?: Record<string, unknown>;
}

export interface LogSink {
  write(entry: LogEntry): void;
}

export interface Logger {
  readonly moduleName: string;
  debug(message: string, data?: Record<string, unknown>): void;
  info(message: string, data?: Record<string, unknown>): void;
  warn(message: string, data?: Record<string, unknown>): void;
  error(message: string, data?: Record<string, unknown>): void;
  child(moduleName: string): Logger;
}

export interface LoggerOptions {
  moduleName: string;
  minLevel?: LogLevel;
  sink?: LogSink;
  now?: () => Date;
}

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  DEBUG: 10,
  INFO: 20,
  WARN: 30,
  ERROR: 40
};

class NoopLogSink implements LogSink {
  write(): void {}
}

export class TestLogger implements LogSink {
  public readonly entries: LogEntry[] = [];

  write(entry: LogEntry): void {
    this.entries.push(entry);
  }

  clear(): void {
    this.entries.length = 0;
  }
}

class StructuredLogger implements Logger {
  public readonly moduleName: string;

  public constructor(
    moduleName: string,
    private readonly minLevel: LogLevel,
    private readonly sink: LogSink,
    private readonly now: () => Date
  ) {
    this.moduleName = moduleName;
  }

  public debug(message: string, data?: Record<string, unknown>): void {
    this.log('DEBUG', message, data);
  }

  public info(message: string, data?: Record<string, unknown>): void {
    this.log('INFO', message, data);
  }

  public warn(message: string, data?: Record<string, unknown>): void {
    this.log('WARN', message, data);
  }

  public error(message: string, data?: Record<string, unknown>): void {
    this.log('ERROR', message, data);
  }

  public child(moduleName: string): Logger {
    return new StructuredLogger(moduleName, this.minLevel, this.sink, this.now);
  }

  private log(level: LogLevel, message: string, data?: Record<string, unknown>): void {
    if (LOG_LEVEL_PRIORITY[level] < LOG_LEVEL_PRIORITY[this.minLevel]) {
      return;
    }

    this.sink.write({
      timestamp: this.now().toISOString(),
      module: this.moduleName,
      level,
      message,
      data
    });
  }
}

export function createLogger(options: LoggerOptions): Logger {
  return new StructuredLogger(
    options.moduleName,
    options.minLevel ?? 'DEBUG',
    options.sink ?? new NoopLogSink(),
    options.now ?? (() => new Date())
  );
}

export function measureElapsedMs(startTime: bigint): number {
  return Number(process.hrtime.bigint() - startTime) / 1_000_000;
}
