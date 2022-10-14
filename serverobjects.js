/**
 * game object used in server code
 */

 const { v4: uuidv4 } = require('uuid')

class Game {
    constructor(socket) {
        this.socket = socket
        this.playerslist = new Map()
        this.isopen = true
    }

    newplayer (id, ws) {
        this.playerslist.set(id, ws)
    }

    privategame() {
        this.isopen = false
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