const path = require('path')
const fs = require('fs')
const express = require('express')
const app = express()
const server = require('http').Server(app)
const io = require('socket.io')(server)

const sillyname = require('sillyname')
const randomColor = require('randomcolor')

app.set('views', path.join(__dirname, 'views'))

app.get('/public/js/socket.js', (req, res) => {
  fs.readFile(path.resolve(path.join(__dirname, '..', 'node_modules', 'socket.io-client', 'dist', 'socket.io.js')), (err, data) => {
    if (err) return res.status(500).send(err)
    res.send(data)
  })
})

app.get('/public/js/phaser.js', (req, res) => {
  fs.readFile(path.resolve(path.join(__dirname, '..', 'node_modules', 'phaser', 'build', 'phaser.js')), (err, data) => {
    if (err) return res.status(500).send(err)
    res.send(data)
  })
})

app.use('/public', express.static('public'))

app.get('/', (req, res) => {
  res.sendFile(path.join(app.settings.views, 'index.html'))
})

app.get('/room/:room', (req, res) => {
  res.sendFile(path.join(app.settings.views, 'room.html'))
})

server.listen(3000)

let gameStates = {}

const shapes = [ 'triangle', 'square', 'circle', 'hexagon', 'diamond', 'asterisk' ]

io.sockets.on('connection', (socket) => {
  let room = undefined
  socket.on('room/join', (data) => {
    socket.join(data.room)
    room = data.room
    gameStates[room] = gameStates[room] || {}
    gameStates[room][socket.id] = { rotation: 0 }
    const connected = Object.keys(io.sockets.adapter.rooms[data.room].sockets)
    socket.emit('player/name', { name: sillyname(), shape: shapes[0], color: randomColor({ luminosity: 'light' }).replace('#', '') })
    io.to(data.room).emit('room/change', { room: data.room, connected })
  })

  socket.on('game/player/update', (data) => {
    gameStates[data.room][data.socket] = Object.assign(gameStates[data.room][data.socket] || {}, { name: data.name, rotation: data.rotation, shape: data.shape, color: data.color })
    io.to(data.room).emit('game/update', gameStates[data.room])
    console.log(gameStates[data.room][data.socket])
  })

  socket.on('disconnect', (a, b, c, d) => {
    if (room) {
      delete gameStates[room][socket.id]
      if (!Object.keys(gameStates[room]).length) delete gameStates[room]
      const connected = io.sockets.adapter.rooms[room] && Object.keys(io.sockets.adapter.rooms[room].sockets)
      if (connected) io.to(room).emit('room/change', { room: room, connected })
    }
  })
})
