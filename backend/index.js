// EXPRESS BLOCK
const express = require('express')
const app = express()


app.use(express.static('./public'))


app.listen(3000, () => {
  console.log('HTTP Server Started')
})



// TO CREATE A SIMPLE WEBSOCKET SERVERE

const { Server } = require('socket.io')
const { createServer } = require('http')
const appWebsocket = express()
const server = createServer(appWebsocket)
server.listen(3001, () => {
  console.log('WebSocket Server listening on port 3000')
})

const io = new Server(server, {
  transports: ['websocket'],
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
})

io.on('connection', (socket) => {
  socket.on('talk-to-server', (message) => {
    console.log('Got a message from a client', message)
    socket.emit('talk-to-client', `You said ${message}`)
  })
})