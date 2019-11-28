# RP Navi Socket.IO Documentation

## Scope
At some point, this will contain documentation of all socket.io endpoints and data formats.

## Format
Example format:

### `potato`
This message sends information about all active potatoes.

Example data:
```javascript
{
	dataone: [ 1, 2, 3, 4, 5],		// info about dataone
	datatwo: "hsdfsfsdfadfasdf",	// info about datatwo
	sub_datas: {					// info about sub_datas
		data_sub_one: foo,			// info about data_sub_one
		data_sub_two: bar			// info about data_sub_two
	}
}
```
**Notes**
* All data must be contained in objects, even if it only contains a single entry.
*

## From Server _(to client)_

### `info`
Information from the server.
```javascript
{
	msg: String 		// Text message to display
	timestamp: Number 	// Timestamp of the message
}
```

### `rooms list`
List of rooms
```javascript
{
	rooms: [ String, String, String, ... ]	// Array of room
}
```

### `names list`
List of names the account owns
```javascript
{
	usernames: [ String, String, String, ... ]	// Array of names
}

```

### `chat message`
Chat message to clients

```javascript
{
	msg: String 		// Text message to display
	username: String 	// Who sent the message
	roomName: String	// Which room is this for
	timestamp: Number 	// Timestamp of the message
}
```

### `client room created`
The client created a room
```javascript
{
	roomName: String, 	// Which room is this for
	isMode: Boolean		// Client is a mod, defaults to true (client may ignore this and assume such)
}
```

### `client joined room`
Telling the client they joined a room
```javascript
{
	roomName: String,	// Name of the room
	isMod: Boolean		// If the client is a mod of the room
}
```

### `client left room`
Telling the client they left a room
```javascript
{
	roomName: String	// Name of the room the client left
}
```

### `client kicked`
Telling the client they were kicked. This only emits if the client is in the room.
```javascript
{
	roomName: String 	// Which room is this for
}
```

### `client banned`
Telling the client they were banned. 
```javascript
{
	roomName: String 	// Which room is this for
}
```

### `room list update`
Update the room list
```javascript
{
	roomName: String, 	// Which room this is
	action: Number,		// Which action to take on the room in the client's room listing. Currently only ADD (1) and DELETE (0)
}
```

### `room info`
Information about a room
```javascript
{
	roomName: String, 	// Name of the room
	users: [String],	// Users who are in the room
	password: String,	// Password of the room (if the client is a mod)
}
```


### `room add user`
Another client joined the room
```javascript
{
	roomName: String, 	// Which room is this for
	username: String,	// Who the user was
	role: Number		// The user's role in the room
}
```

### `room remove user`
Another client left the room
```javascript
{
	roomName: String, 	// Which room is this for
	username: String,	// Who the user was
}
```

### `room kick user`
Another client was kicked from the room
```javascript
{
	roomName: String, 	// Which room is this for
	username: String,	// Who the user was
}
```

### `room add mod`
A mod was added to the room
```javascript
{
	roomName: String, 	// Which room is this for
	username: String,	// Who the user was
}
```

### `room remove mod`
A mod was removed from the room

```javascript
{
	roomName: String, 	// Which room is this for
	username: String,	// Who the user was
}
```

### `room ban user`
A user was banned
```javascript
{
	roomName: String, 	// Which room is this for
	username: String,	// Who the user was
}
```

### `room unban user`
A user was unbanned
```javascript
{
	roomName: String, 	// Which room is this for
	username: String,	// Who the user was
}
```

### `room settings updated`
A mod updated the room options
```javascript
{
	roomName: String, 	// Which room is this for
	password: String,	// Password of the room (blank = no password)
	private: Boolean,	// Marks the room as public or private
}
```

# From Client _(to server)_
### `disconnect`
Client disconnected. This is automatically generated by the Socket.IO system.

### `chat message`
Client sent a message for a chat room
```javascript
{
	roomName: String, 	// Which room is this for
	msg: String,		// Message being sent
}
```

### `join room`
Client wants to join a room
```javascript
{
	roomName: String, 	// Which room the client wants to join
}
```

### `leave room`
Client wants to leave a room
```javascript
{
	roomName: String, 	// Which room the client wants to leave
}
```

### `get room info`
Client wants information from a room
```javascript
{
	roomName: String, 	// Which room the client wants info from
}
```

### `set room settings`
Client is changing a room's settings
```javascript
{
	roomName: String, 	// Which room the client wants to modify
	password: String,	// Password of the room (blank = no password)
	private: Boolean,	// Marks the room as public or private
}
```

### `mod action`
Client is performing a mod action (kick, ban, etc)
```javascript
{
	roomName: String, 	// Which room the client wants to perform the mod action
	action: String,		// Action that's being performed
	targetName: String,	// Name of the user that the action will be performed on
}
```