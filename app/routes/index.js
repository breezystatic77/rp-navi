/**
 * @file Routes for pages from the root URL
 */
const { check, validationResult } = require('express-validator')
const express       = require('express')
const accountCtrl   = require('../controllers/accounts')
const messages      = require('../messages/en/index').messages
const SUCCESS       = require('../utils/reason-codes').genericCodes.SUCCESS
const logger        = require('../utils/utils').logger
const router        = express.Router()

/* GET routers****************************************************************/
router.get('/', function (req, res, next) {
    if (req.session.account) {
        res.redirect('/user/')
    }
    else {
        res.render('index', {
            title: 'RP Navi'
        })
    }
})

/* POST routers***************************************************************/
router.post('/signup',
    [check('username').isLength({min: 5}).trim().escape(),
     check('email').isEmail().normalizeEmail(),
     check('password').isLength({min: 4})],
    (req, res) =>
{
    const errors = validationResult(req)
    if (!errors.isEmpty()){
        res.render('index', {title: 'RP-Navi', message: messages.SIGNUP_BAD_INPUT})
    }
    else {
        createAccount(req, res)
    }
})

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

router.post('/logout', (req, res) => {
    req.session = null
    res.redirect('/')
})

/* POST Handlers *************************************************************/
async function createAccount(req, res) {
    try {
        let result = await accountCtrl.signup(req, res)
        if (result.status === SUCCESS) {
            res.redirect('/')
        }
        else {
            res.render('index', {title: 'RP-Navi', message: messages.SIGNUP_FAILED})
        }
    }
    catch (error) {
        logger.error('There was an error with creating account ', error)
    }
}

async function loginAccount(req, res){
    let result = await accountCtrl.login(req, res)
    if (result.status === SUCCESS) {
        res.redirect('/')
    }
    else {
        message = messages.LOGIN_FAILED
        res.render('index', {title: 'RP Navi', message: message})
    }
}

module.exports = router