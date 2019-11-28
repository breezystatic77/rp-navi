const mongoose = require('mongoose')
const accountStates = {
	inactive: -99 /* Account is no longer active */,
	suspended: -2 /* Account is suspended from use */,
	ghosted: -1 /* Account can log in, but cannot interact */,
	newPwNeeded: 0 /* Account needs a new password before doing anything else */,
	unverified: 1 /* Account is unverified */,
	active: 2 /* Account has normal user rights */,
	admin: 99 /* Account is an admin */
}

var accountSchema = new mongoose.Schema({
	/* User settable attributes */
	usernameLower: {
		type: String,
		trim: true,
		unique: true
	},
	username: String,
	email: String,
	password: String,

	/* Attributes set by the system */
	state: {
		type: Number,
		default: accountStates.unverified
	},

	resetPwKey: String,
	resetPwExpire: Date,
	verifyKey: String,

	/* Contains ObjectIDs referring to other accounts */
	blocked: [],
	roles: []
})

mongoose.model('Account', accountSchema)

exports.accountStates = accountStates
