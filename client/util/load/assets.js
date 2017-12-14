module.exports = function loadAssets (game) {
  game.load.image('heart', '/public/imgs/heart.gif')
  game.load.image('wine', '/public/imgs/wine.png')
  game.load.image('nug', '/public/imgs/nug.png')
  game.load.image('powerup_epileptic', '/public/imgs/powerups/epileptic.png')
  game.load.image('powerup_invert', '/public/imgs/powerups/invert.png')
  game.load.image('powerup_multipler', '/public/imgs/powerups/multipler.png')
  game.load.image('powerup_speedup', '/public/imgs/powerups/speedup.png')
  game.load.spritesheet('balls', '/public/imgs/balls.png', 17, 17)
  game.load.audio('black_kitty', '/public/music/black_kitty.mp3')
  game.load.script('webfont', '//ajax.googleapis.com/ajax/libs/webfont/1.4.7/webfont.js')
}
