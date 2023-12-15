// EXPRESS BLOCK
const express = require('express')

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

  socket.on('sendMessage', ({ roomId, message }) => {
    io.emit('roomMessage', { roomId, message })
  })
  socket.on('joinRoomExclusively', (roomId) => {
    if (roomId >= 1 && roomId <= 50) {
      socket.rooms.forEach(roomIAmPartOf => socket.leave(roomIAmPartOf))
      socket.join(roomId)
    } else {
      socket.emit('error-from-server', 'Invalid roomId');
      return;
    }
  })
})