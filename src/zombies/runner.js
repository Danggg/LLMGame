// runner — fast chaser: r12 hp1 dmg12, speed 130–185, score 10
// Always hunts the player; uses the base small body and 0.5 wobble.
'use strict';

class Runner extends Zombie {
  constructor(x, y, speed) {
    super(x, y, 12, 1, speed != null ? speed : rand(130, 185), 12, 10);
    this.kind = 'runner';
  }
}
