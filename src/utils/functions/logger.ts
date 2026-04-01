/**
 * Central logging utility for V-Campus Express
 *
 * Provides a factory function to create service-specific loggers with
 * structured logging, log level filtering, and environment-aware formatting.
 *
 * @example
 * ```typescript
 * const logger = createLogger('UserService')
 * logger.info('User created', { userId: '123', email: 'user@example.com' })
 * logger.error('Database connection failed', { error: err })
 * ```
 */

/**
 * Available log levels in ascending order of severity
 */
export const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
} as const

export type LogLevel = keyof typeof LOG_LEVELS

/**
 * ANSI color codes for terminal output
 */
const COLORS = {
  RESET: '\x1b[0m',
  DIM: '\x1b[2m',
  BLUE: '\x1b[34m',
  YELLOW: '\x1b[33m',
  RED: '\x1b[31m',
  GRAY: '\x1b[90m',
} as const

/**
 * Log entry structure
 */
interface LogEntry {
  timestamp: string
  level: LogLevel
  service: string
  message: string
  meta?: unknown[]
}

/**
 * Logger instance interface
 */
export interface Logger {
  debug: (message: string, ...meta: unknown[]) => void
  info: (message: string, ...meta: unknown[]) => void
  warn: (message: string, ...meta: unknown[]) => void
  error: (message: string, ...meta: unknown[]) => void
}

/**
 * Gets the current log level from environment variable
 * Defaults to INFO in production, DEBUG in development
 */
const getCurrentLogLevel = (): LogLevel => {
  const envLogLevel = process.env.LOG_LEVEL?.toUpperCase() as LogLevel | undefined

  if (envLogLevel && envLogLevel in LOG_LEVELS) {
    return envLogLevel
  }

  return process.env.NODE_ENV === 'production' ? 'INFO' : 'DEBUG'
}

/**
 * Determines if logs should be formatted as JSON (production) or pretty-printed (development)
 */
const shouldUseJsonFormat = (): boolean => {
  return process.env.NODE_ENV === 'production' || process.env.LOG_FORMAT === 'json'
}

/**
 * Checks if a log level should be output based on current configuration
 */
const shouldLog = (level: LogLevel): boolean => {
  const currentLevel = getCurrentLogLevel()
  return LOG_LEVELS[level] >= LOG_LEVELS[currentLevel]
}

/**
 * Gets the color code for a specific log level
 */
const getColorForLevel = (level: LogLevel): string => {
  switch (level) {
    case 'DEBUG':
      return COLORS.GRAY
    case 'INFO':
      return COLORS.BLUE
    case 'WARN':
      return COLORS.YELLOW
    case 'ERROR':
      return COLORS.RED
    default:
      return COLORS.RESET
  }
}

/**
 * Formats a log entry as a JSON string for production environments
 */
const formatAsJson = (entry: LogEntry): string => {
  const logObject: Record<string, unknown> = {
    timestamp: entry.timestamp,
    level: entry.level,
    service: entry.service,
    message: entry.message,
  }

  // Add metadata if present
  if (entry.meta && entry.meta.length > 0) {
    if (entry.meta.length === 1) {
      logObject.meta = entry.meta[0]
    } else {
      logObject.meta = entry.meta
    }
  }

  return JSON.stringify(logObject)
}

/**
 * Formats a log entry as a pretty-printed string for development environments
 */
const formatAsPretty = (entry: LogEntry): string => {
  const color = getColorForLevel(entry.level)
  const timestamp = COLORS.DIM + entry.timestamp + COLORS.RESET
  const level = color + entry.level.padEnd(5) + COLORS.RESET
  const service = COLORS.DIM + `[${entry.service}]` + COLORS.RESET

  let output = `${timestamp} ${level} ${service} ${entry.message}`

  // Add metadata if present
  if (entry.meta && entry.meta.length > 0) {
    const metaStr = entry.meta
      .map((m) => {
        if (typeof m === 'object') {
          return '\n' + COLORS.DIM + JSON.stringify(m, null, 2) + COLORS.RESET
        }
        return String(m)
      })
      .join(' ')

    output += ' ' + metaStr
  }

  return output
}

/**
 * Formats a log entry based on environment configuration
 */
const formatLogEntry = (entry: LogEntry): string => {
  return shouldUseJsonFormat() ? formatAsJson(entry) : formatAsPretty(entry)
}

/**
 * Writes a log entry to the appropriate output stream
 */
const writeLog = (level: LogLevel, formattedLog: string): void => {
  // Write ERROR and WARN to stderr, others to stdout
  if (level === 'ERROR' || level === 'WARN') {
    process.stderr.write(formattedLog + '\n')
  } else {
    process.stdout.write(formattedLog + '\n')
  }
}

/**
 * Core logging function that processes and outputs log entries
 */
const log = (level: LogLevel, service: string, message: string, meta: unknown[]): void => {
  if (!shouldLog(level)) {
    return
  }

  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    service,
    message,
    meta: meta.length > 0 ? meta : undefined,
  }

  const formattedLog = formatLogEntry(entry)
  writeLog(level, formattedLog)
}

/**
 * Factory function to create a logger instance for a specific service
 *
 * @param serviceName - Name of the service using this logger (e.g., 'UserService', 'AuthController')
 * @returns Logger instance with debug, info, warn, and error methods
 *
 * @example
 * ```typescript
 * const logger = createLogger('UserService')
 *
 * // Log with just a message
 * logger.info('User service initialized')
 *
 * // Log with metadata
 * logger.info('User created', { userId: '123', email: 'user@example.com' })
 *
 * // Log with multiple metadata objects
 * logger.error('Operation failed', { userId: '123' }, { error: err.message })
 * ```
 */
export const createLogger = (serviceName: string): Logger => {
  return {
    debug: (message: string, ...meta: unknown[]): void => {
      log('DEBUG', serviceName, message, meta)
    },

    info: (message: string, ...meta: unknown[]): void => {
      log('INFO', serviceName, message, meta)
    },

    warn: (message: string, ...meta: unknown[]): void => {
      log('WARN', serviceName, message, meta)
    },

    error: (message: string, ...meta: unknown[]): void => {
      log('ERROR', serviceName, message, meta)
    },
  }
}
