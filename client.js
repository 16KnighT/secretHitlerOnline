
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

    document.getElementById('hostButt').addEventListener('click',() => {
        openpage('gamemenu')
    })
}

function startgame() {
    console.log("game starting...")
    let socket =  new WebSocket('ws://localhost:8000')
    socket.addEventListener('open', (event) => {
        console.log(event)
        socket.send("hey")

        openpage('showroomcode')
        socket.send('genroomcode')
    })

    socket.addEventListener('message', (event) => {
        console.log(event)
    })
    
}