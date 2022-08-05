const http = require("http")
const fs = require("fs").promises
const { WebSocketServer } = require('ws');

const host = 'localhost'
const port = 8000

let indexFile

const requestListener = async function (req, res) {

    try {

        let url = req.url

        if( "/" == url[ url.length - 1 ] ) url += "index.html"

        const filecontents = await fs.readFile(__dirname + url)

        switch( url.substr( url.length - 3 ) ) {
            case "css":
                res.setHeader("Content-Type", "text/css")
                break
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
        ws.on('message', function message(data) {
            console.log(`${data}`);
            if (`${data}` === 'genroomcode') {
                ws.send('TOBY')
            }

        });
      
        ws.send('something');
      });
    
    
}

startserver()



