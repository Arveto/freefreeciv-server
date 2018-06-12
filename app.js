

const app = require('express')();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const roomSystem = require('./rooms.js')

const eventType = {
  MOVEMENT: 1,
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
  DESTROY_ROOM: 14,
  CONNECTION: 15
};


var users = [];
var rooms = [];

/*    //Testing room
let user = new roomSystem.User('alberto', false, true, 0, '');
let user1 = new roomSystem.User('ronaldWeasley', false, true, -1, '');
let user2 = new roomSystem.User('chuckNorris', false, true, -1, '');

users.push(user);
users.push(user1);
users.push(user2);


rooms.push(new roomSystem.Room(0, "Ce genre de room", []));

rooms[0].addPlayer(users[0].pseudo, 0, true, true);
rooms[0].addPlayer(users[1].pseudo, 1, true, false);
rooms[0].players[0].isHost = true;
*/

//Socket.io (for mobile users)
io.sockets.on('connection', function(socket) {
  let currentRoom = [];
  //UTILS
  socket.emit('connected');

  socket.on("disconnect", () => {
    if (currentRoom[0]) {
      rooms[currentRoom[0]].removePlayer(rooms[currentRoom[0]].players.indexOf(currentRoom[1]));
      socket.broadcast.emit('incrementRoom', {
        'roomId': currentRoom[0],
        'value': rooms[currentRoom[0]].players.length,
        'players': rooms[currentRoom[0]].players
      });
      wss.broadcast(''); //XXX
    }
  });

  //ROOM REQUEST
  socket.on('roomsResquest', () => {
    rooms.forEach((room) => {
      socket.emit('newRoom', {
        'name': room.name,
        'id': room.id,
        'players': room.players.length
      });
    });
  });

  socket.on('joinRoom', (data) => {
    currentRoom[0] = data.roomId;
    currentRoom[1] = data.pseudo;

    //rooms[data.roomId].addPlayer(data.pseudo, rooms[data.roomId].players.length, false, (data.pseudo == rooms[data.roomId].players[0].name));

    //ROOM SELECTION
    //socket.broadcast.emit('incrementRoom', {'roomId': data.roomId, 'value': rooms[data.roomId].players.length, 'players': rooms[data.roomId].players});
    //wss.broadcast(''); //XXX

    //GAME
    //socket.broadcast.emit('newPlayer', {'room': data.roomId, 'pseudo': data.pseudo});

    //SELF
    //rooms[data.roomId].players.forEach((player)=>{
    //	socket.emit('newPlayer', {'room': data.roomId, 'player': player});
    //})
  });

  socket.on('leaveRoom', (data) => {
    rooms[data.rooId].removePlayer(rooms[data.roomId].players.indexOf(data.pseudo));
    socket.broadcast.emit('incrementRoom', {
      'roomId': data.roomId,
      'value': rooms[data.roomId].players.length,
      'players': rooms[data.roomId].players
    });
    //wss.broadcast(''); //XXX
  });

  socket.on('createRoom', (room) => {
    rooms.push(new roomSystem.Room(rooms.length, room.name, []));
    //rooms[rooms.length-1].addPlayer(room.admin, 0, false, true);

    socket.emit("youAreAdmin", {
      'roomId': rooms.length - 1
    });

    currentRoom[0] = rooms.length - 1;
    currentRoom[1] = room.admin;

    //console.log("[COMPANION] "+room.admin+" joined room n" + rooms.length-1);
    //rooms[rooms.length-1].addPlayer(room.admin, rooms[rooms.length-1].players.length, false, true);

    //ROOM SELECTION
    socket.broadcast.emit('incrementRoom', {
      'roomId': rooms.length - 1,
      'value': 1,
      'players': 1
    });
    //wss.broadcast(''); //XXX

    //SELF
    //rooms[rooms.length-1].players.forEach((player)=>{
    //	socket.emit('newPlayer', {'room': rooms.length-1, 'player': player});
    //})

    var roomsData = new Array();
    for (let i = 0; i < rooms.length; i++) {
      roomsData.push({
        id: rooms[i].id,
        name: rooms[i].name,
        nPlayers: rooms[i].players.length
      });
    }
    let roomsList = {
      nRooms: roomsData.length,
      rooms: roomsData
    };
    wss.broadcast(JSON.stringify(roomsList));
  })

  //ROOM CHAT
  socket.on('message', (mesg) => {
    socket.broadcast.emit('message', {
      'content': mesg.content,
      'playerColor': mesg.sender
    });
  });


  //GAME
  socket.on('startGame', (room) => { //room = {roomID}

  })

  socket.on("*", function(event, data) {});
});


//Vanilla websockets (for desktop users)
const WebSocketServer = require('ws').Server;
const wss = new WebSocketServer({
  server: server,
  port: 8080
});

wss.broadcast = function broadcast(msg) {
  wss.clients.forEach(function each(client) {
    client.send(msg);
  });
};

//Prepare general infos for all rooms
var roomsData = new Array();
for (let i = 0; i < rooms.length; i++) {
  //if(!(rooms[i].isPlaying) && rooms[i].nPlayers < 4){
  roomsData.push({
    id: rooms[i].id,
    name: rooms[i].name,
    nPlayers: rooms[i].players.length
  });
  console.log("Pushiiing");
  //}
}
let roomsList = {
  nRooms: roomsData.length,
  rooms: roomsData
};

//GAME INNNER EVENTS (Lobby and game)
wss.on('connection', function(ws) {
  ws.on('message', function(data, flags) {

    switch (data) {
      case "roomsRequest":
        {
          var roomsData = new Array();
          for (let i = 0; i < rooms.length; i++) {
            //if(!(rooms[i].isPlaying) && rooms[i].nPlayers < 4){
            roomsData.push({
              id: rooms[i].id,
              name: rooms[i].name,
              nPlayers: rooms[i].players.length
            });
            //}
          }
          let roomsList = {
            nRooms: roomsData.length,
            rooms: roomsData
          };

          ws.send(JSON.stringify(roomsList));
          console.log(JSON.stringify(roomsList));
        }
        break;


      default:
        {
          data = JSON.parse(data);

          switch (data.type) {


            //Just adding PC user to the user array
            case eventType.CONNECTION:
              {
                let addedPlayer = false;

                //Looking for the user on mobile
                for (let i = 0; i < users.length; i++) {
                  if (data.pseudo == users[i].pseudo) {
                    users[i].onDesktop = 1;
                    addedPlayer = 0;
                    break;
                  }
                }

                //If the player was not on mobile, we add him on the list
                if (!addedPlayer) {
                  users.push(new roomSystem.User(data.pseudo, 0, 1, ''));
                }
              }
              break;


            case eventType.PLAYER_JOIN_ROOM:
              {
                rooms[data.roomId].addPlayer(data.playerInfos.pseudo, rooms[data.roomId].players.length, 0, 0)

                var roomsData = new Array();
                for (let i = 0; i < rooms.length; i++) {
                  //if(!(rooms[i].isPlaying) && rooms[i].nPlayers < 4){
                  roomsData.push({
                    id: rooms[i].id,
                    name: rooms[i].name,
                    nPlayers: rooms[i].players.length
                  });
                  //}
                }
                let roomsList = {
                  nRooms: roomsData.length,
                  rooms: roomsData
                };

                // rooms[data.roomId].addPlayer(data.playerInfos.pseudo, rooms[data.roomId].players.length, false, false);
                if (rooms[data.roomId].players[rooms[data.roomId].players.length - 1].pseudo == "Purple") {
                  rooms[data.roomId].players[rooms[data.roomId].players.length - 1].isHost = 1;
                }

                //Notice to refresh the lobby
                roomsData[data.roomId].nPlayers = rooms[data.roomId].players.length;
                roomsList = {
                  nRooms: roomsData.length,
                  rooms: roomsData
                };
                wss.broadcast(JSON.stringify(roomsList));

                //Looks for host:
                for (let i = 0; i < rooms[data.roomId].players.length; i++) {
                  if (rooms[data.roomId].players[i].isHost) {
                    var roomHost = rooms[data.roomId].players[i].pseudo;
                  }
                }

                //Broadcasts info about the new room state (for players in that room)
                let roomInfos = {
                  roomId: data.roomId,
                  nPlayers: rooms[data.roomId].players.length,
                  players: rooms[data.roomId].players,
                  host: "Purple"
                };
                wss.broadcast(JSON.stringify(roomInfos));

              }
              break;


            case eventType.PLAYER_LEAVE_ROOM:
              {
                var roomsData = new Array();
                for (let i = 0; i < rooms.length; i++) {
                  //if(!(rooms[i].isPlaying) && rooms[i].nPlayers < 4){
                  roomsData.push({
                    id: rooms[i].id,
                    name: rooms[i].name,
                    nPlayers: rooms[i].players.length
                  });
                  //}
                }
                let roomsList = {
                  nRooms: roomsData.length,
                  rooms: roomsData
                };
                rooms[data.roomId].removePlayer(data.playerInfos.slot);

                //Notice to refresh the lobby
                roomsData[data.roomId].nPlayers = rooms[data.roomId].players.length;
                roomsList = {
                  nRooms: roomsData.length,
                  rooms: roomsData
                };
                wss.broadcast(JSON.stringify(roomsList));

                //Broadcasts info about the new room state (for players in that room)
                let roomInfos = {
                  roomId: data.roomId,
                  nPlayers: rooms[data.roomId].players.length,
                  players: rooms[data.roomId].players
                };
                wss.broadcast(JSON.stringify(roomInfos));

              }
              break;


              //All ingame events and game start (just need broadcast)
            case eventType.MOVEMENT:
            case eventType.ATTACK:
            case eventType.CREATE_BARRACK:
            case eventType.CREATE_PEASANT:
            case eventType.CREATE_SOLDIER:
            case eventType.HARVEST:
            case eventType.END_TURN:
            case eventType.GAME_START:
              {
                wss.broadcast(JSON.stringify(data));

                if (data.type == eventType.GAME_START) {
                  rooms[data.roomId].isPlaying = 1;
                }

              }
              break;

          }
        }
    }

  });

  ws.on('close', function() {});
  ws.on('error', function(e) {});
});

server.listen(4242);
