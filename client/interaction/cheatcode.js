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
