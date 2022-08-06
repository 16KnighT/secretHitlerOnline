/**
 * game and player objects used in code
 */

class Game {
    playerslist = []
    constructor(socket) {
        this.socket = socket
    }
    
    get players() {
        return this.playerslist
    }

    newplayer (player) {
        this.playerslist.push(player)
    }
}

class Player {
    constructor(socket) {
        this.socket = socket
    }
}

module.exports.Game = Game
module.exports.Player = Player