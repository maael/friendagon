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
