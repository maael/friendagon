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

let animationState = { players: {}, rings: [], groups: { top: undefined, players: undefined, rings: undefined, background: undefined } }

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
  game.world.pivot = new Phaser.Point((0, 0))
  game.world.rotation = 0
  animationState.groups.top = game.add.group()
  animationState.groups.players = game.add.group()
  animationState.groups.rings = game.add.group()
  animationState.groups.background = game.add.group()
  createBackground()
  game.debug.geom(new Phaser.Point((gameSettings.width / 2), (gameSettings.height / 2)), '#ffff00')
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

        animationState.players[playerId].tint = `0x${window.gameState[playerId].color}`
        animationState.players[playerId].pivot.x = gameSettings.radius
        animationState.players[playerId].anchor.set(0.5)
        animationState.groups.players.add(animationState.players[playerId])
      } else {
        animationState.players[playerId].tint = `0x${window.gameState[playerId].color}`
        animationState.players[playerId].rotation = window.gameState[playerId].rotation * Math.PI / 180
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
    ring.state.distance = ring.state.distance - 5 > 0 ? ring.state.distance - 5 : 0
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
  if (animationState.rings.length < 2 && (!animationState.rings[animationState.rings.length - 1] || animationState.rings[animationState.rings.length - 1].state.distance < 500)) {
    const ring = createRing()
    animationState.groups.rings.add(ring.graphic)
  }

  game.world.bringToTop(animationState.groups.background)
  game.world.bringToTop(animationState.groups.rings)
  game.world.bringToTop(animationState.groups.players)
  game.world.bringToTop(animationState.groups.top)

  if (animationState.player) {
    animationState.rings.forEach((ring) => {
      ring.polys.forEach((poly) => {
        if (poly.contains(animationState.player.worldPosition.x, animationState.player.worldPosition.y)) {
          animationState.player.destroy()
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
  animationState.groups.background.add(createPoly(0, 0xFF33FF))
  animationState.groups.background.add(createPoly(1, 0xFFFFFF))
  animationState.groups.background.add(createPoly(2, 0xFF33FF))
  animationState.groups.background.add(createPoly(3, 0xFFFFFF))
  animationState.groups.background.add(createPoly(4, 0xFF33FF))
  animationState.groups.background.add(createPoly(5, 0xFFFFFF))
}

function createRing () {
  const presets = [
    [ 0, 1, 2, 3, 4 ],
    [ 0, 1, 2, 3, 5 ],
    [ 0, 1, 2, 4, 5 ],
    [ 0, 1, 3, 4, 5 ],
    [ 0, 2, 3, 4, 5 ],
    [ 1, 2, 3, 4, 5 ]
  ]
  const selected = Math.floor(Math.random() * presets.length)
  const state = { distance: 800, indexes: presets[selected], color: 0x000000, width: 20 }
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
  if (i % 2 === 1) graphics.tint = 0xFF3333
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
  if (i % 2 === 1) graphics.tint = 0xFF3333
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
  graphics.endFill()
  return { polys, graphic: graphics }
}
