'use strict'
/**
 * Notes
 * Use '.load account-test-setup.js' to 'import' this script
 */
/* Imports */
const mongoose = require('mongoose')
require('../model/account-schema.js')
require('../model/reset-pw-schema.js')
const accountCtrl = require('../controller/accounts')
const logger = require('../common/utils').logger


let request = {
	username: '',
	password: '',
	email: '',
	session: {
		id: 0,
		destroy: function(){
			logger.info('Destroying session')
			request.session.id = 0
		}
	}
}

let response = {
	json: function(result) {
		console.log(result)
	}
}

function createAccount(username, password, email) {
	request.username = username
	request.password = password
	request.email = email
	accountCtrl.signup(request, response)
}

exports.createAccount = createAccount
exports.request = request
exports.res = response