/**
 * game object used in server code
 */

 const { v4: uuidv4 } = require('uuid')

class Game {
    constructor(socket) {
        this.socket = socket
        this.playerslist = new Map()
    }

    newplayer (id, ws) {
        this.playerslist.set(id, ws)
    }
}

class Player {
    constructor(socket) {
        this.socket = socket
        this.id = ''
    }
    
}

module.exports.Game = Game
module.exports.Player = Player