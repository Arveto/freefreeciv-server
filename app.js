
var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);

// enum eventType= {MOVEMENT, ATTACK, CREATE_BARRACK, CREATE_PEASANT, CREATE_SOLDIER, HARVEST, END_TURN, PLAYER_LEAVE, PLAYER_JOIDNED_LOBBY, PLAYER_JOIN_GAME, MESSAGE}


app.use(require('express').static(__dirname + '/public'));

app.get('/', (req, res) => {
  console.log("oiu");
    res.sendFile(__dirname + '/public/game.html');
  })
  .get('/login', (req, res) => {
    res.sendFile(__dirname + '/p  ublic/login.html');
  })
  .get('/roomList', (req, res) => {
    res.sendFile(__dirname + '/public/roomList.html');
  })
  .get('/game', (req, res) => {
    res.sendFile(__dirname + '/public/game.html');
  })
  .get('/aze', (req, res) => {
    res.sendFile(__dirname + '/public/aze.html')
  })



io.sockets.on('connection', function (socket) {
  console.log('socketio connected');
  socket.emit('oiu', 'oiaezr: dze');

  socket.on('slt', ( data)=> {
    console.log(data);
  })
});


const WebSocketServer = require('ws').Server;
const wss = new WebSocketServer({server: server, port: 8080});

let player = {"pseudo": "alberto", "slot":1, "isAIControlled":0};
let player1 = {"pseudo": "ronaldWeasley", "slot":2, "isAIControlled":0};
let player2 = {"pseudo": "chuckNorris", "slot":3, "isAIControlled":0};


  //GAME INNNER EVENTS
wss.on('connection', function(ws) {
  console.log('copnnectino');
  ws.on('message', function(data, flags) {
    console.log("[data]> " +data);


    switch (data){
      case 'roomsRequest':
        ws.send('{"nRooms": 2, "rooms": [{"name": "roomName", "nPlayers": 2}, {"name": "roomName2", "nPlayers": 42}]}')
        break;

      default:
        data = JSON.parse(data);

        switch (data.type){
          case 8:
            ws.send('{"type":9, "roomId":42}');
            break;
          case 9:
            console.log("envent "+data.type);
            ws.send('{"nPlayers":2, "players": [{"pseudo":"'+player.pseudo+'", "slot":'+player.slot+', "isAIControlled":'+player.isAIControlled+'}, {"pseudo":"'+player1.pseudo+'", "slot":'+player1.slot+', "isAIControlled":'+player1.isAIControlled+'}]}');
            setTimeout(function () {
              ws.send('{"type":12}');
            }, 8000);
        }
    }

    // ws.send('{"type":9, "roomId": 0}');



    // wss.clients.forEach(function each(client) {
    //   if (client !== ws && client.readyState === WebSocket.OPEN) {
    //     client.send(data);
    //   }
    // });
    io.sockets.emit(data);


    // ws.send('close');
  });

  ws.on('close', function() {
    console.log('Connection closed!');
  });
  ws.on('error', function(e) {
  });
});

server.listen(80);
