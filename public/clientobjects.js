/**
 * Player object used in game code
 */

import {openpage, socketsend, announce} from '/client.js'

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

        this.currentpresident
        this.nextpresident = 0
        this.chancellor
        this.tally = []

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
                    if (player !== fascist) {//does not return that the receiving player is a fascist as they already know
                        return `${fascist[0]} is ${fascist[2]}<br>`
                    }
                }).join(''))
            }
        })
            
        
        openpage('gameplay')
        setTimeout(() => {
            this.state = this.president
            this.newpresident()
        }, 5000)
    }

    newpresident() {
        //using try catcher as during first run, no elements will have the class so .remove() will cause an error
        try { //removes current president and chancellor from the display
            document.querySelector('.president').classList.remove('president')
            document.querySelector('.chancellor').classList.remove('chancellor')
        } finally {
            this.currentpresident = this.playerlist[this.nextpresident][0]
            this.nextpresident++

            document.getElementById(this.currentpresident).classList.add('president')
            announce(`${this.currentpresident} is the president`)

            socketsend(this.socket, 'buttonoption', [this.roomcode, this.currentpresident], this.playerlist.map(player => player[0]).filter(player => player !== this.currentpresident))
        }
    }

    president(candidate) {
        console.log(candidate[1])
        announce(`${candidate[1]} has been proposed as chancellor`)
        document.getElementById(candidate[1]).classList.add('chancellor')

        document.getElementById('record').innerHTML += `vote on ${candidate[1]}`
        this.chancellor = candidate[1]

        this.tally = []
        this.state = this.election
        this.playerlist.map(player => player[0]).forEach(id => {
            socketsend(this.socket, 'buttonoption', [this.roomcode, id], ['Ja!', 'Nein!'])
        })
    }

    election(vote) {
        console.log(this.tally.map(e => e[0]))
        console.log(vote[0])
        if (!(this.tally.map(e => e[0]).includes(vote[0]))) { //checks if player has already voted
            this.tally.push(vote)//adds their vote if they havent
            console.log(this.tally)
        }

        if (this.tally.length === this.playerlist.length) {
            announce('vote complete')
            setTimeout(() => {
                let votes = ''
                this.tally.forEach(e => {
                    votes += `${e[0]} voted ${e[1]}<br>`
                })

                let record = document.getElementById('record')
                record.innerHTML += `vote on ${this.chancellor}<br>${votes}`
                record.scrollTo(0, record.scrollHeight)
                if (this.tally.filter(e => e[1] === 'Ja!').length > this.playerlist.length/2) {
                    announce('election won')
                    this.state = this.presidentdiscard
                } else {
                    announce('election failed')
                }
            },5000)
        }
    }

    presidentdiscard() {

    }

    chancellordiscard() {

    }

    veto() {

    }

    investigate() {

    }

    spelection() {

    }

    execute() {
        
    }
}
