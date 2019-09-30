/**
 * @file Routes for pages from the /user URL
 */
const { check, validationResult } = require('express-validator')
const express       = require('express')
const accountCtrl   = require('../controllers/accounts')
const accountStates = require('../models/account-schema').accountStates
const messages      = require('../messages/en/users').messages
const SUCCESS       = require('../utils/reason-codes').genericCodes.SUCCESS
const logger        = require('../utils/utils').logger
const router        = express.Router()

/* GET routers ***************************************************************/
router.get('/', (req, res) => {
    if (req.session.account) {
        getAccountPage(req, res)
    }
    else {
        res.redirect('/')
    }
})

router.get('/verifyAccount', verifyAccount)

router.get('/forgotPassword', (req, res) => {
    res.render('./users/forgot-password', {message: ""})
})

router.get('/resetPassword', getResetPassword)

/* POST routers **************************************************************/
router.post('/changeEmail', 
    [check('email').isEmail().normalizeEmail()],
    (req, res) => 
{
    const errors = validationResult(req)
    if (!errors.isEmpty()){
        req.session.message = messages.EMAIL_BAD_INPUT
        res.redirect('/')
    }
    else {
        changeEmail(req, res)
    }
})

router.post('/changePassword',
    [check('newPassword').isLength({min: 4})],
    (req, res) => 
{
    const errors = validationResult(req)
    if (!errors.isEmpty()){
        req.session.message = messages.PW_BAD_INPUT
        res.redirect('/')
    }
    else {
    changePassword(req, res)
    }
})

router.post('/forgotPassword', requestPwReset)

router.post('/resetPassword', 
    [check('newPassword').isLength({min: 4})],
    (req, res) => 
{
    const errors = validationResult(req)
    if (!errors.isEmpty()){
        res.render('./users/reset-password', {message: messages.PW_BAD_INPUT})
    }
    else {
        resetPassword(req, res)
    }
})

router.post('/disableAccount', disableAccount)
/* GET Handlers  *************************************************************/
async function getAccountPage(req, res) {
    try {
        let response = await accountCtrl.getAccountData(req, res)
        let accountData = {}
        accountData.username = response.data.username
        accountData.email = response.data.email
        accountData.verifyMessage = messages.ACCT_UNVERIFIED
        accountData.statusMessage = req.session.message
    
        if (response.data.state > accountStates.unverified) {
            accountData.verifyMessage = messages.ACCT_VERIFIED
        }
        res.render('./users/index', accountData)
    }
    catch (error) {
        logger.error('There was an error with %s: ', getAccountPage.name, error)
        req.session = null
        res.redirect('/')
    }
}

async function verifyAccount(req, res) {
    let message = messages.VERIFY_FAILED
    try {
        let response = await accountCtrl.verifyAccount(req, res)
        if (response.status === SUCCESS) {
            message = messages.VERIFY_SUCCESS
        }
    }
    catch {
        logger.info('Someone tried to verify: %s', req.query)
    }
    finally {
        res.render('./users/verify-user', {message: message})
    }
}

async function getResetPassword(req, res) {
    let response = await accountCtrl.verifyPasswordReset(req, res)
    let message = messages.PW_REQUEST_EXP
    let hideShow = 'none'
    if (response.status === SUCCESS) {
        message = ''
        hideShow = 'block'
    }
    
    res.render('./users/reset-password', 
        {   hideShow: hideShow, 
            resetKey: req.query.key,
            username: response.username, 
            message: message
    })
}

/* POST Handlers *************************************************************/
async function changeEmail(req, res) {
    try {
        let response = await accountCtrl.updateEmail(req, res)
        if (response.status === SUCCESS) {
            req.session.message = messages.EMAIL_CHANGED
        }
        else {
            req.session.message = messages.EMAIL_NOT_CHANGED
        }
        res.redirect('/')
    }
    catch (error) {
        req.session.message = messages.EMAIL_NOT_CHANGED
        res.redirect('/')
    }
}

async function changePassword(req, res) {
    let response = await accountCtrl.updatePassword(req, res)
    if (response.status === SUCCESS) {
        req.session.message = messages.PW_UPDATED
    }
    else {
        req.session.message = messages.PW_NOT_UPDATED
    }
    res.redirect('/')
}

async function requestPwReset(req, res) {
    await accountCtrl.requestPwReset(req, res)
    logger.info('Getting password reset request.')
    res.render('./users/forgot-password', {message: messages.PW_REQUESTED})
}

async function resetPassword(req, res) {
    let response = await accountCtrl.resetPassword(req, res)
    let message = messages.PW_NOT_UPDATED
    let hideShow = 'none'

    if (response.status === SUCCESS) {
        message = messages.PW_UPDATED
        hideShow = 'none'
    }
    res.render('./users/reset-password', {message: message, hideShow: hideShow})
}

async function disableAccount(req, res) {
    try {
        let response = await accountCtrl.disableAccount(req, res)
        
        if (response.status === SUCCESS) {
            req.session.message = messages.ACCT_DISABLED
            req.session = null
            res.redirect('/')
        }
        else {
            req.session.message = messages.ACCT_DISABLED_FAIL
            res.redirect('/')
        }
    }
    catch (error) {
        logger.info(error)
    }
}

module.exports = router
