/**
 * Winston Logger
 * Structured logging with console (dev) and file (prod) transports.
 */
const { createLogger, format, transports } = require('winston');
const config = require('../config/env');

const logger = createLogger({
  level: config.logLevel,
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: true }),
    format.json()
  ),
  defaultMeta: { service: 'pdf-converter' },
  transports: [
    // Console transport — always active
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.printf(({ timestamp, level, message, ...meta }) => {
          const metaStr = Object.keys(meta).length > 1
            ? ` ${JSON.stringify(meta, null, 0)}`
            : '';
          return `${timestamp} [${level}]: ${message}${metaStr}`;
        })
      ),
    }),
  ],
});

// File transport in production
if (!config.isDev) {
  logger.add(
    new transports.File({ filename: 'logs/error.log', level: 'error', maxsize: 5242880, maxFiles: 5 })
  );
  logger.add(
    new transports.File({ filename: 'logs/combined.log', maxsize: 5242880, maxFiles: 5 })
  );
}

module.exports = logger;
