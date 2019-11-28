'use strict'
/**
 * Notes
 * Use '.load test-cases.js' to 'import' this script
 */
/* Imports */
const mongoose = require('mongoose')
require('../model/account-schema.js')
require('../model/reset-pw-schema.js')
const accountCtrl = require('../models/accounts')
const logger = require('../common/utils').logger

mongoose.connect('mongodb://127.0.0.1/rpn_db')

/* Constants */
const USERNAME = 'Hotaru Hino'
const EMAIL = 'hotaru.hino@outlook.com'
const NEW_EMAIL = 'hotaru.hino@gmail.com'
const PASSWORD = 'password'
const NEW_PASSWORD = '123456'

var runTest = function() {
	var userData = {
		username: USERNAME,
		email: EMAIL,
		password: PASSWORD,
		verification_key: ''
	}

	var test = accountCtrl.createAccount(USERNAME, PASSWORD, EMAIL)
	//var test = accountCtrl.verifyPassword(USERNAME, PASSWORD)
	test
		.then(response => {
			logger.info(JSON.stringify(response, undefined, 4))
			userData.verification_key = response.account.verifyKey
			return accountCtrl.verifyPassword(USERNAME, PASSWORD)
		})
		.then(response => {
			logger.info(JSON.stringify(response, undefined, 4))
			return accountCtrl.updateEmail(USERNAME, NEW_EMAIL)
		})
		.then(response => {
			logger.info(JSON.stringify(response, undefined, 4))
			return accountCtrl.getAccountData(USERNAME, [])
		})
		.then(response => {
			logger.info(JSON.stringify(response, undefined, 4))
			return accountCtrl.updatePassword(USERNAME, NEW_PASSWORD)
		})
		.then(response => {
			logger.info(JSON.stringify(response, undefined, 4))
			return accountCtrl.getAccountData(USERNAME, [])
		})
		.then(response => {
			logger.info(JSON.stringify(response, undefined, 4))
			return accountCtrl.verifyPassword(USERNAME, NEW_PASSWORD)
		})
		.then(response => {
			logger.info(JSON.stringify(response, undefined, 4))
			return accountCtrl.requestPwReset(USERNAME)
		})
		.then(response => {
			logger.info(JSON.stringify(response, undefined, 4))
			return accountCtrl.verifyPasswordReset(response.resetKey)
		})
		.then(response => {
			logger.info(JSON.stringify(response, undefined, 4))
			return accountCtrl.updatePassword(USERNAME, PASSWORD)
		})
		.then(response => {
			logger.info(JSON.stringify(response, undefined, 4))
			return accountCtrl.verifyPassword(USERNAME, PASSWORD)
		})
		.then(response => {
			logger.info(JSON.stringify(response, undefined, 4))
			return accountCtrl.verifyAccount(USERNAME, userData.verification_key)
		})
		.then(response => {
			logger.info(JSON.stringify(response, undefined, 4))
			return accountCtrl.getAccountData(USERNAME, [])
		})
		.then(response => {
			logger.info(JSON.stringify(response, undefined, 4))
			logger.info('Deleting account')
			return accountCtrl.deactivateAccount(USERNAME)
		})
		.then(response => {
			logger.info(JSON.stringify(response, undefined, 4))
			return accountCtrl.getAccountData(USERNAME, [])
		})
		.then(response => {
			logger.info(JSON.stringify(response, undefined, 4))
		})
		.catch(error => {
			logger.error('There was an error: %s', JSON.stringify(error))
		})
}

exports.runTest = runTest
