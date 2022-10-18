/**
 * Player object used in game code
 */

import {openpage} from '/client.js'

const boards = [['x', 'x', 'Policy Peek', 'Execution', 'Execution'],
    ['x', 'Investigate Loyalty', 'Call Special Election', 'Execution', 'Execution'],
    ['Investigate Loyalty', 'Investigate Loyalty', 'Call Special Election', 'Execution', 'Execution']]

export class Game {
    constructor() {
        this.deck = []
        this.discard =['F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'L', 'L', 'L', 'L', 'L', 'L']
        this.shuffle()

        this.playerlist = [] //stores the players as [[id, party, role], ...]
    }

    shuffle() {
        let count = this.discard.length
        for (let card = 0; card < count; card++) {
            this.deck = this.deck.concat(this.discard.splice(Math.floor(Math.random() * this.discard.length),1))
        }
    }

    state() {
        let gametype
        if (this.playerlist.length <= 6) {
            gametype = 0
        } else if (this.playerlist.length <= 8) {
            gametype = 1
        } else {
            gametype = 2
        }

        let fascistsnum = gametype + 2
        let fboard = boards[gametype]

        //update website gameboard
        fboard.forEach((element, index) => {
            document.querySelector(`#fboard :nth-child(${index+1})`).textContent = element
        });
        openpage('gameplay')
    }
}
