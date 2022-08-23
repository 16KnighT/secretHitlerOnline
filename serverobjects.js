/**
 * game object used in server code
 */

 const { v4: uuidv4 } = require('uuid')

class Game {
    constructor(socket) {
        this.socket = socket
        this.playerslist = []
    }

    newplayer (player) {
        this.playerslist.push(player)
    }
}

class Player {
    constructor(socket) {
        this.socket = socket
        this.id = uuidv4()
    }
    
}

module.exports.Game = Game
module.exports.Player = Player