/**
 * Contains utility functions and other tools that are used by various
 * portions of the server.
 */

/**
 * Creates a new logger instance using Winston.
 */

const { createLogger, format, transports } = require('winston')
const { combine, timestamp, colorize, splat, printf } = format

let logger = createLogger({
	level: getEnvironment(),
	format: combine(
		colorize(),
		timestamp({
			format: 'YYYY-MM-DD HH:mm:ss'
		}),
		splat(),
		printf(info => `${info.timestamp} ${info.level}: ${info.message}`)
	),
	transports: [
		new transports.Console()
		/*new transports.File({
			filename: 'server-combined.log',
			level: 'info',
			timestamp: true
		}),
		new transports.File({
			filename: 'server-errors.log',
			level: 'error',
			timestamp: true
		})*/
	]
})

let httpLogger = createLogger({
	level: getEnvironment(),
	format: combine(
		timestamp({
			format: 'YYYY-MM-DD HH:mm:ss'
		}),
		splat(),
		printf(info => `${info.timestamp}: ${info.message}`)
	),
	transports: [
		new transports.Console()
		/*new transports.File({
			filename: 'http-combined.log',
			level: 'info',
			timestamp: true
		}),
		new transports.File({
			filename: 'http-errors.log',
			level: 'error',
			timestamp: true
		})*/
	]
})

httpLogger.stream = {
	write: (message, encoding) => {
		httpLogger.info(message)
	}
}

/**
 * Get the environment this module is running under.
 **/
function getEnvironment() {
	if (process.env.NODE_ENV === 'development') {
		return 'debug'
	} else if (process.env.NODE_ENV === 'verbose') {
		return 'verbose'
	} else {
		return 'info'
	}
}

function checkIfExpired(expireTime) {
	const currentTime = new Date()
	return currentTime.getTime() < expireTime
}

exports.getEnvironment = getEnvironment
exports.checkIfExpired = checkIfExpired
exports.logger = logger
exports.httpLogger = httpLogger
