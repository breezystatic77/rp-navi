const accountsDb = require('../models/accounts')
const logger = require('../utils/utils').logger
const SUCCESS = require('../utils/reason-codes').genericCodes.SUCCESS
const chatroom = require('../models/chatroom').chatroom

const DEL_ACTION = 0
const ADD_ACTION = 1

/* User roles */
const USER_REMOVED = -99
const USER_STANDARD = 0
const USER_MOD = 1
const USER_OWNER = 2

let server = null

/* Data Structures ***********************************************************/
function MessageData(msg, username, roomName) {
	this.msg = msg
	this.username = username
	this.roomName = roomName
	this.timestamp = new Date().getTime()
}

function StatusData(msg) {
	this.msg = msg
	this.timestamp = new Date().getTime()
}

function UserUpdateData(roomName, username) {
	this.roomName = roomName
	this.username = username
}

var chatRooms = {}

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
	return new StatusData(msg)
}

/**
 * Gets a list of rooms
 * @returns An array containing rooms
 */
function getRoomList() {
	let roomList = []
	for (let nameKey in chatRooms) {
		roomList.push(chatRooms[nameKey].name)
	}
	return roomList
}

function setIoServer(io) {
	server = io
}

/* Socket IO handlers ********************************************************/
/**
 * Handles when a client disconnects from the server
 * @param {*} socket 
 */
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

/**
 * Handles when a client sends a chat message
 * @param {*} socket 
 * @param {*} data 
 */
function handle_ChatMessage(socket, data) {
	let username = socket.request.session.username
	let msgData = new MessageData(data.msg, username, data.room)
	socket.to(msgData.roomName.toUpperCase()).emit('chat message', msgData)
	logger.debug(`${username} is sending ${JSON.stringify(msgData, undefined, 4)}`,
	)
}

/**
 * Handles when a client wants to join a room. This can create rooms if the
 * room doesn't exist.
 * @param {*} socket 
 * @param {*} data 
 */
function handle_JoinRoom(socket, data) {
	let username = socket.request.session.username
	let accountId = socket.request.session.account
	let roomNameKey = data.roomName.toUpperCase()
	let roomName = data.roomName

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
		socket.emit('room created', { roomName: room.name, isMod: true })
		server.emit('room list update', { roomName: roomName, action: ADD_ACTION })
		logger.debug('New room createrd: %s', JSON.stringify(room, undefined, 4))
	}
}

/**
 * Handles when a client wants to leave a room
 * @param {*} socket 
 * @param {*} data 
 */
function handle_LeaveRoom(socket, data) {
	let username = socket.request.session.username
	let roomNameKey = data.roomName.toUpperCase()
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

/**
 * Handles when a client wants to get information on a room
 * @param {*} socket 
 * @param {*} roomName 
 */
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

/**
 * Handles when a client wants to change a room's settings.
 * @param {*} socket 
 * @param {*} roomName 
 * @param {*} settings 
 */
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

/* Modding action handlers ***************************************************/
/**
 * Handles performing a modding action. Function is async because it needs to
 * access the DB.
 * @param {*} socket 
 * @param {*} data 
 */
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

/**
 * Removes a user from a room (kick/ban)
 * @param {*} targetAcctId - Targets account ID
 * @param {*} roomData - Object containing information about the room
 * @param {*} signal - What SocketIO signal to use
 */
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

/* Module exports ************************************************************/
module.exports = {
	setConnectionHanlders,
	createRandomRooms,
	setIoServer
}
