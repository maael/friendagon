const gameSettings = {
  height: 1000,
  width: 1000,
  radius: 50
}

const game = new Phaser.Game(gameSettings.width, gameSettings.height, Phaser.AUTO, '', { preload: preload, create: create, update: update })

const controls = {
  left: {},
  right: {}
}

class Player {
  constructor (socket, room) {
    this.rotation = 0
    this.speed = 10
    this.socket = socket
    this.room = room
    this.shape = undefined
    this.name = '?????'
    this.color = 'FFFFFF'
  }

  setName (name) {
    this.name = name.trim()
    document.querySelector('#user-name').setAttribute('placeholder', this.name)
    this.update()
  }

  setShape (shape) {
    this.shape = shape
    document.querySelector('#user-shape').value = shape
    this.update()
  }

  setColor (color) {
    this.color = color
    this.update()
  }

  rotate (rotation) {
    this.rotation = (this.rotation + (rotation * this.speed)) % 360
    this.update()
  }

  update () {
    this.socket.emit('game/player/update', this.getState())
  }

  getState () {
    return { rotation: this.rotation, socket: this.socket.id, room: this.room, name: this.name, shape: this.shape, color: this.color }
  }
}

let socket, player;

let animationState = { players: {} }

function preload () {
  socket = io.connect()
  const room = window.location.pathname.split('/').pop()
  player = new Player(socket, room)

  socket.emit('room/join', { room: room })
  socket.on('player/name', (data) => {
    player.setName(data.name)
    player.setShape(data.shape)
    player.setColor(data.color)
  })
  socket.on('room/change', (data) => {
    console.log('change!', data)
  })
  socket.on('game/update', (data) => {
    window.gameState = data
    document.querySelector('#game-state').innerHTML = `
      ${Object.keys(gameState).length} Players <br>
      ${Object.keys(gameState).map((player) => (`<span style='color: #${gameState[player].color}'>(${gameState[player].shape || '?????'}) ${gameState[player].name}`)).join('</span><br>')}
    `
  })

  document.querySelector('#submit-name').onclick = (e) => {
    e.preventDefault()
    const name = document.querySelector('#user-name')
    const shape = document.querySelector('#user-shape')
    if (name.value.trim()) player.setName(name.value)
    if (shape.value) player.setShape(shape.value)
    name.value = ''
  }

  game.load.image('heart', '/public/imgs/heart.gif')
}

function create() {
  game.stage.backgroundColor = '#333333'
  controls.left = game.input.keyboard.addKey(Phaser.Keyboard.LEFT)
  controls.right = game.input.keyboard.addKey(Phaser.Keyboard.RIGHT)
}

function update() {
  if (controls.left.isDown) {
    player.rotate(-1)
  }
  if (controls.right.isDown) {
    player.rotate(1)
  }

  Object.keys(window.gameState || {}).forEach((playerId) => {
    if (playerId !== player.socket.id) {
      if (!animationState.players[playerId]) {
        animationState.players[playerId] = createSprite(window.gameState[playerId].color)
        animationState.players[playerId].anchor.setTo(0.5)
        animationState.players[playerId].tint = `0x${window.gameState[playerId].color}`
        animationState.players[playerId].pivot.x = gameSettings.radius
        animationState.players[playerId].pivot.y = gameSettings.radius
      } else {
        animationState.players[playerId].tint = `0x${window.gameState[playerId].color}`
        animationState.players[playerId].rotation = window.gameState[playerId].rotation * Math.PI / 180
      }
    } else {
      if (!animationState.player) {
        animationState.player = createSprite(player.color)
        animationState.player.anchor.setTo(0.5)
        animationState.player.tint = `0x${player.color}`
        animationState.player.pivot.x = gameSettings.radius
        animationState.player.pivot.y = gameSettings.radius
      } else {
        animationState.player.tint = `0x${player.color}`
        animationState.player.rotation = player.rotation * Math.PI / 180
      }
    }
  })

  Object.keys(animationState.players).forEach((playerId) => {
    if (!Object.keys(window.gameState || {}).includes(playerId)) {
      animationState.players[playerId].destroy()
      delete animationState.players[playerId]
    }
  })
}

function createSprite (color) {
  const graphic = createGraphic(color)
  const sprite = game.add.sprite((gameSettings.width / 2), (gameSettings.height / 2), graphic.generateTexture())
  graphic.destroy()
  return sprite
}

function createGraphic (color) {
  const graphics = game.add.graphics(0, 0)
  graphics.beginFill(`0x${color}`)
  graphics.lineStyle(10, `0x${color}`, 1)
  graphics.moveTo(10, 10)
  graphics.lineTo(20, 10)
  graphics.lineTo(20, 20)
  graphics.lineTo(10, 20)
  graphics.endFill()
  return graphics
}
