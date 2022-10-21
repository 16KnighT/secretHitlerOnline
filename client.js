
/**
 * 
 * @param {string} pagename 
 */

import {Game} from'./public/clientobjects.js'

//
//general functions
//
export function openpage(pagename) {
    for ( const el of document.getElementsByClassName("mainpage")) {
        el.style.display = 'none'
    }

    document.getElementById(pagename).style.display = 'inline'
}

export function socketsend(socket, action, id, data) {
    socket.send(JSON.stringify( { 'action': action, 'id': id, 'data': data} ) )
}

window.addEventListener('load', () => { //attach events to HTML elements here
    console.log("hi")

    //when the user presses the "HOST" button on the first page
    document.getElementById('hostbutt').addEventListener('click',() => {
        openpage('gamemenu')
    })

    let socket
    let roomcode
    let nickname

    //when the user presses the "JOIN" button on the first page
    document.getElementById('joinbutt').addEventListener('click',() => {
        openpage('joingame')
        socket = new WebSocket('ws://localhost:8000')
        socket.addEventListener('open', (mssg) => {
            console.log(mssg)

        })

        //everytime the user recieves a message from the server this function is called
        socket.addEventListener('message', (mssg) => {
            mssg = JSON.parse( mssg.data.toString() )
            console.log(mssg.action)
            
            switch (mssg.action) {
                case 'joinsuccess':
                    openpage('confirmation')
                    break;
                case 'joinfail':
                    document.getElementById('roomcode').value = ""
                    document.getElementById('roomcode').placeholder = mssg.data
                    break;
                case 'vipbutton'://allows the fist player to start the game
                    let buttonelement = document.getElementById('allplayersjoined')
                    let entry2 = document.createElement('button')
                    entry2.appendChild(document.createTextNode('government in session'))
                    entry2.addEventListener('click', () => {
                        socketsend(socket, 'allin', roomcode)
                        entry2.remove()
                    })
                    buttonelement.appendChild(entry2)
                    break;
                case 'additionalinfo':
                    document.getElementById('additionalinfo').innerHTML  += mssg.data
                    break
                default:
                    console.log('Unidentifiable action')
                }
            })
        })
    
    //when the user enters a room code it is sent to the server for them to join the room
    document.getElementById('entercode').addEventListener('click', () => {
        console.log('connecting to server...')
        roomcode = document.getElementById('roomcode').value.toUpperCase()
        nickname = document.getElementById('nickname').value

        if ((roomcode.length === 4) && (nickname.length <= 12) && (nickname.length > 0)) {
            socketsend(socket, 'joingame', nickname, roomcode)
        }
        
    })

    //when the host presses the "START GAME" button it opens a websocket with the server
    document.getElementById('startgame').addEventListener('click', () => {
        console.log('game starting...')
        socket =  new WebSocket('ws://localhost:8000')

        const game = new Game(socket)
        const roomcodeelement = document.getElementById('roomcodeelement')
        socket.addEventListener('open', (mssg) => {
            console.log(mssg)
    
            openpage('gamelobby')
            socketsend(socket, 'startgame')
        })
        
        //whenever the game recieves a message from the server this is called
        socket.addEventListener('message', function message(mssg) {
            console.log(mssg)
            mssg = JSON.parse( mssg.data.toString() )
    
            switch (mssg.action) {
                case 'startgamesuccess'://successfully started game so the game can display the code
                    game.roomcode = mssg.data
                    roomcodeelement.innerHTML = mssg.data
                    break;
                case 'playerjoin'://when a player has joined 
                    game.playerlist.push([mssg.data, null, null])

                    let listelement = document.getElementById('joiningplayers')
                    let entry1 = document.createElement('li')
                    entry1.appendChild(document.createTextNode(mssg.data))
                    listelement.appendChild(entry1)
                    break;
                case 'gamestate':
                    game.state()
                    break;
                default:
                    console.log('Unidentifiable action')
            }
        })
    })

})
