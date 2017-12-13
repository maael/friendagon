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
