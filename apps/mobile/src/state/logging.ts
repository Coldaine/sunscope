import { LogEntry, LogSink, Logger, createLogger } from '@sunscope/core';

export class BufferedLogSink implements LogSink {
  public readonly entries: LogEntry[] = [];

  public constructor(private readonly limit: number) {}

  write(entry: LogEntry): void {
    this.entries.push(entry);
    if (this.entries.length > this.limit) {
      this.entries.splice(0, this.entries.length - this.limit);
    }
  }
}

export function createAppLogger(sink: LogSink, moduleName = 'mobile-app'): Logger {
  return createLogger({
    moduleName,
    sink
  });
}
