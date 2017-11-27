const gameSettings = {
  height: 1000,
  width: 1000,
  radius: 100
}

const game = new Phaser.Game(gameSettings.width, gameSettings.height, Phaser.AUTO, '', { preload, create, update, render })

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
    this.alive = true
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

  die () {
    this.alive = false
    this.update()
  }

  update () {
    this.socket.emit('game/player/update', this.getState())
  }

  getState () {
    return { rotation: this.rotation, socket: this.socket.id, room: this.room, name: this.name, shape: this.shape, color: this.color, alive: this.alive }
  }
}

let socket, player;

let animationState = { players: {}, background: { tint: randomColor({ luminosity: 'bright' }).replace('#', '') }, rings: [], groups: { top: undefined, players: undefined, rings: undefined, background: undefined, emitter: undefined }, music: undefined }

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
  socket.on('game/update/ring', (data) => {
    const ring = createRing(data.ring)
    animationState.groups.rings.add(ring.graphic)
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
  game.load.spritesheet('balls', '/public/imgs/balls.png', 17, 17)
  game.load.audio('black_kitty', '/public/music/black_kitty.mp3')
}

function create() {
  game.stage.backgroundColor = '#333333'
  controls.left = game.input.keyboard.addKey(Phaser.Keyboard.LEFT)
  controls.right = game.input.keyboard.addKey(Phaser.Keyboard.RIGHT)
  game.world.pivot = new Phaser.Point((0, 0))
  game.world.rotation = 0
  animationState.groups.emitter = game.add.group()
  animationState.groups.top = game.add.group()
  animationState.groups.players = game.add.group()
  animationState.groups.rings = game.add.group()
  animationState.groups.background = game.add.group()
  animationState.music = game.add.audio('black_kitty')
  game.sound.setDecodedCallback([ animationState.music ], () => {
    animationState.music.loopFull(1)
  }, this)
  createBackground()
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
      if (window.gameState[playerId].alive) {
        if (!animationState.players[playerId]) {
          animationState.players[playerId] = createSprite(window.gameState[playerId].color)

          animationState.players[playerId].tint = `0x${window.gameState[playerId].color}`
          animationState.players[playerId].pivot.x = gameSettings.radius
          animationState.players[playerId].anchor.set(0.5)
          animationState.groups.players.add(animationState.players[playerId])
        } else {
          animationState.players[playerId].tint = `0x${window.gameState[playerId].color}`
          animationState.players[playerId].rotation = window.gameState[playerId].rotation * Math.PI / 180
        }
      } else {
        if (animationState.players[playerId]) animationState.players[playerId].destroy()
      }
    } else {
      if (!animationState.player) {
        animationState.player = createSprite(player.color)
        animationState.player.tint = `0x${player.color}`
        animationState.player.pivot.x = gameSettings.radius
        animationState.player.anchor.set(0.5)
        animationState.groups.top.add(animationState.player)
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
  animationState.rings = animationState.rings.reduce((rings, ring, i) => {
    ring.graphic.destroy()
    ring.state.distance = ring.state.distance - 10 > 0 ? ring.state.distance - 10 : 0
    if (ring.state.distance !== 0) {
      const polyData = batchPolys(ring.state.indexes, ring.state.color, ring.state.width, ring.state.distance)
      ring.graphic = polyData.graphic
      ring.polys = polyData.polys
      animationState.groups.rings.add(ring.graphic)
    }
    if (ring.state.distance === 0) {
      rings.splice(i, 1)
      return rings
    }
    return rings
  }, [].concat(animationState.rings))

  game.world.bringToTop(animationState.groups.background)
  game.world.bringToTop(animationState.groups.rings)
  game.world.bringToTop(animationState.groups.players)
  game.world.bringToTop(animationState.groups.top)
  game.world.bringToTop(animationState.groups.emitter)

  if (animationState.player) {
    animationState.rings.forEach((ring) => {
      ring.polys.forEach((poly) => {
        if (poly.contains(animationState.player.worldPosition.x, animationState.player.worldPosition.y)) {
          death()
          animationState.player.destroy()
          player.die()
        }
      })
    })
  }
}

function render () {

}

function createSprite (color, options) {
  options = options || { offset: 0 }
  const graphic = createGraphic(color)
  const sprite = game.add.sprite(game.world.centerX - (options.offset), game.world.centerY - (options.offset), graphic.generateTexture())
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

function createBackground () {
  animationState.groups.background.add(createPoly(0, 0xAAAAAA))
  animationState.groups.background.add(createPoly(1, 0xFFFFFF))
  animationState.groups.background.add(createPoly(2, 0xAAAAAA))
  animationState.groups.background.add(createPoly(3, 0xFFFFFF))
  animationState.groups.background.add(createPoly(4, 0xAAAAAA))
  animationState.groups.background.add(createPoly(5, 0xFFFFFF))
}

function createRing (data) {
  const width = 20 + Math.floor(Math.random() * 100)
  const state = { distance: 800, indexes: data, color: 0x444444, width }
  const polyData = batchPolys(state.indexes, state.color, state.width, state.distance)
  const ring = { state, graphic: polyData.graphic, polys: polyData.polys }
  animationState.rings.push(ring)
  return ring
}

function hex_corner (c, s, i) {
  const degree = 60 * i + 30
  const rad = Math.PI / 180 * degree
  const x = c.x + s * Math.cos(rad)
  const y = c.y + s * Math.sin(rad)
  return { x, y }
}

function createPoly (i, color) {
  const next = (i + 1) % 6
  const points = [{ x: game.world.centerX, y: game.world.centerY }]
  points.push(hex_corner(points[0], gameSettings.width, i))
  points.push(hex_corner(points[0], gameSettings.width, next))
  const poly = new Phaser.Polygon(points)
  const graphics = game.add.graphics(0, 0)
  graphics.beginFill(color)
  graphics.drawPolygon(poly.points)
  graphics.endFill()
  graphics.tint = `0x${animationState.background.tint}`
  return graphics
}

function createPolyPartPoints (i, width, distance) {
  const next = (i + 1) % 6
  const points = []
  points.push(hex_corner({ x: game.world.centerX, y: game.world.centerY }, distance, i))
  points.push(hex_corner({ x: game.world.centerX, y: game.world.centerY }, distance, next))
  points.push(hex_corner({ x: game.world.centerX, y: game.world.centerY }, distance + width, next))
  points.push(hex_corner({ x: game.world.centerX, y: game.world.centerY }, distance + width, i))
  return points
}

function createPolyPart (i, color, width, distance) {
  const points = createPolyPartPoints(i, width, distance)
  const poly = new Phaser.Polygon(points)
  const graphics = game.add.graphics(0, 0)
  graphics.beginFill(color)
  graphics.drawPolygon(poly.points)
  graphics.endFill()
  if (i % 2 === 1) graphics.tint = animationState.background.tint
  return graphics
}

function batchPolys (indexes, color, width, distance) {
  const graphics = game.add.graphics(0, 0)
  const polys = []
  graphics.beginFill(color)
  indexes.forEach((i) => {
    const ppoints = createPolyPartPoints(i, width, distance)
    const poly = new Phaser.Polygon(ppoints)
    polys.push(poly)
    graphics.drawPolygon(poly.points)
  })
  graphics.tint = `0x${animationState.background.tint}`
  graphics.endFill()
  return { polys, graphic: graphics }
}

function death () {
  if (animationState.groups.emitter.children.length === 0) {
    const emitter = game.add.emitter(animationState.player.worldPosition.x, animationState.player.worldPosition.y, 100)
    emitter.makeParticles('balls', [0, 1, 2, 3, 4, 5])
    emitter.minParticleSpeed.setTo(-400, -400)
    emitter.maxParticleSpeed.setTo(400, 400)
    emitter.gravity = 0
    emitter.start(true, 0, undefined, 2000)
    animationState.groups.emitter.add(emitter)
  }
}
