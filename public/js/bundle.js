/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "/";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(global) {const gameSettings = __webpack_require__(2)
const deathMessages = __webpack_require__(3)
const Player = __webpack_require__(4)
const Animations = __webpack_require__(5)
const controls = __webpack_require__(16)

const game = new Phaser.Game(gameSettings.width, gameSettings.height, Phaser.AUTO, '', { preload, create, update, render })
window.game = game
controls.add('left')
controls.add('right')
controls.add('restart')
controls.add('ready')

let text, showText, socket, player

window.onload = () => {
  document.body.addEventListener('keyup', __webpack_require__(8)(player))
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
  const fixedLength = (player.time.toString().split('.')[1] || '').length
  const timerText = showText(`${(player.time).toFixed(fixedLength < 2 ? fixedLength : 2)}s`, text.playerTime)
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

const animationState = __webpack_require__(9)
window.animationState = animationState

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
      ${Object.keys(window.gameState).length} Players <br>
      ${Object.keys(window.gameState).map((player) => (
        `<b style='color: #${window.gameState[player].alive ? window.gameState[player].color : '000000'}'>(${window.gameState[player].ready ? 'Ready' : 'Not ready'}) ${window.gameState[player].name} - ${window.gameState[player].time}`)).join('</b><br>'
      )}
    `
    if (animationState.groups.newRoundOverlay) {
      if (Object.keys(window.gameState).every((p) => window.gameState[p].ready) && animationState.groups.rings.children.length === 0) {
        showNewRoundText()
      } else {
        animationState.groups.newRoundOverlay.removeAll()
      }
    }
  })
  socket.on('game/update/ring', (data) => {
    const ring = createRing(data.ring)
    animationState.groups.rings.add(ring.graphic)
  })
  socket.on('game/update/powerup', (data) => {
    const powerup = createSprite('ff00ff', { offset: 0, special: { sprite: 'nug' } })
    powerup.anchor.set(0.5, 0.5)
    powerup.pivot.x = game.world.width * 2
    powerup.rotation = data.rotation * Math.PI / 180
    animationState.groups.powerups.add(powerup)
  })

  document.querySelector('#submit-name').onclick = (e) => {
    e.preventDefault()
    const name = document.querySelector('#user-name')
    const shape = document.querySelector('#user-shape')
    if (name.value.trim()) player.setName(name.value)
    if (shape.value) player.setShape(shape.value)
    name.value = ''
  }

  __webpack_require__(10)(game)
  game.animations = new Animations(game)
}

function create () {
  text = __webpack_require__(6)(game)
  showText = __webpack_require__(7)(game)
  game.stage.backgroundColor = '#333333'
  controls.setup('left', game.input.keyboard.addKey(Phaser.Keyboard.LEFT))
  controls.setup('right', game.input.keyboard.addKey(Phaser.Keyboard.RIGHT))
  controls.setup('restart', game.input.keyboard.addKey(Phaser.Keyboard.R))
  controls.setup('ready', game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR))
  game.world.pivot = new Phaser.Point((0, 0))
  game.world.rotation = 0
  Object.keys(animationState.groups).forEach((group) => {
    animationState.groups[group] = game.add.group()
  })
  animationState.music = game.add.audio('black_kitty')
  animationState.music.volume = 0.5
  game.sound.setDecodedCallback([ animationState.music ], () => {
    animationState.music.loopFull(1)
  }, this)
  createBackground()
}

function update () {
  if (controls.isDown('left')) player.rotate(-1)
  if (controls.isDown('right')) player.rotate(1)
  if (controls.isDown('ready')) player.setReady()
  if (controls.isDown('restart')) {
    player.restart()
    animationState.groups.emitter.removeAll()
    animationState.groups.deathOverlay.removeAll()
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
          player.die()
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
  const state = { distance: 800, layout: data, color: 0x444444, width }
  const polyData = batchPolys(state.layout, state.color, state.width, state.distance)
  const ring = { state, graphic: polyData.graphic, polys: polyData.polys }
  animationState.rings.push(ring)
  return ring
}

const hexCorner = __webpack_require__(14)
const createPoly = __webpack_require__(11)(Phaser, game, gameSettings, animationState)
const createPolyPartPoints = __webpack_require__(13)(game)

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

/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(1)))

/***/ }),
/* 1 */
/***/ (function(module, exports) {

var g;

// This works in non-strict mode
g = (function() {
	return this;
})();

try {
	// This works if eval is allowed (see CSP)
	g = g || Function("return this")() || (1,eval)("this");
} catch(e) {
	// This works if the window reference is available
	if(typeof window === "object")
		g = window;
}

// g can still be undefined, but nothing to do about it...
// We return undefined, instead of nothing here, so it's
// easier to handle this case. if(!global) { ...}

module.exports = g;


/***/ }),
/* 2 */
/***/ (function(module, exports) {

module.exports = {
  height: 1000,
  width: 1000,
  radius: 100,
  ringSpeed: 10,
  powerupSpeed: 1.5
}


/***/ }),
/* 3 */
/***/ (function(module, exports) {

module.exports = [
  'This is the end\nof the line!',
  'Oh hex! You\'re dead.',
  'You squared off\nand failed.',
  'It\'s all come\nfull circle',
  'Quick and to the point',
  'Doh!(decahedron)',
  'Don\'t get\nbent out of shape',
  'I don\'t have\nenough shape puns'
]


/***/ }),
/* 4 */
/***/ (function(module, exports) {

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
    this.birthday = undefined
    this.time = 0
    this.funeral = undefined
    this.heartbeat = this.beat()
    this.temporary = { special: {} }
    this.ready = false
  }

  setReady () {
    this.ready = true
    this.birthday = +(new Date())
    this.update()
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

  beat () {
    return setInterval(() => {
      const newTime = moment().diff(moment(this.birthday), 'seconds', true)
      this.time = newTime > 0 ? newTime : 0
      this.update()
    }, 100)
  }

  restart () {
    this.die()
    this.birthday = +(new Date())
    this.time = 0
    this.funeral = undefined
    this.alive = true
    this.rotation = 0
    this.heartbeat = this.beat()
    this.update()
  }

  die () {
    clearInterval(this.heartbeat)
    this.funeral = +(new Date())
    this.alive = false
    this.ready = false
    this.update()
  }

  update () {
    this.socket.emit('game/player/update', this.getState())
  }

  getState () {
    return {
      rotation: this.rotation,
      socket: this.socket.id,
      room: this.room,
      name: this.name,
      shape: this.shape,
      color: this.color,
      alive: this.alive,
      time: this.time,
      ready: this.ready
    }
  }
}

module.exports = Player


/***/ }),
/* 5 */
/***/ (function(module, exports) {

class Animations {
  constructor (game) {
    this.game = game
  }

  tweenTint (obj, startColor, endColor, time = 250, callback = null) {
    if (obj) {
      let colorBlend = { step: 0 }
      let colorTween = this.game.add.tween(colorBlend).to({ step: 100 }, time)
      colorTween.onUpdateCallback(() => {
        obj.tint = Phaser.Color.interpolateColor(startColor, endColor, 100, colorBlend.step)
      })
      obj.tint = startColor
      if (callback) {
        colorTween.onComplete.add(() => {
          callback()
        })
      }
      colorTween.start()
    }
  }
}

module.exports = Animations


/***/ }),
/* 6 */
/***/ (function(module, exports) {

module.exports = function createTextSettings (game) {
  return (
    { death: {
        fontSize: 60
      },
      reset: {
        y: game.world.centerY + 200
      },
      ready: {
        y: game.world.centerY + 250
      },
      newRound: {
        fontSize: 60
      },
      playerTime: {
        y: 75,
        fontSize: 30
      }
    }
  )
}


/***/ }),
/* 7 */
/***/ (function(module, exports) {

module.exports = function createRenderText (game) {
  return function renderText (textBody, options) {
    options = Object.assign({
      x: game.world.centerX,
      y: game.world.centerY,
      anchor: 0.5,
      font: 'Revalia',
      fontSize: 20,
      align: 'center',
      tint: animationState.background.tint,
      stroke: '#000000',
      strokeThickness: 2,
      shadow: [ 5, 5, 'rgba(0,0,0,0.5)', 5 ]
    }, options)
    const text = game.add.text(options.x, options.y, textBody)
    text.anchor.setTo(options.anchor)
    text.font = options.font
    text.fontSize = options.fontSize
    text.align = options.align
    if (options.tint) text.fill = `#${options.tint}`
    if (options.stroke) text.stroke = options.stroke
    if (options.strokeThickness) text.strokeThickness = options.strokeThickness
    if (options.shadow) text.setShadow.apply(text, options.shadow)
    return text
  }
}


/***/ }),
/* 8 */
/***/ (function(module, exports) {

module.exports = function createHandler (player) {
  return function handleCheatCodes (e) {
    this.word = this.word || ''
    if (!e.metaKey) this.word += e.key
    if (this.word.includes('nug') || this.word.includes('sket')) {
      if (this.word.includes('nug')) player.temporary = { special: { sprite: 'nug' } }
      else if (this.word.includes('sket')) player.temporary = { special: { sprite: 'wine' } }
      this.word = ''
    }
  }
}


/***/ }),
/* 9 */
/***/ (function(module, exports) {

module.exports = {
  players: {},
  background: { tint: randomColor({ luminosity: 'bright' }).replace('#', '') },
  rings: [],
  groups: {
    background: undefined,
    rings: undefined,
    players: undefined,
    player: undefined,
    powerups: undefined,
    emitter: undefined,
    deathOverlay: undefined,
    readyOverlay: undefined,
    newRoundOverlay: undefined,
    hud: undefined,
    settings: undefined
  },
  music: undefined
}


/***/ }),
/* 10 */
/***/ (function(module, exports) {

module.exports = function loadAssets (game) {
  game.load.image('heart', '/public/imgs/heart.gif')
  game.load.image('wine', '/public/imgs/wine.png')
  game.load.image('nug', '/public/imgs/nug.png')
  game.load.spritesheet('balls', '/public/imgs/balls.png', 17, 17)
  game.load.audio('black_kitty', '/public/music/black_kitty.mp3')
  game.load.script('webfont', '//ajax.googleapis.com/ajax/libs/webfont/1.4.7/webfont.js')
}


/***/ }),
/* 11 */
/***/ (function(module, exports, __webpack_require__) {

const hexCorner = __webpack_require__(14)

module.exports = function createFunc (Phaser, game, gameSettings, animationState) {
  return function createPoly (i, color) {
    const next = (i + 1) % 6
    const points = [{ x: game.world.centerX, y: game.world.centerY }]
    points.push(hexCorner(points[0], gameSettings.width, i))
    points.push(hexCorner(points[0], gameSettings.width, next))
    const poly = new Phaser.Polygon(points)
    const graphics = game.add.graphics(0, 0)
    graphics.beginFill(color)
    graphics.drawPolygon(poly.points)
    graphics.endFill()
    graphics.tint = `0x${animationState.background.tint}`
    return graphics
  }
}


/***/ }),
/* 12 */,
/* 13 */
/***/ (function(module, exports, __webpack_require__) {

const hexCorner = __webpack_require__(14)

module.exports = function createFunc (game) {
  return function createPolyPartPoints (i, width, distance) {
    const next = (i + 1) % 6
    const points = []
    points.push(hexCorner({ x: game.world.centerX, y: game.world.centerY }, distance, i))
    points.push(hexCorner({ x: game.world.centerX, y: game.world.centerY }, distance, next))
    points.push(hexCorner({ x: game.world.centerX, y: game.world.centerY }, distance + width, next))
    points.push(hexCorner({ x: game.world.centerX, y: game.world.centerY }, distance + width, i))
    return points
  }
}


/***/ }),
/* 14 */
/***/ (function(module, exports) {

module.exports = function hexCorner (c, s, i) {
  const degree = 60 * i + 30
  const rad = Math.PI / 180 * degree
  const x = c.x + s * Math.cos(rad)
  const y = c.y + s * Math.sin(rad)
  return { x, y }
}


/***/ }),
/* 15 */,
/* 16 */
/***/ (function(module, exports) {

const controls = {}

module.exports = {
  add, setup, isDown
}

function add (control) {
  controls[control] = {}
}

function setup (control, key) {
  controls[control] = key
}

function isDown (control) {
  return controls[control].isDown
}


/***/ })
/******/ ]);