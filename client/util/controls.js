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
