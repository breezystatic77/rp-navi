/**
 * @file Routes for the admin web app
 */
const { check, validationResult } = require('express-validator')
const express       = require('express')
const accountCtrl   = require('../controllers/accounts')
const accountStates = require('../models/account-schema').accountStates
const messages      = require('../messages/en/index').messages
const SUCCESS       = require('../utils/reason-codes').genericCodes.SUCCESS
const logger        = require('../utils/utils').logger
const router        = express.Router()

/* GET home page. */
router.get('/', function (req, res, next) {
	res.render('./admin/login', { 
		title: 'RP Navi Admin Page'
	})
})

router.get('/admin-page', function (req, res, next) {
	res.render('./admin/acct-page', {hideShow: 'none'})
})

/* POST routers **************************************************************/
router.post('/login',
	[check('username').isLength({min: 5}).trim().escape(),
	 check('password').isLength({min: 4})],
	 (req, res) => 
{
	const errors = validationResult(req)
	if (!errors.isEmpty()){
		res.render('index', {title: 'RP-Navi', message: messages.LOGIN_BAD_INPUT})
	}
	else {
		loginAccount(req, res)
	}
})

router.post('/findUser', findAccount)

router.post('/forgotPassword', requestPwReset)

router.post('/setAcctState', setAcctState)

/* POST Handlers *************************************************************/
async function loginAccount(req, res){
	try {
		let response = await accountCtrl.login(req, res)
		logger.debug('%s', JSON.stringify(response, undefined, 4))

		if (response.status === SUCCESS && 
			response.data.state === accountStates.admin) {
			res.redirect('/admin-page')
		}
		else {
			res.redirect('/')
		}
	}
	catch (error) {
		logger.error('There was an error with %s: %s', verifyAcctIsAdmin.name, error)
		res.redirect('/')
	}
}

async function findAccount(req, res) {
	try {
		let response = await accountCtrl.searchAccountData(req, res)
		logger.debug('%s', JSON.stringify(response, undefined, 4))

		if (response.status === SUCCESS) {
			req.session.accountUpdating = response.data.username
			res.render('./admin/acct-page', {
				username: response.data.username,
				email: response.data.email,
				acctState: response.data.state,
				hideShow: 'block'
			})
		}
		else {
			res.render('./admin/acct-page', {hideShow: 'none'})
		}
	}
	catch (error) {
		logger.error('There was an error with %s: %s', verifyAcctIsAdmin.name, error)
		res.render('./admin/acct-page', {hideShow: 'none'})
	}
}

async function requestPwReset(req, res) {
	req.body.username = req.session.accountUpdating
	await accountCtrl.requestPwReset(req, res)
	res.render('./users/forgot-password', {message: messages.PW_REQUESTED})
}

async function setAcctState (req, res) {
	logger.debug('%s', JSON.stringify(req.body, undefined, 4))
	try {
		req.body.username = req.session.accountUpdating
		let response = await accountCtrl.updateAccountState(req, res)
		logger.debug('%s', JSON.stringify(response, undefined, 4))
		res.render('./admin/acct-page', {hideShow: 'none'})
	}
	catch (error) {
		logger.debug('%s', error)
		res.render('./admin/acct-page', {hideShow: 'none'})
	}
}

module.exports = router