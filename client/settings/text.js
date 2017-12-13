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
