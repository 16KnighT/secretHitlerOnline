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
    } catch( e ) { //tells the user there has been an error

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

    wss.on('connection', function connection(ws) { //on each websocket connection...
        ws.on('message', function message(mssg) { //listen for messages

            mssg = JSON.parse( mssg.toString() )
            console.log(mssg);

            switch (mssg.action) { 
                //commands sent by the game
                case 'startgame'://creates a new game and adds it to a list
                    const roomcode = genroomcode()
                    console.log(roomcode)
                    runninggames.set(roomcode, new Game(ws))
                    socketsend(ws, 'startgamesuccess', roomcode)
                    break;
                case 'allin': { //signifies all the players have joined
                    const room = runninggames.get(mssg.id)
                    if (room.playerslist.size <= 10 && room.playerslist.size >= 1) {
                        room.privategame()
                        socketsend(room.socket, 'gamestate')
                    }
                    break;
                }
                case 'additionalinfo': { //tells the player's screens to display something
                    const room = runninggames.get(mssg.id[0])
                    socketsend(room.playerslist.get(mssg.id[1]), 'additionalinfo', mssg.data)
                    break;
                }
                //messages sent by the player
                case 'joingame': { //adds player to the game they're trying to connect to
                    try {
                        const room = runninggames.get(mssg.data)
                        if (room.playerslist.size < 10 && room.isopen) { //checks the room is open for more players
                            let newplayer = mssg.id
                            while (room.playerslist.has(newplayer)) { //adds a 2 onto the player's if it isn't unique
                                newplayer += "2"
                            } 
                            room.newplayer(newplayer, ws)

                            socketsend(room.socket, 'playerjoin', newplayer)
                            socketsend(ws, 'joinsuccess', newplayer) //username sent back incase the server has changed it

                            if (room.playerslist.size === 5) {
                                console.log([...room.playerslist][0])
                                socketsend([...room.playerslist][0][1], "vipbutton")
                            }
                        } else { //if it can't accept the player it will return the reason
                            room.isopen ? socketsend(ws, 'joinfail', 'room full') : socketsend(ws, 'joinfail', 'game started')
                        }
                    } catch(err) {
                        socketsend(ws, 'joinfail', 'room doesn\'t exist')
                        console.log(err)
                    }
                    break;
                }
                case 'buttonoption': {
                    const room = runninggames.get(mssg.id[0])
                    socketsend(room.playerslist.get(mssg.id[1]), 'buttonoption', mssg.data)
                    break;
                }
                case 'gamestate': {
                    const room = runninggames.get(mssg.id)
                    socketsend(room.socket, 'gamestate', mssg.data)
                    break;
                }
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