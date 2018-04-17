function User(pseudo, mobile, desktop, host, socketId){
    this.pseudo = pseudo;
    this.onMobile = mobile;
    this.onDesktop = desktop;
    this.host = host;   //Id of the romm that is hosted by the user
    this.socketId = socketId;   //For mobile users only
}



function Player(pseudo, isAIControlled, slot, isHost, userId){
    this.pseudo = pseudo;
    this.isAIControlled = isAIControlled;
    this.slot = slot;
    this.isHost = isHost;
    this.userId = userId;
}



function Room(id, name, players){
    this.id = id;
    this.name = name;
    this.players = players;
    this.isPlaying = false;

    this.addPlayer = function(pseudo, userId, isAIControlled, isHost){
        if(this.players.length < 4){
            var player = new Player(pseudo, isAIControlled, this.players.length, isHost, userId);
            this.players.push(player);
        }
    }

    this.removePlayer = function(slot){
        this.players.splice(slot, 1);

        if(!this.isPlaying){
            //If the game is not in progress, fills the first slots first
            for(let i=0; i<this.players.length; i++){
                this.players[i].slot = i;
            }
        }
    }
}

module.exports = {User, Player, Room}
