const { MongoClient, Db } = require('mongodb')

const {
	createAccount,
	verifyPassword,
	updateEmail,
	updateAccountState,
	verifyPasswordReset,
	deactivateAccount
} = require('../models/accounts')

// https://jestjs.io/docs/en/mongodb

/* Constants */
const USERNAME = 'Hotaru Hino'
const EMAIL = 'hotaru.hino@outlook.com'
const NEW_EMAIL = 'hotaru.hino@gmail.com'
const PASSWORD = 'password'
const NEW_PASSWORD = '123456'

const SUCCESS = require('../utils/reason-codes').genericCodes.SUCCESS
const FAILURE = require('../utils/reason-codes').genericCodes.FAILURE

/** @type {import('mongodb').MongoClient} */
let connection
/** @type {import('mongodb').Db} */
let db

beforeAll(async () => {
	connection = await MongoClient.connect(global.__MONGO_URI__, {
		useNewUrlParser: true
	})
	db = await connection.db(global.__MONGO_DB_NAME__)
})

it('runs jest', () => {
	expect(true).toBeTruthy()
})

it('createAccount()', async () => {
	const { status, account } = await createAccount(USERNAME, PASSWORD, EMAIL)
})
