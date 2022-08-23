/**
 * Player object used in game code
 */

export default class Player{
    constructor(id) { //the id refers to the index of the websocket in the playerslist server-side
        this.id = id
        this.name = ''
    }
}