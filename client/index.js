const gameSettings = require('./settings/game')
const deathMessages = require('./settings/deathMessages')
const Player = require('./classes/player')
const Animations = require('./classes/animations')
const controls = require('./util/controls')

const game = new Phaser.Game(gameSettings.width, gameSettings.height, Phaser.AUTO, '', { preload, create, update, render })
window.game = game
window.gameState = {}
controls.add('left')
controls.add('right')
controls.add('restart')
controls.add('ready')
controls.add('settings')

let text, showText, socket, player, gameStart

window.onload = () => {
  document.body.addEventListener('keyup', require('./interaction/cheatcode')(player))
}

global.WebFontConfig = {
  google: {
    families: ['Revalia']
  }
}

function showDeathText () {
  const deathIndex = Math.floor(Math.random() * deathMessages.length)
  const deathText = showText(`- You're dead -\n${deathMessages[deathIndex]}`, text.death)
  const resetText = showText('Press r to revive', text.reset)
  animationState.groups.deathOverlay.add(deathText)
  animationState.groups.deathOverlay.add(resetText)
}

function showReadyText () {
  const readyText = showText('Press space to ready up\nThe game will start\nas soon as everyone is ready', text.ready)
  animationState.groups.readyOverlay.add(readyText)
}

function showPlayerTimer () {
  let time = player.funeral && player.birthday ? moment(player.funeral).diff(moment(player.birthday), 'seconds', true) : 0
  if (gameStart) {
    time = (player.funeral ? moment(player.funeral) : moment()).diff(moment(player.birthday), 'seconds', true)
  }
  const fixedLength = (time.toString().split('.')[1] || '').length
  const timerText = showText(`${(time).toFixed(fixedLength < 2 ? fixedLength : 2)}s`, text.playerTime)
  // const nameText = showText(player.name, {
  //   y: 35,
  //   fontSize: 25
  // })
  animationState.groups.hud.add(timerText)
}

function showNewRoundText () {
  const newRoundText = showText('The round is starting!', text.newRound)
  animationState.groups.newRoundOverlay.add(newRoundText)
}

const animationState = require('./settings/animationState')
window.animationState = animationState

function confirmUpdate (data) {
  const inTime = true // moment.utc(data.t).isAfter(moment.utc().subtract(2, 'seconds'), 'second')
  const visible = !document.hidden
  if (!inTime || !visible) {
    console.warn('Rejected', 'game/update', 'due to', !inTime ? `outdated update (${data.t})` : '', !visible ? 'not visible' : '')
  }
  delete data.t
  return inTime && visible
}

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
    if (confirmUpdate(data)) {
      window.gameState = data
      document.querySelector('#game-state').innerHTML = `
        ${Object.keys(window.gameState).length} Players <br>
        ${Object.keys(window.gameState).map((player) => (
          `<b style='color: #${window.gameState[player].alive ? window.gameState[player].color : '000000'}'>(${window.gameState[player].ready ? 'Ready' : 'Not ready'}) ${window.gameState[player].name}`)).join('</b><br>'
        )}
      `
      if (animationState.groups.newRoundOverlay) {
        if (Object.keys(window.gameState).every((p) => window.gameState[p].ready) && animationState.groups.rings.children.length === 0) {
          showNewRoundText()
        } else {
          animationState.groups.newRoundOverlay.removeAll()
        }
      }
    }
  })
  socket.on('game/update/ring', (data) => {
    if (confirmUpdate(data)) {
      const ring = createRing(data.ring)
      animationState.groups.rings.add(ring.graphic)
    }
  })
  socket.on('game/update/powerup', (data) => {
    const powerupSpriteMap = {
      speedup: 'powerup_speedup',
      multiplier: 'powerup_multipler',
      epileptic: 'powerup_epileptic',
      invert: 'powerup_invert'
    }
    const type = data.powerup
    const sprite = powerupSpriteMap[type] || 'nug'
    const powerup = createSprite('ff00ff', { offset: 0, special: { sprite } })
    if (sprite !== 'nug') {
      powerup.scale.setTo(0.3, 0.3)
      powerup.tint = `0x${animationState.background.tint}`
    }
    powerup.anchor.set(0.5, 0.5)
    powerup.pivot.x = game.world.width * 2
    powerup.rotation = data.rotation * Math.PI / 180
    animationState.groups.powerups.add(powerup)
  })
  socket.on('game/start', (data) => {
    gameStart = +(new Date())
  })
  socket.on('game/player/powerup/use', (data) => {
    if (socket.id !== data.activedBy) {
      console.log('activing powerup', data)
    } else {
      console.log('we did this')
    }
  })

  document.querySelector('#submit-name').onclick = (e) => {
    e.preventDefault()
    const name = document.querySelector('#user-name')
    const shape = document.querySelector('#user-shape')
    if (name.value.trim()) player.setName(name.value)
    if (shape.value) player.setShape(shape.value)
    name.value = ''
  }

  require('./util/load/assets')(game)
  game.animations = new Animations(game)
  animationState.ui = game.plugins.add(Phaser.Plugin.SlickUI)
  animationState.ui.load('/public/js/kenney-theme/kenney.json')
  // game.debug.geom(new Phaser.Point((game.world.centerX), (game.world.centerY)), '#ffff00')
}

function create () {
  text = require('./settings/text')(game, animationState)
  showText = require('./util/render/text')(game, animationState)
  game.stage.backgroundColor = '#333333'
  controls.setup('left', game.input.keyboard.addKey(Phaser.Keyboard.LEFT))
  controls.setup('right', game.input.keyboard.addKey(Phaser.Keyboard.RIGHT))
  controls.setup('restart', game.input.keyboard.addKey(Phaser.Keyboard.R))
  controls.setup('ready', game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR))
  controls.setup('settings', game.input.keyboard.addKey(Phaser.Keyboard.S))
  game.world.pivot = new Phaser.Point((0, 0))
  game.world.rotation = 0
  Object.keys(animationState.groups).forEach((group) => {
    animationState.groups[group] = game.add.group()
  })
  animationState.music = game.add.audio('black_kitty')
  game.sound.setDecodedCallback([ animationState.music ], () => {
    animationState.music.loopFull(1)
    animationState.music.volume = 0.1
  }, this)
  createBackground()
}

function renderSettings () {
  animationState.ui.container.children.forEach((child) => animationState.ui.container.remove(child))
  animationState.groups.settings && animationState.groups.settings.removeAll()
  const panel = new SlickUI.Element.Panel(game.width * 0.25, game.height * 0.15, game.width - (game.width * 0.5), game.height - (game.height * 0.3))
  animationState.ui.add(panel)
  const volumeSlider = new SlickUI.Element.Slider(16, 100, panel.width - 32, animationState.music.volume)
  const saveButton = new SlickUI.Element.Button((panel.width / 2 - 50), (panel.height - 60), 100, 40)
  panel.add(saveButton)
  saveButton.add(new SlickUI.Element.Text(0, 0, 'Save')).center()
  saveButton.events.onInputUp.add(() => {
    animationState.ui.container.remove(panel)
    animationState.groups.settings && animationState.groups.settings.removeAll()
  })
  panel.add(volumeSlider)
  panel.add(new SlickUI.Element.Text(10, 10, 'Settings')).centerHorizontally().text.alpha = 0.75
  panel.add(new SlickUI.Element.Text(10, 60, 'Volume')).centerHorizontally().text.alpha = 0.7
  panel.add(new SlickUI.Element.Text(10, 60 + (game.height * 0.14), 'Player Shape')).centerHorizontally().text.alpha = 0.7
  panel.add(new SlickUI.Element.Text(10, 60 + (game.height * 0.28), 'Player Colour')).centerHorizontally().text.alpha = 0.7
  panel.add(new SlickUI.Element.Text(10, 60 + (game.height * 0.42), 'Player Name')).centerHorizontally().text.alpha = 0.7
  volumeSlider.onDrag.add((value) => { animationState.music.volume = value })
  animationState.groups.settings = animationState.ui.container.displayGroup
  game.world.bringToTop(animationState.groups.settings)
}

function renderPlayersDetails () {
  animationState.groups.playerDetails.removeAll()
  Object.keys(window.gameState).forEach((player, i, players) => (
    renderPlayerDetails(window.gameState[player], i, players)
  ))
}

function renderPlayerDetails (player, i, players) {
  const spacing = 90
  const left = game.height / (40 + (players.length * spacing)) > 1
  const playerText = showText(`${player.name}`, {
    x: left ? 160 : game.width - 160,
    y: 40 + (i * spacing)
  })
  const playerTimeText = showText(`Ready: ${player.ready ? '✓' : '✖'}`, {
    x: left ? 160 : game.width - 160,
    y: 70 + (i * spacing)
  })
  animationState.groups.playerDetails.add(playerText)
  animationState.groups.playerDetails.add(playerTimeText)
}

function update () {
  if (controls.isDown('left')) player.rotate(-1)
  if (controls.isDown('right')) player.rotate(1)
  if (controls.isDown('ready') && player.alive) player.setReady()
  if (controls.isDown('restart')) {
    player.restart()
    animationState.groups.emitter.removeAll()
    animationState.groups.deathOverlay.removeAll()
  }

  if (controls.isDown('settings')) {
    renderSettings()
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
        if (animationState.players[playerId]) {
          animationState.players[playerId].destroy()
          animationState.groups.players.remove(animationState.players[playerId])
          delete animationState.players[playerId]
        }
      }
    } else {
      if (player.alive) {
        if (!animationState.player || !animationState.player.alive) {
          animationState.player = createSprite(player.color, player.temporary)
          if (!player.temporary.special.sprite) animationState.player.tint = `0x${player.color}`
          animationState.player.pivot.x = gameSettings.radius
          animationState.player.anchor.set(0.5)
          animationState.groups.player.add(animationState.player)
        } else {
          if (!player.temporary.special.sprite) animationState.player.tint = `0x${player.color}`
          animationState.player.rotation = player.rotation * Math.PI / 180
        }
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
    const largestOffset = ring.state.layout.reduce((max, poly) => Math.max(max, poly.offset), 0)
    ring.state.distance = (ring.state.distance - gameSettings.ringSpeed) + largestOffset > 0 ? ring.state.distance - gameSettings.ringSpeed : 0
    if ((ring.state.distance + largestOffset) > gameSettings.ringSpeed) {
      const polyData = batchPolys(ring.state.layout, ring.state.color, ring.state.width, ring.state.distance)
      ring.graphic = polyData.graphic
      ring.polys = polyData.polys
      animationState.groups.rings.add(ring.graphic)
    }
    if ((ring.state.distance + largestOffset) <= gameSettings.ringSpeed) {
      rings.splice(i, 1)
      return rings
    }
    return rings
  }, [].concat(animationState.rings))

  animationState.groups.powerups.children.forEach((powerup) => {
    powerup.pivot.x = powerup.pivot.x - (gameSettings.ringSpeed * gameSettings.powerupSpeed)
    if (powerup.pivot.x <= 0) {
      powerup.destroy()
      animationState.groups.powerups.remove(powerup)
    }
  })

  Object.keys(animationState.groups).forEach((group) => {
    game.world.bringToTop(animationState.groups[group])
  })

  if (animationState.player) {
    animationState.rings.forEach((ring) => {
      ring.polys.forEach((poly) => {
        if (poly.contains(animationState.player.worldPosition.x, animationState.player.worldPosition.y)) {
          death()
          animationState.player.destroy()
          if (player.alive) player.die()
        }
      })
    })

    animationState.groups.powerups.children.forEach((powerup) => {
      if (powerup.getBounds().contains(animationState.player.worldPosition.x, animationState.player.worldPosition.y)) {
        socket.emit('game/player/powerup', { powerup: powerup.key })
        powerup.destroy()
        animationState.groups.powerups.remove(powerup)
      }
    })

    if (!player.ready && player.alive) {
      if (animationState.groups.readyOverlay.children.length === 0) showReadyText()
    } else {
      if (animationState.groups.readyOverlay.children.length !== 0) {
        animationState.groups.readyOverlay.removeAll()
      }
    }

    animationState.groups.hud.removeAll()
    showPlayerTimer()
  }
}

function render () {
  renderPlayersDetails()
}

function createSprite (color, options) {
  options = Object.assign({ offset: 0, special: {} }, options)
  let playerImage
  if (options.special.sprite) {
    playerImage = options.special.sprite
  } else {
    const graphic = createGraphic(color)
    playerImage = graphic.generateTexture()
    graphic.destroy()
  }
  const sprite = game.add.sprite(game.world.centerX - (options.offset), game.world.centerY - (options.offset), playerImage)
  if (options.special.sprite === 'nug') sprite.scale.setTo(0.25, 0.25)
  else if (options.special.sprite === 'wine') sprite.scale.setTo(0.1, 0.1)
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
  animateBackground()

  function animateBackground () {
    setInterval(() => {
      const newTint = randomColor({ luminosity: 'bright' }).replace('#', '')
      animationState.groups.background.children.forEach((b) => {
        game.animations.tweenTint(b, `0x${animationState.background.tint}`, `0x${newTint}`, 1000, () => {
          animationState.background.tint = newTint
        })
      })
    }, 10000)
  }
}

function createRing (data) {
  const width = 20 + Math.floor(Math.random() * 100)
  const state = { distance: Math.max(gameSettings.width, gameSettings.height), layout: data, color: 0x444444, width }
  const polyData = batchPolys(state.layout, state.color, state.width, state.distance)
  const ring = { state, graphic: polyData.graphic, polys: polyData.polys }
  animationState.rings.push(ring)
  return ring
}

const createPoly = require('./util/render/geometry/createPoly')(Phaser, game, animationState)
const createPolyPartPoints = require('./util/render/geometry/createPolyPartPoints')(game)

function batchPolys (layout, color, width, distance) {
  const graphics = game.add.graphics(0, 0)
  const polys = []
  graphics.beginFill(color)
  layout.forEach((ring) => {
    if (distance + ring.offset >= 0) {
      const ppoints = createPolyPartPoints(ring.i, width, distance + ring.offset)
      const poly = new Phaser.Polygon(ppoints)
      polys.push(poly)
      graphics.drawPolygon(poly.points)
    }
  })
  graphics.tint = `0x${animationState.background.tint}`
  graphics.endFill()
  return { polys, graphic: graphics }
}

function death () {
  gameStart = undefined
  if (animationState.groups.emitter.children.length === 0) {
    const emitter = game.add.emitter(animationState.player.worldPosition.x, animationState.player.worldPosition.y, 100)
    emitter.makeParticles('balls', [0, 1, 2, 3, 4, 5])
    emitter.minParticleSpeed.setTo(-400, -400)
    emitter.maxParticleSpeed.setTo(400, 400)
    emitter.gravity = 0
    emitter.start(true, 0, undefined, 2000)
    animationState.groups.emitter.add(emitter)
  }
  if (animationState.groups.deathOverlay.children.length === 0) {
    showDeathText()
  }
}
