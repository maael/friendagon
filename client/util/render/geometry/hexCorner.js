module.exports = function hexCorner (c, s, i) {
  const degree = 60 * i + 30
  const rad = Math.PI / 180 * degree
  const x = c.x + s * Math.cos(rad)
  const y = c.y + s * Math.sin(rad)
  return { x, y }
}
