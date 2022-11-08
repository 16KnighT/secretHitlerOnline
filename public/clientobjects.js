/**
 * Player object used in game code
 */

import {openpage, socketsend} from '/client.js'

//these are the three different types of fascist board when playing secret hitler
//an 'x' signifies no action would be taken if a policy is placed on it
const boards = [['x', 'x', 'Policy Peek', 'Execution', 'Execution'],
    ['x', 'Investigate Loyalty', 'Call Special Election', 'Execution', 'Execution'],
    ['Investigate Loyalty', 'Investigate Loyalty', 'Call Special Election', 'Execution', 'Execution']]

export class Game {
    constructor(socket) {
        this.socket = socket
        this.roomcode = '' //stores it's socket and room code so it can communicate with the server

        this.deck = []
        this.discard =['F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'L', 'L', 'L', 'L', 'L', 'L']
        this.shuffle()

        this.state = this.start

        this.playerlist = [] //stores the players as [[id, party, role], ...]
    }

    shuffle() { //shuffles the discard pile into the draw pile
        let count = this.discard.length
        for (let card = 0; card < count; card++) {
            this.deck = this.deck.concat(this.discard.splice(Math.floor(Math.random() * this.discard.length),1))
        }
    }

    start() { //the initial game state which sets the game up
        let gametype//gametype determines how many fascists there should be, if Hitler knows who the other fascists are what game board to use
        if (this.playerlist.length <= 6) {
            gametype = 0
        } else if (this.playerlist.length <= 8) {
            gametype = 1
        } else {
            gametype = 2
        }

        let fboard = boards[gametype]

        //update website gameboard to work for the correct amount of players
        fboard.forEach((element, index) => {
            document.querySelector(`#fboard :nth-child(${index+1})`).textContent = element
        });

        const roles = Array(this.playerlist.length).fill('').map((player, i) => { //this simply creates a list with how many fascists and liberals there should be
            if (i >= gametype+2) {
                return 'L'
            } else if (i === 0) {
                return 'H'
            } else {
                return 'F'
            }
        })

        for (let i = roles.length-1; i>0; i--) {//this shuffles the roles so they can be randomly assigned

            //pick a remaining element
            let randomIndex = Math.floor(Math.random() * i);
        
            //and swap it with the current element
            [roles[i], roles[randomIndex]] = [
              roles[randomIndex], roles[i]];
          }

        //set up the list of people and gives them their role
        let listelement = document.getElementById('people')
        this.playerlist.forEach((player, i) => {
            let entry = document.createElement('li')
            entry.appendChild(document.createTextNode(player[0]))
            entry.setAttribute('id', player[0])
            listelement.appendChild(entry)

            if (roles[i] === 'L') {
                    this.playerlist[i][1] = this.playerlist[i][2] = 'Liberal'
            } else {
                this.playerlist[i][1] = 'Fascist'
                this.playerlist[i][2] = roles[i] === 'H' ? 'Hitler' : 'Fascist'
            }

            socketsend(this.socket, 'additionalinfo', [this.roomcode, this.playerlist[i][0]], `You are ${this.playerlist[i][2]}<br>`)
        })

        //creates a temporary list of all fascists so they can be sent who other fascists are
        let fascists = this.playerlist.filter(i => i[1] === 'Fascist')

        //iterates through the fascists and sends them a list of other fascists (Hitler only recieves this if there is only one other fascist)
        fascists.forEach(player => {
            if ((gametype === 0 && player[2] === 'Hitler') || (player[2] === 'Fascist')) {
                socketsend(this.socket, 'additionalinfo', [this.roomcode, player[0]], fascists.map(fascist => {
                    if (player !== fascist) {
                        return `${fascist[0]} is ${fascist[2]}<br>`
                    }
                }).join(''))
            }
        })
            
        
        openpage('gameplay')

        this.state = this.president
        this.state()
    }

    president() {
        console.log('start')
    }
}

export class Player {

}
