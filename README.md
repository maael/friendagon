<p align="center">
  <img src="../master/assets/friendagon.png?raw=true" alt="Friendagon"/>
</p>
<hr />

<p align="center">
  <img src="../master/assets/dead.jpg?raw=true" alt="Friendagon Dead Screen"/>
</p>

An attempt to recreate [Super Hexagon](https://www.superhexagon.com/) in [phaser.io](http://phaser.io/), with support for multiplayer via [socket.io](https://socket.io/).

## :zap: Overview

At the moment, each client independently manages a player state - though this player state isn't used in rendering. Instead, player interactions make updates to this state, and updates are broadcast to the server, which then updates the overall state for the current game room, and broadcasts this entire updated state to all the players, so that all players are kept in sync.

## :clipboard: Todo
- [ ] Change state updates to only use deltas where needed to reduce data sent.
- [ ] Look into FPS issues once the game has been running for a while.
- [ ] Add :snowflake:.
- [ ] Add user settings such as: control user colour, shape, name.
- [ ] Add collectibles such as: New shapes, colours, music, death effects.
- [ ] Implement powerup actions (at the moment they can just be collected).
