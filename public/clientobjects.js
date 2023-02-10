/**
 * Player object used in game code
 */

import {openpage, socketsend, announce} from '/client.js'

//these are the three different types of fascist board when playing secret hitler
//an 'x' signifies no action would be taken if a policy is placed on it
const pausetime = 0

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

        this.currentpresident //stores the id of the current president
        this.nextpresident = 0 //stores the index of the next president
        this.chancellor
        this.previousgovernment = []

        this.electiontracker = 0
        this.tally = []
        this.cardvalidation = []

        this.fpolicies = 0
        this.lpolicies = 0

        this.state = this.start

        this.playerlist = [] //stores the players as [[id, party, role], ...]
    }

    shuffle() { //shuffles the discard pile into the draw pile
        let count = this.discard.length
        for (let card = 0; card < count; card++) {
            this.deck = this.deck.concat(this.discard.splice(Math.floor(Math.random() * this.discard.length),1))
        }
        this.updatecardpiles()
    }

    updatecardpiles() { //update the html of the card piles to represent the no. cards in each
        document.getElementById('drawpile').innerHTML = this.deck.length
        document.getElementById('discardpile').innerHTML = this.discard.length
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
        this.playerlist.forEach((player, i) => {
            if (roles[i] === 'L') {
                    this.playerlist[i][1] = this.playerlist[i][2] = 'Liberal'
            } else {
                this.playerlist[i][1] = 'Fascist'
                this.playerlist[i][2] = roles[i] === 'H' ? 'Hitler' : 'Fascist'
            }

            socketsend(this.socket, 'additionalinfo', [this.roomcode, this.playerlist[i][0]], `<h1>You are ${this.playerlist[i][2]}</h1><br>`)
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
        }, pausetime)
    }
    //functions and procedures
    newpresident() {
        if (this.deck.length < 3) {//shuffles deck if there's less than 3 policies left
            announce('shuffling the deck...')
            this.shuffle()
        }

        if (this.electiontracker >= 3) {
            announce('political chaos from too many failed governments!')
            this.electiontracker = 0
            this.previousgovernment = []
            const emergencycard = this.deck.splice(1,1)
            let targettile = document.querySelector(`#fboard :nth-child(${
                emergencycard === 'F' ? this.fpolicies : this.lpolicies
            })`)
            targettile.classList.add('cards')
            

            if (this.deck.length < 3) {//shuffles deck if there's less than 3 policies left
                announce('shuffling the deck...')
                this.shuffle()
            }
    
        }

         //using try catcher as during first run, no elements will have the class so .remove() will cause an error
        try { //removes current president and chancellor from the display
            document.querySelector('.president').classList.remove('president')
            document.querySelector('.chancellor').classList.remove('chancellor')
        } finally {
            this.currentpresident = this.playerlist[this.nextpresident][0]
            this.nextpresident++
            
            if (this.nextpresident === this.playerlist.length) {
                this.nextpresident = 0
            }

            document.getElementById(this.currentpresident).classList.add('president')
            announce(`${this.currentpresident} is the president`)
            let playernames = this.playerlist.map(player => player[0]).filter(player => (player !== this.currentpresident) && !(this.previousgovernment.includes(player)))
            playernames.push('choose your chancellor')

            socketsend(this.socket, 'buttonoption', [this.roomcode, this.currentpresident], playernames)
        }
    }

    sendpolicies(target) {
        let cardmessage = [this.cardvalidation, 'choose one to DISCARD'].flat()
        console.log(cardmessage)
        socketsend(this.socket, 'buttonoption', [this.roomcode, target], cardmessage)
    }

    //game states
    president(candidate) {
        if (candidate[0] === this.currentpresident && !(this.previousgovernment.includes(candidate[1])) && candidate[1] !== this.currentpresident) {//checks if the current president sent the message AND if the choice was eligible AND if they aren't electing themself
            console.log(candidate[1])
            announce(`${candidate[1]} has been proposed as chancellor`)
            document.getElementById(candidate[1]).classList.add('chancellor')

            document.getElementById('record').innerHTML += `<br>vote on ${candidate[1]}<br>`
            this.chancellor = candidate[1]

            this.tally = []//sets the tally to 0
            this.state = this.election
            this.playerlist.map(player => player[0]).forEach(id => {
                socketsend(this.socket, 'buttonoption', [this.roomcode, id], ['Ja!', 'Nein!', 'vote'])
            })
        } else if (candidate[0] === this.currentpresident) {//condition is true if the president sent an uneligble candidate
            let playernames = this.playerlist.map(player => player[0]).filter(player => (player !== this.currentpresident) || !(this.previousgovernment.includes(player)))
            socketsend(this.socket, 'buttonoption', [this.roomcode, this.currentpresident], playernames)
        }
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
                record.innerHTML += `${votes}`
                record.scrollTo(0, record.scrollHeight)
                if (this.tally.filter(e => e[1] === 'Ja!').length > this.playerlist.length/2) {//checks a majority have voted in favour
                    announce('election won')
                    this.previousgovernment = [this.currentpresident, this.chancellor]

                    this.state = this.presidentdiscard
    
                    this.cardvalidation = this.deck.splice(0,3)//cards drawn are stored server-side to prevent cheating
                    this.updatecardpiles()
                    console.log(this.cardvalidation)
                    this.sendpolicies(this.currentpresident)
                } else {
                    announce('election failed')
                    this.electiontracker++
                    this.state = this.president
                    this.newpresident()
                }
            },pausetime)
        }
    }

    presidentdiscard(discarding) {
        //ADD ABILITY TO VETO LATER
        if (this.cardvalidation.includes(discarding[1]) && discarding[0] === this.currentpresident) { //double checks that the chosen policy was an actual choice
            this.state = this.chancellordiscard
            this.cardvalidation.splice(this.cardvalidation.indexOf(discarding[1]), 1) //removes specified element from array
            this.discard.push(discarding[1])

            this.updatecardpiles()
            if (this.fpolicies >= 5) {
                this.cardvalidation.splice(2, 0, 'veto') //inserts a veto option if there are more than 5 fascist policies
            }
            this.sendpolicies(this.chancellor)
        } else {
            this.sendpolicies(this.currentpresident) //if not, it will resend the choices
        }
    }

    chancellordiscard(discarding) {
        if (this.cardvalidation.includes(discarding[1]) && discarding[0] === this.chancellor) { //double checks that the chosen policy was an actual choice or if the veto was availabile
            this.cardvalidation.splice(this.cardvalidation.indexOf(discarding[1]), 1) //removes specified element from array
            this.discard.push(discarding[1])
            this.updatecardpiles()
            if (discarding === 'veto') {
                announce('the chancellor vetoed')
                this.state = this.veto
                socketsend(this.socket, 'buttonoption', [this.roomcode, this.currentpresident], ['Ja!', 'nein.', 'approve veto?'])
            } else if (this.cardvalidation[0] === 'L') {
                this.lpolicies++

                if (this.lpolicies === 5){
                    openpage('additionalinfo')
                    announce('LIBERALS WIN') //DEVELOP WIN CONDITION LATER
                } else {
                    //updates gameboard
                    let targettile = document.querySelector(`#lboard :nth-child(${this.lpolicies})`)
                    targettile.textContent = ''
                    targettile.classList.add('cards')

                    this.state = this.president
                    this.newpresident()
                }
            } else {
                this.fpolicies++

                if (this.fpolicies === 6){
                    openpage('additionalinfo')
                    announce('FASCISTS WIN')//DEVELOP WIN CONDITION LATER
                } else {
                    //updates gameboard
                    let targettile = document.querySelector(`#fboard :nth-child(${this.fpolicies})`)
                    let boardaction = targettile.textContent
                    targettile.textContent = ''
                    targettile.classList.add('cards')

                    switch (boardaction) {
                        case 'Policy Peek':
                            announce(boardaction)
                            let peekpolicies = this.deck.slice(0,3)
                            socketsend(this.socket, 'additionalinfo', [this.roomcode, this.currentpresident], `next policies are ${peekpolicies[0]}, ${peekpolicies[1]} and ${peekpolicies[3]}`)
                            this.state = this.president
                            this.newpresident()
                            break;
                        case 'Execution':
                            announce(boardaction)
                            setTimeout(() => {
                                announce('"I formally execute..."')
                                this.state = this.execute
                                let playernames = this.playerlist.map(player => player[0]).filter(player => player !== this.currentpresident)
                                playernames.push('who dies?')
                                socketsend(this.socket, 'buttonoption', [this.roomcode, this.currentpresident], playernames)
                            }, pausetime)
                            break;
                        case 'Investigate Loyalty': {
                            let playernames = this.playerlist.map(player => player[0]).filter(player => player !== this.currentpresident)
                            playernames.push('who will you investigate?')

                            this.state = this.investigate
                            socketsend(this.socket, 'buttonoption', [this.roomcode, this.currentpresident], playernames)
                            announce(boardaction)
                            break;
                        }
                        case 'Call Special Election': {
                            let playernames = this.playerlist.map(player => player[0]).filter(player => player !== this.currentpresident)
                            playernames.push('choose the special president')
                            
                            this.state = this.spelection
                            socketsend(this.socket, 'buttonoption', [this.roomcode, this.currentpresident], playernames)
                            announce(boardaction)
                            break;
                        }
                        default:
                            this.state = this.president
                            this.newpresident()
                            break;
                    }
                }
            }
        } else {
            this.sendpolicies(this.chancellor) //if not, it will resend the choices
        }
    }

    veto(approval) {
        if (approval[0] === this.currentpresident) { //only accepts responses from the current president
            if (approval[1] === 'Ja!') {
                announce('veto approved')
                this.electiontracker++
                this.newpresident()
                this.state = this.president
            } else {
                announce('veto rejected')
                this.cardvalidation.splice(2, 1)//removes veto option
                this.state = this.chancellordiscard
                this.sendpolicies(this.chancellor)
            }
        }
    }

    investigate(investigate) {
        if (investigate[0] === this.currentpresident) {
            for (let i = 0; i < this.playerlist.length; i++) {
                if (investigate[1] === this.playerlist[i][0]) {
                    socketsend(this.socket, 'additionalinfo', [this.roomcode, this.currentpresident], `${investigate[1]} is a ${this.playerlist[i][1]}`)
                    break;
                }
            }

            this.state = this.president
            this.newpresident()
            socketsend(this.socket, 'buttonoption', [this.roomcode, this.currentpresident], playernames)
        }
    }

    spelection(specialchoice) {
        if (specialchoice[0] === this.currentpresident) {
            this.currentpresident = specialchoice[1]

            document.querySelector('.president').classList.remove('president')
            document.querySelector('.chancellor').classList.remove('chancellor')

            document.getElementById(this.currentpresident).classList.add('president')
            announce(`${this.currentpresident} is the president`)
            let playernames = this.playerlist.map(player => player[0]).filter(player => (player !== this.currentpresident) && !(this.previousgovernment.includes(player)))
            playernames.push('choose your chancellor')

            this.state = this.president
            socketsend(this.socket, 'buttonoption', [this.roomcode, this.currentpresident], playernames)
        }
    }

    execute(victim) {
        if (victim[0] === this.currentpresident) {
            const die = victim[1]
            announce(`"${die}"`)
            let victimindex = 0
            for (let i = 0; i < this.playerlist.length; i++) {
                if (die === this.playerlist[i][0]) {
                    victimindex = i
                    break;
                }
            }
            if (this.playerlist[victimindex][2] === 'H') {
                openpage('additionalinfo')
                announce('LIBERALS WIN')
            } else {
                if (this.nextpresident > victimindex) { //negates any displacement caused by the execution for next round
                    this.nextpresident--
                }
                if (this.nextpresident === this.playerlist.length-1) {
                    this.nextpresident = 0
                }

                socketsend(this.socket, 'additionalinfo', [this.roomcode, this.playerlist[victimindex][0]], '<h1>You are dead</h1>')
                console.log(this.playerlist.splice(victimindex, 1))
                document.getElementById(die).classList.add('dead')
                this.state = this.president
                this.newpresident()
            }
        }
    }
}
