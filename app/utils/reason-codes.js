/**
 * This file contains the reason codes for all 1-00-00-00 reason codes. These
 * codes come from the controller portion of the server.
 */

const genericCodes = {
	SUCCESS: 9000000,
	FAILURE: -9000000,
	GENERAL_ERR: -9000001
}

/* 1-01-00-00 Account data codes */
const accountCodes = {
	/* 00-99 General account codes */
	ACCOUNT_ERR: -1010000,
	ACCOUNT_NOT_FOUND: -1010001,
	ACCOUNT_EXISTS: -1010002,
	ACCOUNT_SUSPENDED: -1010003,
	ACCOUNT_GHOSTED: -1010004,

	/* 100-199 Account creation codes */
	CREATED_ACCOUNT: 1010100,
	DELETED_ACCOUNT: 1010101,
	SIGNUP_ERR: -1010100,
	PW_NOT_HASHED: -1010102,

	/* 200-299 Login codes */
	PW_MISMATCH: -1010200,

	/* 300-399 Verification codes */
	VERIFY_GOOD: 1010300,
	VERIFY_BAD_KEY: -1010301,

	/* 400-499 Account info update codes */
	UPDATE_ERR: -1010401,
	RESET_PW_EXPIRED: -1010404

	/* 9900-9999 Administrative codes */
}

exports.accountCodes = accountCodes
exports.genericCodes = genericCodes
