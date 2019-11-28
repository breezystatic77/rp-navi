
At some point, this will contain documentation of all socket.io endpoints and data formats.

Example format:
## `potato`
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

# From Server _(to client)_

## `info`
Information from the server

## `rooms list`
List of rooms

## `names list`
List of names the account owns

## `chat message`
Chat message to clients

## `client joined room`
Telling the client they joined a room

## `client left room`
Telling the client they left a room

## `client kicked`
Telling the client they were kicked

## `client banned`
Telling the client they were banned

## `room add user`
Another client joined the room

## `room remove user`
Another client left the room

## `room kick user`
Another client was kicked from the room

## `room created`
The client created a room

## `room list update`
Update the room list

## `room info`
Information about a room

## `room add mod`
A mod was added to the room

## `room remove mod`
A mod was removed from the room

## `room ban user`
A user was banned

## `room unban user`
A user was unbanned

## `room settings updated`
A mod updated the room options


# From Client _(to server)_
## `disconnect`
Client disconnected

## `chat message`
Client sent a message for a chat room

## `join room`
Client wants to join a room

## `leave room`
Client wants to leave a room

## `get room info`
Client wants information from a room

## `set room settings`
Client is changing a room's settings

## `mod action`
Client is performing a mod action
