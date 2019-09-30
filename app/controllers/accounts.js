/**
 * @file Controller for account related tasks
 */
const accountsDb    = require('../models/accounts')
const accountStates = require('../models/account-schema').accountStates
const ENVIRONMENT   = require('../utils/utils').getEnvironment()
const logger        = require('../utils/utils').logger
const SUCCESS       = require('../utils/reason-codes').genericCodes.SUCCESS
const FAILURE       = require('../utils/reason-codes').genericCodes.FAILURE

function sendError(error) {
    let status = {status: error}
    logger.error('Could not complete the request ', error)
    return status
}

function signup(req, res) {
    const username = req.body.username
    const password = req.body.password
    const email = req.body.email

    let createPromise = accountsDb.createAccount(username, password, email)
    return createPromise.then((response) => {
        let status = {status: response.status, data: response.account}
        req.session.account = response.account._id
        req.session.username = response.account.username
        if (ENVIRONMENT === 'debug') {
            status.verification_key = response.account.verifyKey
        }
        return status
    })
    .catch(sendError)
}

function login(req, res) {
    const username = req.body.username
    const password = req.body.password
    let loginPromise = accountsDb.verifyPassword(username, password)
    
    return loginPromise.then((response) => {
        if (response.status === SUCCESS) {
            let status = {status: SUCCESS}
            if (response.account.state < accountStates.ghosted) {
                status.status = FAILURE
            }
            else {
                req.session.account = response.account._id
                req.session.username = response.account.username
                status.data = response.account
            }
            return status
        }
        else {
            return {status: FAILURE}
        }

    })
    .catch(sendError)
}

function getAccountData(req, res) {
    let username = ''

    if (req.session.username) {
        username = req.session.username
    }

    let readPromise = accountsDb.getAccountData(username, [])
    return readPromise.then((response) => {
        return response
    })
    .catch(sendError)
}

function searchAccountData(req, res) {
    let username = ''

    if (req.body.username) {
        username = req.body.username
    }
    
    let readPromise = accountsDb.getAccountData(username, [])
    return readPromise.then((response) => {
        return response
    })
    .catch(sendError)
}

function verifyAccount(req, res) {
    if (req.query.username && req.query.verifyKey) {
        const username = req.query.username
        const verifyKey = req.query.verifyKey
        let verifyPromise = accountsDb.verifyAccount(username, verifyKey)
        return verifyPromise.then((response) => {
            return response
        })
        .catch(sendError)
    }
    else {
        return Promise.reject({status: FAILURE})
    }
}

function updateEmail(req, res) {
    const username = req.session.username
    const email = req.body.email
    let updatePromise = accountsDb.updateEmail(username, email)

    return updatePromise.then((response) => {
        return response
    })
    .catch(sendError)
}

function updatePassword(req, res) {
    const username = req.session.username
    const currentPass = req.body.oldPassword
    const newPass = req.body.newPassword
    let loginPromise = accountsDb.verifyPassword(username, currentPass)
    let updatePromise = accountsDb.updatePassword(newPass, usernamer=username)

    return loginPromise.then((response) => {
        if (response.status === SUCCESS) {
            return updatePromise
        }
        else {
            return {status: FAILURE}
        }
    })
    .then((response) => {
        return response
    })
    .catch(sendError)
}

function requestPwReset(req, res) {
    const username = req.body.username
    let requestPromise = accountsDb.requestPwReset(username)

    logger.info('A password reset has been requested for %s', username)
    return requestPromise.then((response) => {
        return response
    })
    .catch(sendError)
}

function verifyPasswordReset (req, res) {
    const resetKey = req.query.key
    let verifyPromise = accountsDb.verifyPasswordReset(resetKey)

    return verifyPromise.then((response) => {
        return response
    })
    .catch(sendError)
}

function resetPassword(req, res) {
    const newPass = req.body.newPassword

    let updatePromise = accountsDb.updatePassword(newPass, resetKey=req.query.key)
    return updatePromise.then((response) => {
        return response
    })
    .catch(sendError)
}

function disableAccount(req, res) {
    const username = req.session.username
    const password = req.body.currentPassword
    let loginPromise = accountsDb.verifyPassword(username, password)
    let disablePromise = accountsDb.deactivateAccount(username)

    return loginPromise.then((response) => {
        if (response.status === SUCCESS) {
            return disablePromise
        }
        else {
            return {status: FAILURE}
        }
    })
    .then((response) => {
        return response
    })
    .catch(sendError)
}

/* Admin Functions ***********************************************************/
function updateAccountState(req, res) {
    const username = req.body.username
    let newState = accountStates.inactive

    switch (req.body.newAcctState) {
        case 'Disable':
            newState = accountStates.inactive
            break
        case 'Suspend':
            newState = accountStates.suspended
            break
        case 'Ghost':
            newState = accountStates.ghosted
            break
        case 'Active':
            newState = accountStates.active
            break
    }
    let updatePromise = accountsDb.updateAccountState(username, newState)

    return updatePromise.then((response) => {
        logger.debug('%s: %s', updateAccountState.name, JSON.stringify(response, undefined, 4))
        return response
    })
    .catch(sendError)
}

/* Exports *******************************************************************/
exports.signup = signup
exports.login = login

exports.getAccountData = getAccountData
exports.searchAccountData = searchAccountData

exports.verifyAccount = verifyAccount
exports.updateEmail = updateEmail
exports.updatePassword = updatePassword
exports.requestPwReset = requestPwReset
exports.verifyPasswordReset = verifyPasswordReset
exports.resetPassword = resetPassword
exports.disableAccount = disableAccount

exports.updateAccountState = updateAccountState