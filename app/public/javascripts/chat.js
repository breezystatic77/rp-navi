'use strict'

const USER_STANDARD = 0
const USER_MOD      = 1
const USER_OWNER    = 2

const DEL_ACTION    = 0
const ADD_ACTION    = 1

$(function () {
	const SYSTEM_ROOM_NAME = 'system'
	const ROOM_LIST_MENU_CLASS = '.dropdown-menu.room-list'
	const ROOM_LIST_ITEM_CLASS = '.dropdown-item.room-list'
	const JOINED_ROOM_MENU_CLASS = '.dropdown-menu.joinedRooms'
	const JOINED_ROOM_ITEM_CLASS = '.dropdown-item.joinedRooms'

	var chatSocket = io();
	var pmSocket = io('/pm');
	
	let inputBuff = {}

	let username = ''
	let joinedRooms = {}
	let currentRoom = SYSTEM_ROOM_NAME
	let systemRoom = new Room(SYSTEM_ROOM_NAME)
	joinedRooms[SYSTEM_ROOM_NAME] = systemRoom

	/* Data prototypes ********************************************************/
	function Room (name, isMod=false) {
		this.name = name
		this.isMod = isMod
		this.users = []
		this.buffer = []
	}

	/* Utility Functions ******************************************************/
	function formatTimeStamp(timestamp=new Date()) {
		const hours = '0' + timestamp.getHours()
		const minutes = '0' + timestamp.getMinutes()
		const seconds = '0' + timestamp.getSeconds()
	
		return hours.slice(-2) + ':' + minutes.slice(-2) + ':' + seconds.slice(-2)
	}

	function makeCssRoomName(roomName) {
		let cssRoomName = roomName.replace(new RegExp(/[\W]/, 'g'), '-')
		cssRoomName = cssRoomName.replace(new RegExp(/[-+?]/, 'g'), '-')
		return cssRoomName
	}

	function postMsg(msgData) {
		let timestamp = formatTimeStamp(new Date(msgData.timestamp))
		let text = `[${timestamp}] ${msgData.username}: ${msgData.msg}`
		joinedRooms[msgData.roomName].buffer.push(text)
		
		if (currentRoom === msgData.roomName) {
			$('#messages').append($('<li>').text(text));
		}
	}

	function postLocalSysMsg(text) {
		joinedRooms[SYSTEM_ROOM_NAME].buffer.push(text)
		
		if (currentRoom === SYSTEM_ROOM_NAME) {
			$('#messages').append($('<li>').text(text));
		}
	}

	function showHideRoomOptions(roomName) {
		if (joinedRooms[roomName].isMod) {
			$('#room-options-card').show()
		}
		else {
			$('#room-options-card').hide()
		}
	}
	/* Room List functions ***************************************************/
	function setupRoomList(roomName) {
		let cssRoomName = makeCssRoomName(roomName)
		let roomListClasses = `dropdown-item room-list ${cssRoomName}-room`
		
		$(ROOM_LIST_MENU_CLASS).append(`<a class="${roomListClasses}" href="#">${roomName}</a>`)
		$(`${ROOM_LIST_ITEM_CLASS}.${cssRoomName}-room`).click(() => {
			chatSocket.emit('join room', roomName)
		})  
	}
	
	function setupRoomListItem(roomName) {
		if (!joinedRooms[roomName]) {
			setupJoinedRoomItem(roomName)
		}
		else {
			swapBuffer(roomName)
		}
		currentRoom = roomName
		$('#joinedRooms').text(roomName)
	}

	function setupJoinedRoomItem(roomName) {
		let cssRoomName = makeCssRoomName(roomName)
		let joinedRoomsClasses = `dropdown-item joinedRooms ${cssRoomName}-room`

		joinedRooms[roomName] = new Room(roomName)
		swapBuffer(roomName)
		$(JOINED_ROOM_MENU_CLASS).append(`<a class="${joinedRoomsClasses}" href="#">${roomName}</a>`)
		$(`${JOINED_ROOM_ITEM_CLASS}.${cssRoomName}-room`).click(() => {
			chatSocket.emit('get room info', roomName)
			currentRoom = roomName
			showHideRoomOptions(currentRoom)
			swapBuffer(roomName)
			$('#joinedRooms').text(roomName)
		})
	}

	/* Room Management Functions *********************************************/
	function swapBuffer(roomName) {
		$('#messages').empty()
		for(let idx in joinedRooms[roomName].buffer) {
			let line = joinedRooms[roomName].buffer[idx]
			$('#messages').append($('<li>').text(line))
		}
	}

	function addUser(username, role) {
		let cssText = ['font-style', 'normal']

		if (role === USER_MOD) {
			cssText = ['font-style', 'italic']
		}
		else if (role === USER_OWNER) {
			cssText = ['font-weight', 'bold']
		}

		$('ul.room-users').append($('<li>').text(username).css(cssText[0], cssText[1]))
	}

	function removeUserInRoom(roomName, username) {
		if (joinedRooms[roomName] && joinedRooms[roomName].users[username]) {
			delete joinedRooms[roomName].users[username]
		}

		if (currentRoom === roomName) {
			$('ul.room-users li').each((index) => {
				if ($('ul.room-users li')[index].innerHTML === username) {
					$('ul.room-users li')[index].remove()
					return false
				}
			})
		}
	}

	/* Chat socket handlers **************************************************/

	/** System Events */
	chatSocket.on('connected', function (data) {
		postLocalSysMsg(`[${formatTimeStamp()}] ${data.name} connected`)
	});

	chatSocket.on('disconnected', function (data) {
		postLocalSysMsg(`[${formatTimeStamp()}] ${data.name} disconnected`)
	});

	chatSocket.on('info', (infoData) => {
		console.log(infoData)
		postLocalSysMsg(`[${formatTimeStamp()}] ${infoData.msg}`)
	})

	/** Client specific events */
	chatSocket.on('names list', (data) => {
		username = data.names[0]
		postLocalSysMsg(`[${formatTimeStamp()}] Signed on as ${username}`)
	})

	chatSocket.on('rooms list', (roomList) => {
		joinedRooms = {}
		joinedRooms[SYSTEM_ROOM_NAME] = systemRoom

		$(ROOM_LIST_MENU_CLASS).empty()
		$(JOINED_ROOM_MENU_CLASS).empty()
		$('#joinedRooms').text('[Not in a room]')

		setupJoinedRoomItem(SYSTEM_ROOM_NAME)
		for(let idx = 0; idx < roomList.length; idx++) {
			setupRoomList(roomList[idx])
		}
	})

	chatSocket.on('room list update', (roomListData) => {
		if (roomListData.action === ADD_ACTION) {
			setupRoomList(roomListData.name)
		}
		else if (roomListData.action === DEL_ACTION){
			let cssRoomName = makeCssRoomName(roomListData.name) + '-room'
			$(`${JOINED_ROOM_ITEM_CLASS}.${cssRoomName}`).remove()
			$(`${ROOM_LIST_ITEM_CLASS}.${cssRoomName}`).remove()
		}
	})

	/** Room specific events */
	chatSocket.on('room info', (roomData) => {
		joinedRooms[roomData.name].users = roomData.users
		$('ul.room-users').empty()
		for(let user in roomData.users) {
			addUser(user, roomData.users[user].role )
		}
	})

	chatSocket.on('chat message', function (chatMsgData) {
		postMsg(chatMsgData)
	});

	chatSocket.on('room created', (roomData) => {
		let cssRoomName = makeCssRoomName(roomData.name)
		setupJoinedRoomItem(roomData.name)
		joinedRooms[roomData.name].buffer.push(`[${formatTimeStamp()}] You have created ${roomData.name}`)
		joinedRooms[roomData.name].isMod = roomData.isMod
		$(`${JOINED_ROOM_ITEM_CLASS}.${cssRoomName}-room`).trigger('click')
	})

	chatSocket.on('client joined room', (roomData) => {
		console.log(`You joined ${roomData.name}`)
		setupRoomListItem(roomData.name)
		let cssRoomName = makeCssRoomName(roomData.name)
		if ($(`${JOINED_ROOM_ITEM_CLASS}.${cssRoomName}-room`).length === 0) {
			setupJoinedRoomItem(roomData.name)
		}
		setupRoomListItem(roomData.name)
		joinedRooms[roomData.name].buffer.push(`[${formatTimeStamp()}] You have joined ${roomData.name}`)
		joinedRooms[roomData.name].isMod = roomData.isMod
		$(`${JOINED_ROOM_ITEM_CLASS}.${cssRoomName}-room`).trigger('click')

		showHideRoomOptions(roomData.name)
	})

	chatSocket.on('client left room', (roomName) => {
		let cssRoomName = makeCssRoomName(roomName)
		delete joinedRooms[roomName]
		$(`${JOINED_ROOM_ITEM_CLASS}.${cssRoomName}-room`).remove()
		$('#room-options-card').hide()
		currentRoom = Object.keys(joinedRooms)[Object.keys(joinedRooms).length - 1]

		if (currentRoom !== SYSTEM_ROOM_NAME) {
			cssRoomName = makeCssRoomName(currentRoom)
			$(`${JOINED_ROOM_ITEM_CLASS}.${cssRoomName}-room`).trigger('click')
		}
		else {
			$('ul.room-users').empty()
		}
	})

	chatSocket.on('room add user', (data) => {
		if (currentRoom === data.roomName) {
			let text = `[${formatTimeStamp(data.timestamp)}] ${data.username} joined the room`
			$('#messages').append($('<li>').text(text));
			addUser(data.username, data.role)
		}
	})

	chatSocket.on('room remove user', (data) => {
		removeUserInRoom(data.roomName, data.username)
		if (data.roomName == currentRoom) {
			$('#messages').append($('<li>').text(`${data.username} left the room`));
		}
	})

	chatSocket.on('room kick user', (data) => {
		removeUserInRoom(data.roomName, data.username)
		if (data.roomName == currentRoom) {
			$('#messages').append($('<li>').text(`${data.username} has been kicked`));
		}
	})

	chatSocket.on('room ban', (data) => {
		if (data.roomName == currentRoom) {
			$('#messages').append($('<li>').text(`${data.username} has been banned`));
		}
	})

	chatSocket.on('room unban', (data) => {
		if (data.roomName == currentRoom) {
			$('#messages').append($('<li>').text(`${data.username} has been unbanned`));
		}
	})

	chatSocket.on('room add mod', (data) => {
		if (data.roomName == currentRoom) {
			$('#messages').append($('<li>').text(`${data.username} is now a mod`));
		}
	})

	chatSocket.on('room remove mod', (data) => {
		if (data.roomName == currentRoom) {
			$('#messages').append($('<li>').text(`${data.username} is no longer a mod`));
		}
	})

	/**
	 * PM Socket Handlers
	 */
	pmSocket.on('pm message', (data) => {
		$('#messages').append($('<li>').text(`[${formatTimeStamp()}] ${data.from} >> ${data.msg}`));
	})


	/* Input bindings ******1************************************************/
	function processInput () {
		const msg = $('#m').val()
		let msgArgs = msg.split(' ')

		if (msgArgs.length < 2) {
			$('#messages').append($('<li>').text('Command needs an argument'));
			return
		}

		switch(msgArgs[0]) {
			case '/pm':
				let msg = msgArgs.slice(2).join(' ')
				pmSocket.emit('pm message', {
					to: msgArgs[1],
					msg: msg
				})
				$('#messages').append($('<li>').text(`[${formatTimeStamp()}] ${msgArgs[1]} << ${msg}`));
				$('#m').val('');
				break
			case '/me':
				$('#messages').append($('<li>').text(`[${formatTimeStamp()}] /me message goes here ${msgArgs[1]}`));
				break
			case '/kick':
			case '/ban':
			case '/unban':
			case '/mod':
			case '/unmod':
				let action = msgArgs[0].substring(1, msgArgs[0].length)
				chatSocket.emit('mod action', {action: action, room: currentRoom, targetName: msgArgs[1]})
				$('#m').val('');
				break
			default:
				$('#messages').append($('<li>').text(`${msgArgs[0]} is not a supported command`));
				break
		}
	}

	$('input#m').bind('keydown', (ev) => {
		if (ev.keyCode === 13) {
			const msg = $('#m').val()

			if (msg[0] === '/') {
				processInput(ev)
			} else {
				let data = {msg: msg, room: currentRoom}
				let text = `[${formatTimeStamp()}] ${username}: ${msg}`
				chatSocket.emit('chat message', data);

				joinedRooms[currentRoom].buffer.push(text)
				$('#messages').append($('<li>').text(text));
				$('#m').val('');
			}
		}
	})

	$('#join-room').bind('keydown', (ev) => {
		if (ev.keyCode === 13) {
			const roomName = $('#join-room').val()
			chatSocket.emit('join room', roomName)
			$('#join-room').val('')
		}
	})

	$('#leaveRoomBtn').click(() => {
		if (currentRoom === SYSTEM_ROOM_NAME) {
			return;
		}

		let cssRoomName = makeCssRoomName(currentRoom)
		delete joinedRooms[currentRoom]
		chatSocket.emit('leave room', currentRoom)
		$(`.dropdown-item.joinedRooms.${cssRoomName}-room`).remove()
		if ($('.dropdown-menu.joinedRooms').children().length > 0) {
			$('.dropdown-menu.joinedRooms').children().trigger("click")
		}
		else {
			$('#joinedRooms').text('[Not in a room]')
		}
	})
});