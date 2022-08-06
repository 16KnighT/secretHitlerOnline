
/**
 * 
 * @param {string} pagename 
 */

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

    document.getElementById('hostbutt').addEventListener('click',() => {
        openpage('gamemenu')
    })

    let socket

    document.getElementById('joinbutt').addEventListener('click',() => {
        openpage('joingame')
        socket = new WebSocket('ws://localhost:8000')
        socket.addEventListener('open', (mssg) => {
            console.log(mssg)

        })
    
        socket.addEventListener('message', (mssg) => {
            mssg = JSON.parse( mssg.data.toString() )
            console.log(mssg.action)
            
            switch (mssg.action) {
                case 'success':
                    openpage('gamelobby')
                    break;
                default:
                    console.log('Unidentifiable action')
                }
            })
        })

    document.getElementById('entercode').addEventListener('click', () => {
        console.log('connecting to server...')
        let roomcode = document.getElementById('roomcode').value.toUpperCase()

        if (roomcode.length === 4) {
            socketsend(socket, 'joingame', roomcode)
        }
        
    })

    document.getElementById('startgame').addEventListener('click', () => {
        const roomcodeelement = document.getElementById('roomcodeelement')
        let roomcode
    
        console.log('game starting...')
        socket =  new WebSocket('ws://localhost:8000')
        socket.addEventListener('open', (mssg) => {
            console.log(mssg)
    
            openpage('showroomcode')
            socketsend(socket, 'startgame')
        })
    
        socket.addEventListener('message', function message(mssg) {
            console.log(mssg)
            mssg = JSON.parse( mssg.data.toString() )
    
            switch (mssg.action) {
                case 'startgame':
                    roomcode = mssg.data
                    roomcodeelement.innerHTML = roomcode
                    break;
                default:
                    console.log("Unidentifiable action")
            }
        })
    })

})
