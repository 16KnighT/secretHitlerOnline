const http = require('http')
const fs = require('fs').promises
const { WebSocketServer } = require('ws')
const { Player } = require('./serverobjects')

const Game = require('./serverobjects').Game

const host = 'localhost'
const port = 8000

let indexFile

const runninggames = new Map()

function genroomcode() {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    let roomcode = ''
    do {
        roomcode = ''
        for (let i = 0; i < 4; i++) {
            roomcode += alphabet[Math.floor(Math.random() * 26)]//adds a random letter to the room code 4 times
        }
    } while (runninggames.has(roomcode))//if the code is already being used it'll do it again
    return roomcode
}

function socketsend(socket, action, data, id) {//simple function to send data via websocket
    socket.send(JSON.stringify( { 'action': action, 'data': data, 'id': id } ) )
}

const requestListener = async function (req, res) {

    try {

        let url = req.url

        if( "/" == url[ url.length - 1 ] ) url += "index.html"

        const filecontents = await fs.readFile(__dirname + url)
        
        switch( url.substr( url.length - 2 ) ) {//determines what type of file the client is requesting (i.e. css, js or html file)
            case "ss":
                res.setHeader("Content-Type", "text/css")
                break;
            case "js":
                res.setHeader("Content-Type", "text/javascript")
                break;
            default:
                res.setHeader("Content-Type", "text/html")
        }
        
        res.writeHead(200)
        res.end(filecontents)
    } catch( e ) {

        if( e && e.code == "ENOENT" ) {
            res.writeHead( 404 )
            res.end()
            return
        }
        console.error( e )
        res.writeHead( 500 )
        res.end()
    }
}

function startserver() {
    //creating a new server and websocket server which people can connect to
    const server = http.createServer(requestListener)
    const wss = new WebSocketServer({ server });

    server.listen(port, host, () => {
        console.log(`Server is running on http://${host}:${port}`);
    })

    wss.on('connection', function connection(ws) {
        ws.on('message', function message(mssg) {

            mssg = JSON.parse( mssg.toString() )
            console.log(mssg);

            switch (mssg.action) { //creates a new game and adds it to a list
                case 'startgame':
                    let roomcode = genroomcode()
                    console.log(roomcode)
                    runninggames.set(roomcode, new Game(ws))
                    socketsend(ws, 'startgamesuccess', roomcode)
                    break;
                case 'joingame': //adds player to the game they're trying to connect to
                    try {
                        let room = runninggames.get(mssg.data)
                        if (room.playerslist.size < 10 && room.isopen) { 
                            let newplayer = mssg.id
                            while (room.playerslist.has(newplayer)) {
                                newplayer += "2"
                            } 
                            room.newplayer(newplayer, ws)

                            socketsend(room.socket, 'playerjoin', newplayer)
                            socketsend(ws, 'joinsuccess')

                            if (room.playerslist.size === 1) {
                                console.log([...room.playerslist][0])
                                socketsend([...room.playerslist][0][1], "vipbutton")
                            }
                        } else {
                            socketsend(ws, 'joinfail', 'room full')
                        }
                    } catch(err) {
                        socketsend(ws, 'joinfail', 'room doesn\'t exist')
                        console.log(err)
                    }
                    break;
                case 'allin': //signifies all the players have joined
                    let room = runninggames.get(mssg.data)
                    if (room.playerslist.size <= 10 && room.playerslist.size >= 1) {
                        room.privategame()
                        socketsend(room.socket, 'gamestate')
                    }
                    break;
                default:
                    console.log('Unidentifiable action')

            }
        });
        setTimeout(() => { //displays running games after someone joins
            console.log(runninggames.entries())
        },2000);
      });
    
    
}

startserver()