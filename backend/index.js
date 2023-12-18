// EXPRESS BLOCK
const express = require('express')
const { nanoid } = require('nanoid')

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

const roomIdToMessagesMapping = {}

io.on('connection', (socket) => {

  socket.on('sendMessage', (message) => {
    const { roomId } = message;
    const finalMessage = {
      ...message,
      messageId: nanoid()
    }
    roomIdToMessagesMapping[roomId] = roomIdToMessagesMapping[roomId] || [];
    roomIdToMessagesMapping[roomId].push(finalMessage)
    io.to(roomId).emit('roomMessage', finalMessage)
  })
  socket.on('sendTypingIndicator', (message) => {
    const { roomId } = message;
    io.to(roomId).emit('userTyping', message);
  })
  socket.on('joinRoomExclusively', (roomId) => {

    if (roomId >= 1 && roomId <= 50) {
      socket.rooms.forEach(roomIAmPartOf => socket.leave(roomIAmPartOf))
      socket.join(roomId)
      const messages = roomIdToMessagesMapping[roomId] || []
      for (const message of messages) {
        socket.emit('roomMessage', message)
      }
    } else {
      socket.emit('error-from-server', 'Invalid roomId');
      return;
    }
  })
})