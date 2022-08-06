
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

function init() {
    console.log("hi")

    document.getElementById('hostbutt').addEventListener('click',() => {
        openpage('gamemenu')
    })

    document.getElementById('joinbutt').addEventListener('click',() => {
        openpage('joingame')
    })
}

function startgame() {
    console.log('game starting...')
    let socket =  new WebSocket('ws://localhost:8000')
    socket.addEventListener('open', (event) => {
        console.log(event)
        socket.send('hey')

        openpage('showroomcode')
        socket.send('startgame')
    })

    socket.addEventListener('message', (event) => {
        console.log(event)
    })
    
}

function joingame() {
    console.log('joining game...')
    let socket = new WebSocket('ws://localhost:8000')
    socket.addEventListener('open', (event) => {
        console.log(event)
        socket.send('hey')
        socket.send('joingame TOBY')
    })

    socket.addEventListener('message', (event) => {
        console.log(event)
    })
}