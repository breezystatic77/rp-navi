/**
 * @file Routes for developer mode on the normal app
 */
var express = require('express');
var router = express.Router();

const accountCtrl = require('../controllers/accounts')
const logger = require('../utils/utils').logger

/* GET home page. */
router.get('/user_links', getKeys);

async function getKeys(req, res) {
	try {
		let response = await accountCtrl.getAccountData(req, res)
		let accountData = {}
		accountData.username = req.session.username
		accountData.verifyKey = 'None'
		accountData.resetKey = 'None'

		if (response.data.verifyKey) {
			accountData.verifyKey = response.data.verifyKey
			accountData.verifyKey = accountData.verifyKey.replace('+', '%2B')
		}

		if (response.data.resetPwKey) {
			accountData.resetKey = response.data.resetPwKey
			accountData.resetKey = accountData.resetKey.replace('+', '%2B')
		}
		logger.debug('Account data: %s', JSON.stringify(accountData, undefined, 4))
		res.render('./dev/user-links', accountData)
	}
	catch (error) {
		logger.error('There was an error: ', error)
		req.session = null
		res.redirect('/')
	}
}

module.exports = router;