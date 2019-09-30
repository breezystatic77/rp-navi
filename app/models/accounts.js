"use strict"
/**
 * @file Accounts data hanlder file.
 */
/******************************************************************************
 * Library imports.
 *****************************************************************************/
const mongoose = require('mongoose')
const accountModel  = mongoose.model('Account')
const mailer = require('../utils/mailer')

/******************************************************************************
 * Local imports
 *****************************************************************************/
/* Importing code mappings */
const accountCodes  = require('../utils/reason-codes').accountCodes
const SUCCESS       = require('../utils/reason-codes').genericCodes.SUCCESS
const FAILURE       = require('../utils/reason-codes').genericCodes.FAILURE
const accountStates = require('./account-schema').accountStates

/* Importing utils */
const logger        = require('../utils/utils').logger
const ENVIRONMENT   = require('../utils/utils').getEnvironment()

/* Other constants */
const PW_RESET_TTL = 1000 * 60 * 5

/******************************************************************************
 * Methods
 *****************************************************************************/
/**
 * Creates an account to add to the database
 * @param {*} username
 * @param {*} password
 * @param {*} email
 */

function createAccount (username, password, email) {
    const cryptoUtil = require('../utils/crypto')
    let usernameLower = username.toLowerCase()
    let salt = cryptoUtil.generateKey()
    let verifyKey = cryptoUtil.generateKey()
    let accountQuery = accountModel.findOne({usernameLower: usernameLower}).exec()
    let pwHash = cryptoUtil.getPasswordHash(password, salt)

    logger.info('Creating an account for %s', username)
    return Promise.all([accountQuery, pwHash])
    .then((values) => {
        let accountDoc = values[0]
        let hash = values[1]

        if (accountDoc) {
            return Promise.reject({status: accountCodes.ACCOUNT_EXISTS})
        } else {
            let newAccount = new accountModel({
                usernameLower: usernameLower,
                username: username,
                email: email,
                password: hash,
                resetPwKey: null,
                state: accountStates.unverified
            })
            newAccount.verifyKey = verifyKey
            return newAccount.save()
        }
    })
    .then((accountDoc) => {
        logger.debug('Account created: %o', accountDoc)
        mailer.sendVerifyMail(username, email, verifyKey)
        return accountDoc
    })
    .then((accountDoc) => {
        return {status: SUCCESS, account: accountDoc}
        
    })
    .catch((err) => {
        logger.error('There was an error in %s: %o', createAccount.name, err)
        return Promise.reject({status: FAILURE})
    })
}

/**
 * Gets account data from a search query array.
 * @param {*} username
 * @param {*} searchQuery - Search query parameters to limit what to grab from the document
 */
function getAccountData(username, searchQuery=['-username', 'username', 'createdAt']) {
    //'username email blocked verification.verified'
    let usernameLower = username.toLowerCase()
    let searchString = searchQuery.join(' ')
    let accountQuery = accountModel.findOne( {usernameLower: usernameLower}, searchString).exec()
    
    logger.info('Searching for %s with parameters %s', username, searchString)
    return accountQuery.then((document) => {
        if (document) 
        {
            return {status: SUCCESS, data: document}
        } else {
            return Promise.reject({status: accountCodes.ACCOUNT_NOT_FOUND})
        }
    })
    .catch((err) => {
        logger.error('There was an error in %s: %o', getAccountData.name, err)
        return Promise.reject({status: FAILURE})
    })
}


/**
 * Verifies a password given a username and password. This returns the document
 * upon success, since the common action after is to use the document.
 * @param {*} username
 * @param {*} password
 */
function verifyPassword (username, password) {
    const FUNC_NAME = verifyPassword.name
    const cryptoUtil = require('../utils/crypto') 
    let usernameLower = username.toLowerCase()
    let accountDoc = {}
    let accountQuery = accountModel.findOne({usernameLower: usernameLower}).exec()

    logger.info("%s: Verifying password for %s", FUNC_NAME, username)
    return accountQuery.then((document) => {
        if (document) {
            accountDoc = document
            logger.debug('%s: Account doc: %s', 
                FUNC_NAME, JSON.stringify(document, undefined, 4))
            logger.debug('%s: Password used %s', FUNC_NAME, password)
            return cryptoUtil.verifyPassword(accountDoc.password, password)
        } 
        else {
            logger.info("%s: Could not find account", FUNC_NAME)
            return Promise.reject({status: accountCodes.ACCOUNT_NOT_FOUND})
        }
    })
    .then((hashMatches) => {
        logger.debug('Password hash result: %s', hashMatches)
        if (hashMatches) {
            return {status: SUCCESS, account: accountDoc}
        } else {
            return {status: accountCodes.PW_MISMATCH}
        }
    })
    .catch((err) => {
        logger.error('There was an error in %s: %o', verifyPassword.name, err)
        return Promise.reject({status: FAILURE})
    })
}

/**
 * Verifies an account based on the username and a verify key. This does not
 * return the document.
 * @param {*} username 
 * @param {*} verifyKey 
 */
function verifyAccount(username, verifyKey) {
    let usernameLower = username.toLowerCase()
    let dbQuery = accountModel.findOne({usernameLower: usernameLower}).exec()

    logger.info('%s: %s is attempting to verify', verifyAccount.name, username)
    return dbQuery.then((document) => {
        logger.debug('%s: Comparing submitted key %s to stored key %s', 
            verifyAccount.name, verifyKey, document.verifyKey)
        if (document && document.verifyKey == verifyKey) {
            document.verifyKey = ""
            document.state = accountStates.active
            logger.info('%s has been verified', username)
            return document.save()
        }
        else {
            return Promise.reject({status: accountCodes.ACCOUNT_NOT_FOUND})
        }
    })
    .then(() => {
        return {status: SUCCESS}
    })
    .catch((err) => {
        logger.error('There was an error in %s: %o', verifyAccount.name, err)
        return Promise.reject({status: FAILURE})
    })
}

/**
 * Verifies that a reset key exists somewhere in the accounts. Returns the
 * username of the account if a match was found.
 * @param {*} resetKey 
 */
function verifyPasswordReset(resetKey) {
    let checkIfExpired = require('../utils/utils').checkIfExpired
    let accountQuery = accountModel.findOne({resetPwKey: resetKey}).exec()

    logger.info('%s: Someone is checking if key %s exists', verifyPasswordReset.name, resetKey)
    return accountQuery.then((accountDoc) => {
        if (accountDoc &&
            checkIfExpired(accountDoc.resetPwExpire.getTime())) 
        {
            logger.info('Key %s has turned up with user %s', resetKey, accountDoc.username)
            return {status: SUCCESS, username: accountDoc.username}
        }
        else {
            return {status: FAILURE}
        }
    })
    .catch((err) => {
        logger.error('There was an error in %s: %o', verifyPasswordReset.name, err)
        return Promise.reject({status: FAILURE})
    })
}


/**
 * Updates an account's email
 * @param {*} username 
 * @param {*} newEmail 
 */
function updateEmail (username, newEmail) {
    const FUNC_NAME = updateEmail.name
    let usernameLower = username.toLowerCase()
    let dbQuery = accountModel.findOne({usernameLower: usernameLower})

    logger.info('%s: %s is attempting to change email', FUNC_NAME, username)
    dbQuery.exec()
    return dbQuery.then((document) => {
        if (document) {
            document.email = newEmail
            document.save()
        } 
        else {
            return Promise.reject({status: accountCodes.ACCOUNT_NOT_FOUND})
        }
    })
    .then((accountDoc) => {
        return ({status: SUCCESS, account: accountDoc})
    })
    .catch((err) => {
        logger.error('There was an error in %s: %o', FUNC_NAME, err)
        return Promise.reject({status: FAILURE})
    })
}

/**
 * Upates an account's password
 * @param {*} newPassword 
 * @param {*} username 
 * @param {*} resetKey 
 */
function updatePassword(newPassword, username="", resetKey="") {
    const FUNC_NAME = updatePassword.name
    const cryptoUtil = require('../utils/crypto')
    let salt = cryptoUtil.generateKey()
    let pwHash = cryptoUtil.getPasswordHash(newPassword, salt)
    let queryObj = {}

    if (username) {
        queryObj.username = username
    }
    else if (resetKey) {
        queryObj.resetPwKey = resetKey
    }
    
    let accountQuery = accountModel.findOne(queryObj)

    return Promise.all([accountQuery, pwHash])
    .then((values) => {
        let accountDoc = values[0]
        let hash = values[1]

        if (accountDoc) {
            accountDoc.password = hash
            accountDoc.resetPwExpire = null
            accountDoc.resetPwKey = null
            return accountDoc.save()
            
        } else {
            return Promise.reject({status: accountCodes.ACCOUNT_NOT_FOUND})
        }
    })
    .then(function () {
        return ({status: SUCCESS})
    })
    .catch((err) => {
        logger.error('There was an error in %s: %o', FUNC_NAME, err)
        return Promise.reject({status: FAILURE})
    })
}

/**
 * Sets up a password reset key and TTL timer for an account
 * @param {*} username
 */
function requestPwReset(username) {
    const cryptoUtil = require('../utils/crypto')
    let usernameLower = username.toLowerCase()
    let resetKey = cryptoUtil.generateKey()
    let accountQuery = accountModel.findOne({usernameLower: usernameLower}).exec()

    logger.info('%s requested a password reset', username)

    return accountQuery.then((accountDoc) => {
        if (!accountDoc) {
            return Promise.reject({status: accountCodes.ACCOUNT_NOT_FOUND})
        }
        else {
            let expireTime = new Date()
            expireTime.setTime(expireTime.getTime() + PW_RESET_TTL)
            accountDoc.resetPwKey = resetKey
            accountDoc.resetPwExpire = expireTime
            return accountDoc.save()
        }
    })
    .then((accountDoc) => {
        let status = {status: SUCCESS}
        logger.debug('Reset key for %s: %s', username, resetKey)
        if (ENVIRONMENT === 'debug') {
            status.resetKey = resetKey
        }
        mailer.sendPwResetEmail(username, accountDoc.email, resetKey)
        return (status)
    })
    .catch((err) => {
        logger.error('There was an error in %s: %o', requestPwReset.name, err)
        return Promise.reject({status: FAILURE})
    })
}

/**
 * Marks an account as disabled
 * @param {*} username 
 */
function deactivateAccount (username) {
    let usernameLower = username.toLowerCase()
    let dbQuery = accountModel.findOne({usernameLower: usernameLower}).exec()
    logger.info('%s is deactivating their account', username)
    return dbQuery.then((document) => {
        if (document) {
            document.state = accountStates.inactive
            return document.save()
        } 
        else {
            return Promise.reject({status: accountCodes.ACCOUNT_NOT_FOUND})
        }
    })
    .then(() => {
        return ({status: SUCCESS})
    })
    .catch((err) => {
        logger.error('There was an error in %s: %o', deactivateAccount.name, err)
        return Promise.reject({status: FAILURE})
    })
}

/* Admin only functions ******************************************************/
/**
 * 
 * @param {*} username 
 * @param {*} newState 
 */
function updateAccountState (username, newState) {
    let usernameLower = username.toLowerCase()
    let dbQuery = accountModel.findOne({usernameLower: usernameLower}).exec()
    logger.info('%s is deactivating their account', username)
    return dbQuery.then((document) => {
        if (document) {
            document.state = newState
            return document.save()
        } 
        else {
            return Promise.reject({status: accountCodes.ACCOUNT_NOT_FOUND})
        }
    })
    .then(() => {
        return ({status: SUCCESS})
    })
    .catch((err) => {
        logger.error('There was an error in %s: %o', deactivateAccount.name, err)
        return Promise.reject({status: FAILURE})
    })
}

/*************************************************************************** 
 * Exports
*/

/* Creation Methods */
exports.createAccount = createAccount

/* Read Methods */
exports.getAccountData = getAccountData
exports.verifyAccount = verifyAccount
exports.verifyPassword = verifyPassword
exports.verifyPasswordReset = verifyPasswordReset

/* Update Methods */
exports.updateEmail = updateEmail
exports.updatePassword = updatePassword
exports.requestPwReset = requestPwReset

/* Delete methods */
exports.deactivateAccount = deactivateAccount

exports.updateAccountState = updateAccountState