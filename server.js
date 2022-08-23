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
            roomcode += alphabet[Math.floor(Math.random() * 26)]
        }
    } while (runninggames.has(roomcode))
    return roomcode
}

function socketsend(socket, action, data, id) {
    socket.send(JSON.stringify( { 'action': action, 'data': data, 'id': id } ) )
}

const requestListener = async function (req, res) {

    try {

        let url = req.url

        if( "/" == url[ url.length - 1 ] ) url += "index.html"

        const filecontents = await fs.readFile(__dirname + url)
        switch( url.substr( url.length - 2 ) ) {
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
    const server = http.createServer(requestListener)
    const wss = new WebSocketServer({ server });

    server.listen(port, host, () => {
        console.log(`Server is running on http://${host}:${port}`);
    })

    wss.on('connection', function connection(ws) {
        let playerroomcode
        let playerid
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
                case 'joingame':
                    try {
                        playerroomcode = mssg.data
                        let room = runninggames.get(playerroomcode)
                        let newplayer = new Player(ws)
                        playerid = newplayer.id
                        room.newplayer(newplayer)

                        socketsend(room.socket, 'playerjoin', newplayer.id)
                        socketsend(ws, 'joinsuccess')
                    } catch(err) {
                        socketsend(ws, 'joinfail')
                        console.log(err)
                    }
                    break;
                case 'namerelay':
                    socketsend(runninggames.get(playerroomcode).socket, 'nameset', mssg.data, playerid)
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



