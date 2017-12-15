const path = require('path')
const fs = require('fs')
const dotenv = require('dotenv')
const express = require('express')
const app = express()
const server = require('http').Server(app)
const io = require('socket.io')(server)

dotenv.load()

const sillyname = require('sillyname')
const randomColor = require('randomcolor')

app.set('views', path.join(__dirname, 'views'))

nodeResource('/public/js/socket.js', path.join(__dirname, '..', 'node_modules', 'socket.io-client', 'dist', 'socket.io.js'))
nodeResource('/public/js/randomColor.js', path.join(__dirname, '..', 'node_modules', 'randomcolor', 'randomColor.js'))
nodeResource('/public/js/phaser.js', path.join(__dirname, '..', 'node_modules', 'phaser', 'build', 'phaser.js'))
nodeResource('/public/js/moment.min.js', path.join(__dirname, '..', 'node_modules', 'moment', 'min', 'moment.min.js'))

function nodeResource (u, p) {
  app.get(u, (req, res) => {
    fs.readFile(path.resolve(p), (err, data) => {
      if (err) return res.status(500).send(err)
      res.send(data)
    })
  })
}

app.use('/public', express.static('public'))

app.get('/', (req, res) => {
  res.sendFile(path.join(app.settings.views, 'index.html'))
})

app.get('/room/:room', (req, res) => {
  res.sendFile(path.join(app.settings.views, 'room.html'))
})

server.listen(process.env.PORT || 3000)

let gameStates = {}
let games = {}

app.get('/api/rooms', (req, res) => {
  res.send(gameStates)
})

const shapes = [ 'triangle', 'square', 'circle', 'hexagon', 'diamond', 'asterisk' ]

io.sockets.on('connection', (socket) => {
  let room
  socket.on('room/join', (data) => {
    socket.join(data.room)
    room = data.room
    gameStates[room] = gameStates[room] || {}
    gameStates[room][socket.id] = { rotation: 0 }
    const connected = Object.keys(io.sockets.adapter.rooms[data.room].sockets)
    socket.emit('player/name', { name: sillyname(), shape: shapes[0], color: randomColor({ luminosity: 'light' }).replace('#', ''), alive: true })
    io.to(data.room).emit('room/change', { room: data.room, connected })
  })

  socket.on('game/player/update', (data) => {
    gameStates[data.room][data.socket] = Object.assign(gameStates[data.room][data.socket] || {}, {
      name: data.name,
      rotation: data.rotation,
      shape: data.shape,
      color: data.color,
      alive: data.alive,
      time: data.time,
      ready: data.ready
    })
    io.to(data.room).emit('game/update', gameStates[data.room])
    const allReady = Object.keys(gameStates[data.room]).every((s) => gameStates[data.room][s].ready)
    const allDead = Object.keys(gameStates[data.room]).every((s) => !gameStates[data.room][s].alive)
    if (allReady && !allDead && !games[room]) {
      games[room] = startGame(io, data)
    } else if (allDead) {
      clearInterval(games[room])
      delete games[room]
    }
  })

  socket.on('game/player/powerup', (data) => {
    io.to(room).emit('game/player/powerup/use', Object.assign(data, {
      powerup: data.powerup.replace(/^powerup_/, ''),
      activedBy: socket.id
    }))
  })

  socket.on('disconnect', (a, b, c, d) => {
    if (room) {
      delete gameStates[room][socket.id]
      if (!Object.keys(gameStates[room]).length) {
        clearInterval(games[room])
        delete games[room]
        delete gameStates[room]
      } else {
        io.to(room).emit('game/update', gameStates[room])
      }
      const connected = io.sockets.adapter.rooms[room] && Object.keys(io.sockets.adapter.rooms[room].sockets)
      if (connected) io.to(room).emit('room/change', { room: room, connected })
    }
  })
})

function getRotations (base, adjustments) {
  return [ base ].concat(adjustments.map((i) => (
    [].concat(base).map((edge) => (
      Object.assign({}, edge, { i: (edge.i + i) % 6 })
    ))
  )))
}

function startGame (io, data) {
  console.log('GAME STARTED')
  const presets = getRotations([ { i: 0, offset: 0 }, { i: 1, offset: 0 }, { i: 2, offset: 0 }, { i: 3, offset: 0 }, { i: 4, offset: 0 } ], [ 1, 2, 3, 4, 5 ])
    .concat(getRotations([ { i: 0, offset: -175 }, { i: 1, offset: 175 }, { i: 2, offset: -175 }, { i: 3, offset: 175 }, { i: 4, offset: -175 }, { i: 5, offset: 175 } ], [1]))
    .concat(getRotations([ { i: 0, offset: 0 }, { i: 1, offset: 0 }, { i: 2, offset: 0 }, { i: 3, offset: 0 } ], [ 1, 2, 3, 4, 5 ]))
    // .concat(getRotations([ { i: 0, offset: 0 }, { i: 1, offset: 0 }, { i: 2, offset: 0 } ], [ 1, 2, 3, 4, 5 ])) // BORING
    // .concat(getRotations([ { i: 0, offset: 0 }, { i: 1, offset: 0 } ], [ 1, 2, 3, 4, 5 ])) // BORING
    // .concat(getRotations([ { i: 0, offset: 0 } ], [ 1, 2, 3, 4, 5 ])) // BORING
    .concat(getRotations([{ i: 1, offset: 0 }, { i: 2, offset: 0 }, { i: 4, offset: 0 }, { i: 5, offset: 0 }], [ 1, 2, 3, 4, 5 ]))
    .concat(getRotations([{ i: 0, offset: 0 }, { i: 1, offset: 0 }, { i: 2, offset: 0 }, { i: 4, offset: 0 }], [ 1, 2, 3, 4, 5 ]))
    .concat(getRotations([{ i: 0, offset: 0 }, { i: 1, offset: 0 }, { i: 3, offset: 0 }], [ 1, 2, 3, 4, 5 ]))
    .concat(getRotations([{ i: 0, offset: 0 }, { i: 1, offset: 0 }, { i: 4, offset: 0 }], [ 1, 2, 3, 4, 5 ]))
    .concat(getRotations([{ i: 0, offset: 0 }, { i: 2, offset: 0 }, { i: 4, offset: 0 }], [ 1, 2, 3, 4, 5 ]))
    .concat(getRotations([{ i: 0, offset: 0 }, { i: 3, offset: 0 }], [ 1, 2, 3, 4, 5 ]))
    .concat(getRotations([{ i: 0, offset: -175 }, { i: 1, offset: -175 }, { i: 3, offset: -175 }, { i: 4, offset: -175 }, { i: 1, offset: 175 }, { i: 2, offset: 175 }, { i: 4, offset: 175 }, { i: 5, offset: 175 }], [ 1, 2, 3, 4, 5 ]))
    .concat(getRotations([{ i: 0, offset: -175 }, { i: 1, offset: -175 }, { i: 3, offset: -175 }, { i: 4, offset: -175 }, { i: 2, offset: 175 }, { i: 3, offset: 175 }, { i: 5, offset: 175 }, { i: 0, offset: 175 }], [ 1, 2, 3, 4, 5 ]))
    .concat(getRotations([{ i: 0, offset: 200 }, { i: 1, offset: 150 }, { i: 2, offset: 100 }, { i: 3, offset: 50 }, { i: 4, offset: 0 }, { i: 5, offset: -50 }], [ 1, 2, 3, 4, 5 ]))
    .concat(getRotations([{ i: 0, offset: 200 }, { i: 1, offset: 150 }, { i: 2, offset: 100 }, { i: 3, offset: 50 }, { i: 4, offset: 0 }, { i: 5, offset: -50 }, { i: 0, offset: -100 }, { i: 1, offset: -150 }, { i: 2, offset: -200 }, { i: 3, offset: -250 }], [ 1, 2, 3, 4, 5 ]))
    .concat(getRotations([{ i: 5, offset: 200 }, { i: 4, offset: 150 }, { i: 3, offset: 100 }, { i: 2, offset: 50 }, { i: 1, offset: 0 }, { i: 0, offset: -50 }], [ 1, 2, 3, 4, 5 ]))
    .concat(getRotations([{ i: 5, offset: 200 }, { i: 4, offset: 150 }, { i: 3, offset: 100 }, { i: 2, offset: 50 }, { i: 1, offset: 0 }, { i: 0, offset: -50 }, { i: 5, offset: -100 }, { i: 4, offset: -150 }, { i: 3, offset: -200 }, { i: 2, offset: -250 }], [ 1, 2, 3, 4, 5 ]))

  const powerups = [
    'speedup',
    'audio',
    'limit',
    'multiplier',
    'epileptic',
    'swap',
    'steal',
    'invert'
  ]
  io.to(data.room).emit('game/start')
  return setInterval(() => {
    const selected = Math.floor(Math.random() * presets.length)
    io.to(data.room).emit('game/update/ring', {
      ring: presets[selected]
    })
    const sendPowerup = Math.floor(Math.random() * 100)
    if (sendPowerup > 50) {
      const selectedPow = Math.floor(Math.random() * powerups.length)
      io.to(data.room).emit('game/update/powerup', {
        powerup: powerups[selectedPow],
        rotation: Math.floor(Math.random() * 360)
      })
    }
  }, 1300)
}
