const mongoose = require('mongoose')
const { MongoMemoryServer } = require('mongodb-memory-server')

require('./account-schema')

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

let mongod

beforeAll(async () => {
	mongod = new MongoMemoryServer()
	const connectionString = await mongod.getConnectionString()

	await mongoose.connect(connectionString, {
		useUnifiedTopology: true,
		useNewUrlParser: true,
		useCreateIndex: true,
		useFindAndModify: true
	})
})

afterAll(async () => {
	await mongoose.disconnect()
	await mongod.stop()
})

let userAccount

beforeEach(async () => {
	const { account } = await createAccount(USERNAME, PASSWORD, EMAIL)
	userAccount = account
})

afterEach(async () => {
	await mongoose.connection.db.dropDatabase()
})

it('runs jest', () => {
	expect(true).toBeTruthy()
})

it('createAccount()', async () => {
	const { status } = await createAccount('person12345', PASSWORD, EMAIL)
	expect(status).toBe(SUCCESS)
})

it.skip('verifyAccount()', async () => {})

it('verifyPassword()', async () => {
	const { status } = await verifyPassword(USERNAME, PASSWORD)
	expect(status).toBe(SUCCESS)
})

it('updateEmail()', async () => {
	const { status } = await updateEmail(USERNAME, 'new_email_123@gmail.gov')
	expect(status).toBe(SUCCESS)
})

// TODO getAccountData unit test
it.skip('getAccountData()', async () => {})

// TODO updatePassword unit test
it.skip('updatePassword()', async () => {})

// TODO requestPwReset unit test
it.skip('requestPwReset()', async () => {})

// TODO deactivateAccount unit test
it.skip('deactivateAccount()', async () => {})
