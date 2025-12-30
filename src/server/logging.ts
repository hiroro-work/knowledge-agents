import { Logging } from '@google-cloud/logging';
import { isDevelopment, isLocal, isTest } from '~/utils/utils';
import type { LogEntry } from '@google-cloud/logging/build/src/entry';

type LogLevel = 'info' | 'warn' | 'error';

const LOG_CONFIG = {
  info: {
    logName: 'info',
    severity: 'INFO',
    consoleMethod: console.info,
  },
  warn: {
    logName: 'warning',
    severity: 'WARNING',
    consoleMethod: console.warn,
  },
  error: {
    logName: 'error',
    severity: 'ERROR',
    consoleMethod: console.error,
  },
} as const;

let _logging: Logging | null = null;
const getLogging = () => {
  if (!_logging) {
    _logging = new Logging();
  }
  return _logging;
};

const logMessage = async (level: LogLevel, message: string, data?: Record<string, unknown>, metadata?: LogEntry) => {
  const { logName, severity, consoleMethod } = LOG_CONFIG[level];

  if (isLocal() || isDevelopment() || isTest()) {
    consoleMethod(message, data);
  } else {
    const logging = getLogging();
    const log = logging.log(logName);
    const _metadata: LogEntry = {
      ...metadata,
      severity,
      resource: {
        type: 'global',
        ...metadata?.resource,
      },
      labels: {
        service: 'app',
        ...metadata?.labels,
      },
    };
    const entry = log.entry(_metadata, { message, data });
    await log.write(entry);
  }
};

const info = async (message: string, data?: Record<string, unknown>, metadata?: LogEntry) => {
  return logMessage('info', message, data, metadata);
};

const warn = async (message: string, data?: Record<string, unknown>, metadata?: LogEntry) => {
  return logMessage('warn', message, data, metadata);
};

const error = async (message: string, data?: Record<string, unknown>, metadata?: LogEntry) => {
  return logMessage('error', message, data, metadata);
};

export const logger = {
  info,
  warn,
  error,
};
