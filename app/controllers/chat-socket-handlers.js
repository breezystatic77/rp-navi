const promisify = require('util').promisify
const accountsDb = require('../models/accounts')
const logger = require('../utils/utils').logger
const SUCCESS = require('../utils/reason-codes').genericCodes.SUCCESS

const DEL_ACTION = 0
const ADD_ACTION = 1
const SYSTEM_ROOM_NAME = 'system'

/* User roles */
const USER_REMOVED = -99
const USER_STANDARD = 0
const USER_MOD = 1
const USER_OWNER = 2

let server = null

/*  Signals supported
 * -- To Client --
 * info                         Information from the server
 * rooms list                   List of rooms
 * names list                   List of names the account owns
 * chat message                 Chat message to clients
 * client joined room           Telling the client they joined a room
 * client left room             Telling the client they left a room
 * client kicked                Telling the client they were kicked
 * client banned                Telling the client they were banned
 * room add user                Another client joined the room
 * room remove user             Another client left the room
 * room kick user               Another client was kicked from the room
 * room created                 The client created a room
 * room list update             Update the room list
 * room info                    Information about a room
 * room add mod                 A mod was added to the room
 * room remove mod              A mod was removed from the room
 * room ban user                A user was banned
 * room unban user              A user was unbanned
 * room settings updated        A mod updated the room options
 *
 * -- From Client --
 * disconnect                   Client disconnected
 * chat message                 Client sent a message for a chat room
 * join room                    Client wants to join a room
 * leave room                   Client wants to leave a room
 * get room info                Client wants information from a room
 * set room settings            Client is changing a room's settings
 * mod action                   Client is performing a mod action
 */

/* Data Structures ***********************************************************/
function MessageData(msg, username, room) {
	this.msg = msg
	this.username = username
	this.roomName = room
	this.timestamp = new Date().getTime()
}

function StatusData(msg) {
	this.msg = msg
	this.timestamp = new Date().getTime()
}

function UserData(name, role) {
	this.name = name
	this.role = role
}

function UserUpdateData(roomName, username) {
	this.roomName = roomName
	this.username = username
}

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

var chatRooms = {}

var connectedUsers = {}

/* Connection setup handlers *************************************************/
function setConnectionHanlders(socket) {
	let username = socket.request.session.username
	let accountId = socket.request.session.account
	if (!username) {
		logger.info('Someone tried to access the chat without a login session')
		return
	}

	logger.info(`${username} [${accountId}] connected to the chat socket`)
	socket.join('System')
	socket.emit('rooms list', getRoomList())
	socket.emit('names list', { names: [username] })
	socket.emit('info', createInfoMsg('Welcome to RP Navi!'))
	socket.broadcast.emit('connected', { name: username })

	socket.on('disconnect', function() {
		handle_Disconnect(socket)
	})

	socket.on('chat message', function(data) {
		handle_ChatMessage(socket, data)
	})

	socket.on('join room', roomName => {
		handle_JoinRoom(socket, roomName)
	})

	socket.on('leave room', roomName => {
		handle_LeaveRoom(socket, roomName)
	})

	socket.on('get room info', roomName => {
		handle_getRoomInfo(socket, roomName)
	})

	socket.on('set room settings', (roomName, settings) => {
		handle_setRoomSettings(socket, roomName, settings)
	})

	socket.on('mod action', data => {
		handle_ModAction(socket, data).catch(error => {
			logger.error(error)
		})
	})

	/*server.of('/').clients((error, clients) => {
		console.log(server.sockets.connected[clients[0]].request.session)
	})*/
}

/* Utilities *****************************************************************/
function createRandomRooms() {
	let words = [
		'surprise',
		'nervous',
		'awful',
		'drab',
		'nasty',
		'moaning',
		'giraffe',
		'tawdry',
		'spade',
		'pine',
		'tense',
		'whisper',
		'balance',
		'need',
		'vulgar',
		'fierce',
		'elbow',
		'clear',
		'recondite',
		'warm',
		'shaggy',
		'drink',
		'point',
		'offend',
		'launch',
		'difficult',
		'sweltering',
		'confuse',
		'nerve',
		'puzzled',
		'example',
		'lettuce',
		'peace',
		'old',
		'pet',
		'start',
		'shave',
		'flaky',
		'volleyball',
		'quill',
		'pushy',
		'smell',
		'bucket',
		'blink',
		'panoramic',
		'foolish',
		'tickle',
		'question',
		'pause',
		'distance'
	]
	let roomName = ''

	for (let i = 0; i < 5; i++) {
		let numWords = Math.floor(Math.random() * Math.floor(4))
		roomName += words[Math.floor(Math.random() * Math.floor(words.length))]
		for (let word = 0; word < numWords; word++) {
			roomName += ' '
			roomName += words[Math.floor(Math.random() * Math.floor(words.length))]
		}
		chatRooms[roomName.toUpperCase()] = new chatroom(roomName, 'Admin', '-1')
		chatRooms[roomName.toUpperCase()].permanent = true
		roomName = ''
	}
}

function createInfoMsg(msg) {
	return new MessageData(msg, 'SYSTEM', SYSTEM_ROOM_NAME)
}

/* Socket IO handlers ********************************************************/
function handle_Disconnect(socket) {
	let username = socket.request.session.username
	logger.info(`${username} disconnected from the chat`)

	for (let roomName in chatRooms) {
		let room = chatRooms[roomName]
		let roomNameKey = roomName.toUpperCase()
		if (room.users[username]) {
			handle_LeaveRoom(socket, roomName)
		} else {
			socket.leave(roomNameKey)
		}
	}
}

function handle_ChatMessage(socket, data) {
	let username = socket.request.session.username
	let msgData = new MessageData(data.msg, username, data.room)
	socket.to(msgData.roomName.toUpperCase()).emit('chat message', msgData)
	logger.debug(
		'%s is sending %s',
		username,
		JSON.stringify(msgData, undefined, 4)
	)
}

function handle_JoinRoom(socket, roomName) {
	let username = socket.request.session.username
	let accountId = socket.request.session.account
	let roomNameKey = roomName.toUpperCase()

	if (!roomName) {
		socket.emit('info', createInfoMsg('A room name was not entered'))
		return
	}
	logger.info(`${username} is attempting to join ${roomName}`)

	if (chatRooms[roomNameKey]) {
		let room = chatRooms[roomNameKey]

		if (room.banned.indexOf(accountId) > -1) {
			logger.info(`${username} is banned from ${roomName}`)
			socket.emit('info', createInfoMsg(`You are banned from ${roomName}`))
		} else if (!chatRooms[roomNameKey].users[username]) {
			let role = room.getUserRole(accountId)
			room.addUser(username, role)
			socket.join(roomNameKey)
			socket.emit('client joined room', {
				name: room.name,
				isMod: role > USER_STANDARD
			})
			socket.to(roomNameKey).emit('room add user', {
				roomName: roomName,
				username: username,
				role: role
			})
			logger.info(`${username} has joined ${roomName} as role ${role}`)
		} else {
			socket.emit('info', createInfoMsg(`You are already in ${roomName}`))
		}
	} else {
		/* Room doesn't exist, creating the room */
		let room = (chatRooms[roomNameKey] = new chatroom(
			roomName,
			username,
			accountId
		))
		logger.info(`${username} is creating ${roomName}`)
		socket.join(roomNameKey)
		socket.emit('room created', { name: room.name, isMod: true })
		server.emit('room list update', { name: roomName, action: ADD_ACTION })
		logger.debug('New room createrd: %s', JSON.stringify(room, undefined, 4))
	}
}

function handle_LeaveRoom(socket, roomName) {
	let username = socket.request.session.username
	let roomNameKey = roomName.toUpperCase()
	let room = chatRooms[roomNameKey]

	if (!room) {
		socket.emit('info', createInfoMsg(`${roomName} does not exist`))
		return
	}

	logger.info(`${username} is leaving ${roomName}`)

	room.removeUser(username)
	socket.leave(roomNameKey)

	if (Object.keys(room.users).length === 0 && room.permanent === false) {
		logger.info(`Removing temporary room: ${roomName}`)
		delete chatRooms[roomNameKey]
		server.emit('room list update', { name: roomName, action: DEL_ACTION })
	}
	socket.emit('client left room', roomName)
	socket.broadcast.emit('room remove user', {
		roomName: roomName,
		username: username
	})
}

function handle_getRoomInfo(socket, roomName) {
	let accountId = socket.request.session.account
	let roomNameKey = roomName.toUpperCase()
	let room = chatRooms[roomNameKey]

	logger.info(
		`${socket.request.session.username} is requesting info for ${roomName}`
	)

	if (room && room.isBanned(accountId)) {
		let data = { name: roomName, users: room.users }
		let role = room.getUserRole(accountId)
		if (role > USER_STANDARD) {
			data.password = room.password
		}
		socket.emit('room info', data)
	}
}

function handle_setRoomSettings(socket, roomName, settings) {
	let modAcctId = socket.request.session.account
	let roomNameKey = roomName.toUpperCase()
	let room = chatRooms[roomNameKey]

	if (room && roomData.getUserRole(modAcctId) < USER_MOD) {
		if (settings.password !== undefined) {
			room.password = settings.password
		}
		if (settings.private !== undefined) {
			room.private = settings.private
		}
		socket.emit('room settings updated')
	}
}

function getRoomList() {
	let roomList = []
	for (let nameKey in chatRooms) {
		roomList.push(chatRooms[nameKey].name)
	}
	return roomList
}

/* Modding action handlers ***************************************************/

async function handle_ModAction(socket, data) {
	let roomNameKey = data.room.toUpperCase()
	let modName = socket.request.session.username
	let modAcctId = socket.request.session.account
	let roomData = chatRooms[roomNameKey]

	/* Guard conditions */
	if (!data.targetName) {
		logger.debug(`${modName} did not enter a target name`)
		return
	} else if (!roomData) {
		logger.debug(`${modName} chose a room that doesn't exist: ${data.room}`)
		return
	} else if (roomData.getUserRole(modAcctId) < USER_MOD) {
		logger.debug(`${modName} is not a mod of ${data.room}`)
		return
	}

	/* Fill in the target's data (account ID and name) */
	let accountData = await accountsDb.getAccountData(data.targetName, ['_id'])

	if (accountData.status !== SUCCESS) {
		logger.debug(`Could not find ${data.targetName} in the database`)
		return
	}

	let targetData = {}
	targetData.name = data.targetName
	targetData.id = accountData.data._id.toString()

	/* Check if the mod can perform the action against the target. */
	let canDoAction = false
	switch (data.action) {
		case 'kick':
			canDoAction =
				roomData.getUserRole(modAcctId) >= roomData.getUserRole(targetData.id)
			break
		case 'mod':
		case 'ban':
		case 'unmod':
		case 'unban':
			canDoAction =
				roomData.getUserRole(modAcctId) > roomData.getUserRole(targetData.id)
			break
		default:
			break
	}

	if (canDoAction === false) {
		logger.debug(`${modName} cannot do action on ${targetData.name}`)
		return
	}

	/* Perform the action on the target */
	let roomSignal = ''
	let clientSignal = ''
	if (data.action === 'kick') {
		roomSignal = 'room kick user'
		clientSignal = 'client kicked'
		logger.info(`${modName} is kicking ${targetData.name} from ${data.room}`)
	} else if (data.action === 'mod') {
		roomSignal = 'room add mod'
		roomData.addMod(targetData.id)
		logger.info(`${modName} is modding ${targetData.name} in ${data.room}`)
	} else if (data.action === 'unmod') {
		roomSignal = 'room remove mod'
		roomData.removeMod(targetData.id)
		logger.info(`${modName} is unmodding ${targetData.name} in ${data.room}`)
	} else if (data.action === 'ban') {
		roomSignal = 'room ban user'
		clientSignal = 'client banned'
		roomData.banUser(targetData.id)
		logger.info(`${modName} is banning ${targetData.name} in ${data.room}`)
	} else if (data.action === 'unban') {
		roomData.unbanUser(targetData.id)
		logger.info(`${modName} is unbanning ${targetData.name} in ${data.room}`)
	}

	if (clientSignal !== '') {
		removeUserFromRoom(targetData.id, roomData, clientSignal)
	}

	server
		.in(roomNameKey)
		.emit(roomSignal, new UserUpdateData(data.room, targetData.name))
}

function removeUserFromRoom(targetAcctId, roomData, signal) {
	let roomNameKey = roomData.name.toUpperCase()
	server
		.of('/')
		.in(roomNameKey)
		.clients((error, clients) => {
			if (error) {
				logger.error(
					'There was an error getting clients from %s: %s',
					roomData.name,
					error
				)
				return
			}
			clients.forEach(clientId => {
				let targetData = server.sockets.connected[clientId].request.session
				if (targetData.account != targetAcctId) {
					return
				}
				logger.info(`${targetData.username} is being removed from ${roomData}`)
				roomData.removeUser(targetData.username)
				server.to(clientId).emit(signal)
			})
		})
}

exports.setConnectionHanlders = setConnectionHanlders
exports.createRandomRooms = createRandomRooms

exports.setIoServer = function(io) {
	server = io
}
