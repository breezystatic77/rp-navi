/* @file
	Provides utilities for cryptography functions like hashing or one-time key 
	generation.
*/

/**
 * Generates a random SHA256 hash using base 64 string (0-9, A-Z, a-z) as the
 * output. These are used for generate keys for verifying a request or to
 * generate requests for others.
 *
 * @returns {string} A base 64 string of the hash that was generated.
 */
function generateKey() {
	const crypto = require('crypto')
	var rand = crypto.randomBytes(32)
	var hash = crypto.createHash('sha256')
	hash.update(new Date().toString() + rand.toString())

	return hash.digest().toString('base64')
}

/**
 * Generates a hash for password storage.
 * @param {*} password
 * @param {*} salt
 * @returns A promise of some hashing function to be handled by the caller.
 */
function getPasswordHash(password, salt) {
	const crypto = require('crypto')
	const argon2 = require('argon2')

	var hash = crypto.createHash('sha512')
	hash.update(password)
	return argon2.hash(hash.digest().toString('base64'), salt)
}

/**
 * Verifies a plaintext password against the database one
 * @param {*} passwordHash - Password hash from the data base
 * @param {*} password     - Password in plaintext
 * @returns A promise of some hashing function to be handled by the caller.
 */
function verifyPassword(passwordHash, password) {
	const crypto = require('crypto')
	const argon2 = require('argon2')

	var hash = crypto.createHash('sha512')
	hash.update(password)
	return argon2.verify(passwordHash, hash.digest().toString('base64'))
}

/*****************************************************************************
 * Exports
 */
exports.generateKey = generateKey
exports.getPasswordHash = getPasswordHash
exports.verifyPassword = verifyPassword
