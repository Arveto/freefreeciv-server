
const app = require('express')();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const roomSystem = require('./rooms.js')

const eventType= {MOVEMENT: 1,
    ATTACK: 2,
    CREATE_BARRACK: 3,
    CREATE_PEASANT: 4,
    CREATE_SOLDIER: 5,
    HARVEST: 6,
    END_TURN: 7,
    PLAYER_LEAVE_GAME: 8,
    PLAYER_JOIN_ROOM: 9,
    PLAYER_LEAVE_ROOM: 10,
    GAME_START: 11,
    MESSAGE: 12,
    ROOM_CREATION: 13,
    DESTROY_ROOM: 14};


var users = [];
var rooms = [];

    //Testing room
let user = new roomSystem.User('alberto', false, true, 0, '');
let user1 = new roomSystem.User('ronaldWeasley', false, true, -1, '');
let user2 = new roomSystem.User('chuckNorris', false, true, -1, '');

users.push(user);
users.push(user1);
users.push(user2);


rooms.push(new roomSystem.Room(0, "Ce genre de room", []));

rooms[0].addPlayer(users[0].pseudo, 0, false, false);
rooms[0].addPlayer(users[1].pseudo, 1, false, false);
//rooms[0].addPlayer(users[2].pseudo, 2, false, false);
rooms[0].players[0].isHost = true;

		//Socket.io (for mobile users)
io.sockets.on('connection', function (socket) {
	let currentRoom = [];
		//UTILS
	console.log('[COMPANION] new connection : ' + socket.id);
	socket.emit('connected');
	
	socket.on("disconnect", () => {
    if (currentRoom[0]){
      console.log("[COMPANION] disconnection");
      console.log("[COMPANION] "+currentRoom[1]+"lived room n" + currentRoom[0]);
      rooms[currentRoom[0]].removePlayer(rooms[currentRoom[0]].players.indexOf(currentRoom[1]));
      socket.broadcast.emit('incrementRoom', {'roomId': currentRoom[0], 'value': rooms[currentRoom[0]].players.length, 'players': rooms[currentRoom[0]].players});
      wss.broadcast(''); //XXX
    }
	});
		
		//ROOM REQUEST
	socket.on('roomsResquest', ()=>{
		rooms.forEach((room)=>{
			socket.emit('newRoom', {'name': room.name, 'id': room.id, 'players': room.players.length});
		});
	});
	
	socket.on('joinRoom', (data) => {
    currentRoom[0] = data.roomId; currentRoom[1] = data.pseudo;
    
		console.log("[COMPANION] "+data.pseudo+" joined room n" + data.roomId);
		console.log(rooms[data.roomId])
		rooms[data.roomId].addPlayer(data.pseudo, rooms[data.roomId].players.length, false, (data.pseudo == rooms[data.roomId].players[0].name));
		
			//ROOM SELECTION
		socket.broadcast.emit('incrementRoom', {'roomId': data.roomId, 'value': rooms[data.roomId].players.length, 'players': rooms[data.roomId].players});
		wss.broadcast(''); //XXX
		
			//GAME
		socket.broadcast.emit('newPlayer', {'room': data.roomId, 'pseudo': data.pseudo});
		
			//SELF
		rooms[data.roomId].players.forEach((player)=>{
			socket.emit('newPlayer', {'room': data.roomId, 'player': player});
		})
	});
	
	socket.on('leaveRoom', (data)=>{
		console.log("[COMPANION] "+data.pseudo+"lived room n " + data.roomId);
		rooms[data.rooId].removePlayer(rooms[data.roomId].players.indexOf(data.pseudo));
		socket.broadcast.emit('incrementRoom', {'roomId': data.roomId, 'value': rooms[data.roomId].players.length, 'players': rooms[data.roomId].players});
		wss.broadcast(''); //XXX
	});
	
	socket.on('createRoom', (room)=>{
		console.log("[COMPANION] new Room : " + room.name);
		rooms.push(new roomSystem.Room(rooms.length, room.name, []));
		//rooms[rooms.length-1].addPlayer(room.admin, 0, false, true);
    
		socket.emit("youAreAdmin", {'roomId': rooms.length-1});
    console.log('ROOM ' + rooms.length-1 + ' CREATED')
    
    currentRoom[0] = rooms.length-1; currentRoom[1] = room.admin;
    
		console.log("[COMPANION] "+room.admin+" joined room n" + rooms.length-1);
		console.log(rooms[rooms.length-1])
		rooms[rooms.length-1].addPlayer(room.admin, rooms[rooms.length-1].players.length, false, true);
		
			//ROOM SELECTION
		socket.broadcast.emit('incrementRoom', {'roomId': rooms.length-1, 'value': 1, 'players': 1});
		wss.broadcast(''); //XXX
		
			//SELF
		rooms[rooms.length-1].players.forEach((player)=>{
			socket.emit('newPlayer', {'room': rooms.length-1, 'player': player});
		})
	})
		
		//ROOM CHAT
	socket.on('message', (mesg)=>{
		console.log('new message from : ' + mesg.sender + ' to room : ' + mesg.room);
		socket.broadcast.emit('message', {'content': mesg.content, 'playerColor': mesg.sender});
	});	

	
		//GAME
	socket.on('startGame', (room)=>{	//room = {roomID}
		
	})
	
	socket.on("*",function(event,data) {
		console.log('[Event not handeled] : '+ event);
		console.log(data);
	});
});


    //Vanilla websockets (for desktop users)
const WebSocketServer = require('ws').Server;
const wss = new WebSocketServer({server: server, port: 8080});

wss.broadcast = function broadcast(msg) {
   console.log(msg);
   wss.clients.forEach(function each(client) {
       client.send(msg);
    });
};


  //GAME INNNER EVENTS
wss.on('connection', function(ws) {
console.log('connection');
ws.on('message', function(data, flags) {
    console.log("[data]> " +data+"\n");


    switch (data){
        case 'roomsRequest':{
            var roomsData = new Array();
            for(let i=0; i<rooms.length; i++){
                roomsData.push({name: rooms[i].name, nPlayers: rooms[i].players.length});
            }

            let roomsList = {nRooms : rooms.length, rooms: roomsData};
            ws.send(JSON.stringify(roomsList));
        }break;


        default:{
            data = JSON.parse(data);

            switch (data.type){
                case eventType.PLAYER_JOIN_ROOM:{
                    rooms[data.roomId].addPlayer(data.playerInfos.pseudo, rooms[data.roomId].players.length, false, false);

                    //Broadcasts info about the new room state
                    let roomInfos = {roomId: data.roomId, nPlayers: rooms[data.roomId].players.length, players: rooms[data.roomId].players};
                    wss.broadcast(JSON.stringify(roomInfos));

                    //Notice to refresh the lobby
                    let joinRoomNotice = {type: eventType.PLAYER_JOIN_ROOM, roomId: data.roomId};
                    wss.broadcast(JSON.stringify(joinRoomNotice));
                }break;

                case eventType.PLAYER_LEAVE_ROOM:{
                    rooms[data.roomId].removePlayer(data.slot);

                    //Broadcasts info about the new room state
                    let roomInfos = {roomId: data.roomId, nPlayers: rooms[data.roomId].players.length, players: rooms[data.roomId].players};
                    wss.broadcast(JSON.stringify(roomInfos));

                    //Notice to refresh the lobby
                    let leaveRoomNotice = {type: eventType.PLAYER_LEAVE_ROOM, roomId: data.roomId};
                    wss.broadcast(JSON.stringify(leaveRoomNotice));
                }break;
            }
        }
    }

    // ws.send('{"type":9, "roomId": 0}');


    //XXX Uncomment afterwards
    //io.sockets.emit(data);


    // ws.send('close');
  });

  ws.on('close', function() {
    console.log('Connection closed!');
  });
  ws.on('error', function(e) {
  });
});

server.listen(4242);
