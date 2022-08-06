
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

window.addEventListener('load', () => {
    console.log("hi")

    document.getElementById('hostbutt').addEventListener('click',() => {
        openpage('gamemenu')
    })

    document.getElementById('joinbutt').addEventListener('click',() => {
        openpage('joingame')
    })
})

document.getElementById('startgame').addEventListener('click', () => {
    console.log('game starting...')
    let socket =  new WebSocket('ws://localhost:8000')
    socket.addEventListener('open', (event) => {
        console.log(event)
        //socket.send('hey')

        openpage('showroomcode')
        socketsend(socket, 'startgame', 'TOBY')
    })

    socket.addEventListener('message', (event) => {
        console.log(event)
    })
})

document.getElementById('joingame').addEventListener('click', () => {
    console.log('joining game...')
    let socket = new WebSocket('ws://localhost:8000')
    socket.addEventListener('open', (event) => {
        console.log(event)
        //socket.send('hey')
        socketsend(socket, 'joingame', 'TOBY')
    })

    socket.addEventListener('message', (event) => {
        console.log(event)
    })
})