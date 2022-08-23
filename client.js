
/**
 * 
 * @param {string} pagename 
 */

import Player from './public/clientobjects.js'

let fellowplayers = [] //stores the players - means that players can specify targets for their actions and the game can respond

//
//general functions
//
function openpage(pagename) {
    for ( const el of document.getElementsByClassName("mainpage")) {
        el.style.display = 'none'
    }

    document.getElementById(pagename).style.display = 'inline'
}

function socketsend(socket, action, data) {
    socket.send(JSON.stringify( { 'action': action, 'data': data } ) )
}

window.addEventListener('load', () => { //attach events to HTML elements here
    console.log("hi")

    //when the user presses the "HOST" button on the first page
    document.getElementById('hostbutt').addEventListener('click',() => {
        openpage('gamemenu')
    })

    let socket

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
                    document.getElementById('roomcode').placeholder = "ROOM DOESN'T EXIST"
                    break;
                default:
                    console.log('Unidentifiable action')
                }
            })
        })
    
    //when the user enters a room code it is sent to the server for them to join the room
    document.getElementById('entercode').addEventListener('click', () => {
        console.log('connecting to server...')
        let roomcode = document.getElementById('roomcode').value.toUpperCase()

        if (roomcode.length === 4) {
            socketsend(socket, 'joingame', roomcode)
        }
        
    })

    //now allows the player to enter their name
    document.getElementById('entername').addEventListener('click', () => {
        let nickname = document.getElementById('nickname').value

        if (nickname.length <= 12) {
            socketsend(socket, 'namerelay', nickname)
        }
        
    })

    //when the host presses the "START GAME" button it opens a websocket with the server
    document.getElementById('startgame').addEventListener('click', () => {
        const roomcodeelement = document.getElementById('roomcodeelement')
        let roomcode
    
        console.log('game starting...')
        socket =  new WebSocket('ws://localhost:8000')
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
                    roomcode = mssg.data
                    roomcodeelement.innerHTML = roomcode
                    break;
                case 'playerjoin'://when a player has joined 
                    let newplayer = new Player(mssg.data)
                    fellowplayers.push(newplayer)

                    let listelement = document.getElementById('joiningplayers')
                    let entry = document.createElement('li')
                    entry.appendChild(document.createTextNode('...'))
                    entry.setAttribute('id', newplayer.id)
                    listelement.appendChild(entry)
                    break;
                case 'nameset'://when a player has set their name
                    fellowplayers.forEach(p => {
                        if (p.id === mssg.id) {
                            p.name = mssg.data
                        }
                    })

                    document.getElementById(mssg.id).innerHTML = mssg.data
                    break;
                default:
                    console.log('Unidentifiable action')
            }
        })
    })

})
