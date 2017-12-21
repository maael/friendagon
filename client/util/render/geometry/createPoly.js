const hexCorner = require('./hexCorner')

module.exports = function createFunc (Phaser, game, animationState) {
  return function createPoly (i, color) {
    const next = (i + 1) % 6
    const points = [{ x: game.world.centerX, y: game.world.centerY }]
    points.push(hexCorner(points[0], Math.max(game.width, game.height), i))
    points.push(hexCorner(points[0], Math.max(game.width, game.height), next))
    const poly = new Phaser.Polygon(points)
    const graphics = game.add.graphics(0, 0)
    graphics.beginFill(color)
    graphics.drawPolygon(poly.points)
    graphics.endFill()
    graphics.tint = `0x${animationState.background.tint}`
    return graphics
  }
}
