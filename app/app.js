/** Get dotenv settings */

require('dotenv-flow').config()

/* Grab all dependencies *****************************************************/
var createError = require('http-errors')
var express = require('express')
var session = require('express-session')
var cookieSession = require('cookie-session')
var path = require('path')
var cookieParser = require('cookie-parser')
var morgan = require('morgan')

/* Setup dependencies ********************************************************/
const logger = require('./utils/utils').logger
const httpLogger = require('./utils/utils').httpLogger
logger.info('Running server with environment %s', process.env.NODE_ENV)

/* Setup DB ******************************************************************/
if (process.env.DB_TYPE === 'mongodb') {
	const mongoose = require('mongoose')
	mongoose.set('useCreateIndex', true)
	const connectionUrl = `mongodb://${process.env.DB_IP}:27017/rpn_db`
	logger.info('attempting to connect to mongodb at ' + connectionUrl)
	mongoose.connect(connectionUrl, {
		useNewUrlParser: true,
		useUnifiedTopology: true
	}).then(() => {
		logger.info('connected to mongoDB')
	}).catch((err) => {
		logger.error('error connecting to mongodb:', err.message)
	})
	require('./models/account-schema.js')
} else {
	logger.error('No database type defined in DB_TYPE, exiting')
	process.exit()
}

/* Setup middleware **********************************************************/
var app = express()

var sessionMiddleware = cookieSession({
	name: process.env.COOKIE_NAME,
	secret: process.env.COOKIE_SECRET,
	maxAge: process.env.COOKIE_TTL_DEV
})

app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'pug')
app.use(cookieParser())
/*app.use(session({
	secret: process.env.SESSION_SECRET,
	saveUninitialized: true,
	resave: true,
	cookie: {
		name: process.env.COOKIE_NAME,
	},
}))*/
app.use(sessionMiddleware)
app.use(morgan('short', {
	stream: httpLogger.stream
}))
app.use(express.json())
app.use(express.urlencoded({
	extended: false
}))
app.use(express.static(path.join(__dirname, 'public')))

/* Setup Routes **************************************************************/
let indexRouter = require('./routes/index')
let usersRouter = require('./routes/users')
let chatRouter = require('./routes/chat')

app.use('/', indexRouter)
app.use('/user', usersRouter)
app.use('/chat', chatRouter)

/* Add routes if doing development */
if (process.env.NODE_ENV === 'development') {
	var devRouter = require('./routes/dev')
	app.use('/dev', devRouter)
}

// catch 404 and forward to error handler
app.use(function (req, res, next) {
	next(createError(404))
})

// error handler
app.use(function (err, req, res, next) {
	// set locals, only providing error in development
	res.locals.message = err.message
	res.locals.error = req.app.get('env') === 'development' ? err : {}

	// render the error page
	res.status(err.status || 500)
	res.render('error')
})

module.exports = app