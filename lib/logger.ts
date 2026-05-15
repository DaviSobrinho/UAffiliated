type LogLevel = "INFO" | "WARN" | "ERROR" | "DEBUG" | "SLOW";

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  module: string;
  message: string;
  duration?: number;
  error?: string;
}

const LOG_DIR = process.cwd();

export class Logger {
  private module: string;
  private logs: LogEntry[] = [];

  constructor(module: string) {
    this.module = module;
  }

  private formatLog(entry: LogEntry): string {
    const { timestamp, level, module, message, duration, error } = entry;
    let log = `[${timestamp}] [${level}] [${module}] ${message}`;
    if (duration) log += ` (${duration}ms)`;
    if (error) log += ` - ${error}`;
    return log;
  }

  info(message: string, duration?: number) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: "INFO",
      module: this.module,
      message,
      duration,
    };
    this.logs.push(entry);
    console.log(this.formatLog(entry));
  }

  warn(message: string, error?: string) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: "WARN",
      module: this.module,
      message,
      error,
    };
    this.logs.push(entry);
    console.warn(this.formatLog(entry));
  }

  error(message: string, error?: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: "ERROR",
      module: this.module,
      message,
      error: errorMessage,
    };
    this.logs.push(entry);
    console.error(this.formatLog(entry));
  }

  slow(path: string, duration: number) {
    if (duration > 1000) {
      const entry: LogEntry = {
        timestamp: new Date().toISOString(),
        level: "SLOW",
        module: this.module,
        message: `SLOW REQUEST: ${path}`,
        duration,
      };
      this.logs.push(entry);
      console.warn(`⚠️  ${this.formatLog(entry)}`);
    }
  }

  debug(message: string, data?: unknown) {
    if (process.env.DEBUG) {
      const entry: LogEntry = {
        timestamp: new Date().toISOString(),
        level: "DEBUG",
        module: this.module,
        message,
      };
      this.logs.push(entry);
      console.log(this.formatLog(entry), data);
    }
  }

  getLogs() {
    return this.logs;
  }

  clearLogs() {
    this.logs = [];
  }
}

// Export singleton instances for common modules
export const authLogger = new Logger("AUTH");
export const apiLogger = new Logger("API");
export const dbLogger = new Logger("DATABASE");
export const serverLogger = new Logger("SERVER");
export const houseLogger = new Logger("HOUSE");
