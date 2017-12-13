module.exports = function createRenderText (game, animationState) {
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
