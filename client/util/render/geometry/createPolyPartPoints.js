const hexCorner = require('./hexCorner')

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
