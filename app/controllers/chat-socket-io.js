const accountsDb    = require('../models/accounts')
const logger        = require('../utils/utils').logger
const environment   = require('../utils/utils').getEnvironment()
const chatHandlers  = require('./chat-socket-handlers').setConnectionHanlders
const setChatServer = require('./chat-socket-handlers').setIoServer
var server

function setServer(io){
	server = io

	setChatServer(io)
	io.on('connection', chatHandlers)
	io.of('/pm', setPmHandlers)

	if (environment === 'debug') {
		const randomRooms = require('./chat-socket-handlers').createRandomRooms
		randomRooms()
	}
}

function setPmHandlers(socket) {
	let username = socket.request.session.username
	if (!username) {
		logger.info('Someone tried to access the PM system without a login session')
		return
	}
	logger.info(`${username} connected to the PM Socket`);
	
	socket.join(username)
	socket.on('pm message', (data) => {
		logger.info('%s', JSON.stringify(data, undefined, 4))
		socket.to(data.to).emit('pm message', {from: username, msg: data.msg})
	})
}

exports.setServer = setServer