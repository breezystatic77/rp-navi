/* Grab all dependencies *****************************************************/
var createError = require('http-errors')
var dotenv = require('dotenv')
var express = require('express')
var session = require('express-session')
var cookieSession = require('cookie-session')
var path = require('path')
var cookieParser = require('cookie-parser')
var morgan = require('morgan')

/* Get environment settings **************************************************/
dotenv.config()

/* Setup dependencies ********************************************************/
const logger = require('./utils/utils').logger
const httpLogger = require('./utils/utils').httpLogger
logger.info('Running server with environment %s', process.env.NODE_ENV)

/* Setup DB ******************************************************************/
if (process.env.DB_TYPE === 'mongodb') {
    const mongoose = require('mongoose')
    mongoose.set('useCreateIndex', true)
    mongoose.connect('mongodb://127.0.0.1/rpn_db', {
        useNewUrlParser: true
    })
    require('./models/account-schema.js')
} else {
    logger.error('No database type defined in DB_TYPE, exiting')
    process.exit()
}

/* Setup middleware **********************************************************/
var app = express()

app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'pug')
app.use(cookieSession({
    name: process.env.COOKIE_NAME,
    secret: process.env.COOKIE_SECRET,
    maxAge: process.env.COOKIE_TTL_DEV
}))
app.use(session({
    secret: process.env.SESSION_SECRET,
    saveUninitialized: true,
    resave: true,
    cookie: {
        name: process.env.COOKIE_NAME,
    },
}))
app.use(morgan('combined', {
    stream: httpLogger.stream
}))
app.use(express.json())
app.use(express.urlencoded({
    extended: false
}))
app.use(cookieParser())
app.use(express.static(path.join(__dirname, 'public')))

/* Setup Routes **************************************************************/
let adminRouter = require('./routes/admin')

app.use('/', adminRouter)

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