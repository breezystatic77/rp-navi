/* Classes *******************************************************************/
class chatroom {
	constructor(name, ownerName, ownerId) {
		this.name = name
		this.users = {}
		this.mods = []
		this.owners = []
		this.banned = []
		this.password = ''
		this.private = false
		this.permanent = false

		this.users[ownerName] = new UserData(ownerName, USER_OWNER)
		this.owners.push(ownerId)
	}

	addUser(userName, role) {
		if (!this.users[userName]) {
			this.users[userName] = new UserData(userName, role)
		}
	}

	removeUser(userName) {
		if (this.users[userName]) {
			delete this.users[userName]
		}
	}

	getUserRole(accountId) {
		let role = USER_STANDARD
		if (this.mods.indexOf(accountId) > -1) {
			role = USER_MOD
		} else if (this.owners.indexOf(accountId) > -1) {
			role = USER_OWNER
		}
		return role
	}

	addMod(accountId) {
		if (this.mods.indexOf(accountId) === -1) {
			this.mods.push(accountId)
		}
	}

	removeMod(accountId) {
		let modIdx = this.mods.indexOf(accountId)
		if (modIdx > -1) {
			this.mods.splice(modIdx, 1)
		}
	}

	addOwner(accountId) {
		if (this.owners.indexOf(accountId) === -1) {
			this.owners.push(accountId)
		}
	}

	removeOwner(accountId) {
		let ownerIdx = this.owners.indexOf(accountId)
		if (ownerIdx > -1) {
			this.owners.splice(ownerIdx, 1)
		}
	}

	banUser(accountId) {
		if (this.banned.indexOf(accountId) === -1) {
			this.banned.push(accountId)
		}
	}

	unbanUser(accountId) {
		let idx = this.banned.indexOf(accountId)
		if (idx > -1) {
			this.banned.splice(idx, 1)
		}
	}

	isBanned(accountId) {
		return this.banned.indexOf(accountId) === -1
	}
}

module.exports = {
	chatroom
}