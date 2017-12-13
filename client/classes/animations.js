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
