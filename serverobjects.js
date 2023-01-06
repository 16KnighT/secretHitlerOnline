/**
 * game object used in server code
 */

 const { v4: uuidv4 } = require('uuid')

class Game {
    constructor(socket) {
        this.socket = socket //holds the websocket to communicate with the server
        this.playerslist = new Map() //list of players in the game [{player's name: their websocket}, ...]
        this.isopen = true //states if the room is open to join
    }

    newplayer (id, ws) {//adds a new player to the player list
        this.playerslist.set(id, ws)
    }

    privategame() {//simply sets a variable to false which will now stop players from joining
        this.isopen = false
    }
}

/* unused
class Player {
    constructor(socket) {
        this.socket = socket
        this.id = ''
    }
    
}
*/
module.exports.Game = Game
//module.exports.Player = Player