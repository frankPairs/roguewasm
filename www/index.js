import { Display, Engine as RotEngine, Map , RNG, DIRS, Scheduler, Path } from 'rot-js';
import { Engine, PlayerCore } from '../roguewasm.js';

class Game {
  constructor () {
    this.display = new Display({ width: 125, height: 40 });
    this.engine = new Engine(this.display);

    document.getElementById("rogue-canvas").appendChild(this.display.getContainer());

    this.generateMap();
    const scheduler = new Scheduler.Simple();

    scheduler.add(this.player, true);
    scheduler.add(this.enemy, true);

    this.rotengine = new RotEngine(scheduler);
    this.rotengine.start();
  }

  generateMap() {
    const digger = new Map.Digger();
    const freeCells = [];

    function digCallback(x, y, value) {
      if (!value) {
        const key = `${x},${y}`;
        freeCells.push(key);
      }

      this.engine.on_dig(x, y, value);
    }

    digger.create(digCallback.bind(this));

    this.generateBoxes(freeCells);
    this.engine.draw_map();
    this.player = this._createBeing(Player, freeCells);
    this.enemy = this._createBeing(Checko, freeCells);
  }

  generateBoxes(freeCells) {
    for (let i = 0; i < 10; i++) {
      const index = Math.floor(RNG.getUniform() * freeCells.length);
      const key = freeCells.splice(index, 1)[0];
      const parts = key.split(",");
      const x = parseInt(parts[0]);
      const y = parseInt(parts[1]);

      this.engine.place_box(x, y);

      if (i === 5) {
        this.engine.mark_wasmprize(x, y);
      }
    }
  }

  generatePlayer(freeCells) {
    const index = Math.floor(RNG.getUniform() * freeCells.length);
    const key = freeCells.splice(index, 1)[0];
    const parts = key.split(",");
    const x = parseInt(parts[0]);
    const y = parseInt(parts[1]);

    console.log("Generating player....");
    this.player = new Player(x, y, this);
  }

  _createBeing(Character, freeCells) {
    const index = Math.floor(RNG.getUniform() * freeCells.length);
    const key = freeCells.splice(index, 1)[0];
    const parts = key.split(",");
    const x = parseInt(parts[0]);
    const y = parseInt(parts[1]);

    return new Character(x, y, this);
  }
}

class Player {
  constructor (x, y, game) {
    this.game = game;
    this._core = new PlayerCore(x, y, "@", "#ff0", game.display);
    this._core.draw();
  }

  act() {
    this.game.rotengine.lock();
    window.addEventListener("keydown", this);
  }

  handleEvent(e) {
    const keyMap = {};

    keyMap[38] = 0;
    keyMap[33] = 1;
    keyMap[39] = 2;
    keyMap[34] = 3;
    keyMap[40] = 4;
    keyMap[35] = 5;
    keyMap[37] = 6;
    keyMap[36] = 7;

    const code = e.keyCode;

    if (code === 13 || code === 32) {
      this.game.engine.open_box(this._core, this.getX(), this.getY());
      return;
    }

    if (!(code in keyMap)) {
      return;
    }

    const dir = DIRS[8][keyMap[code]];
    const newX = this.getX() + dir[0];
    const newY = this.getY() + dir[1];

    if (!this.game.engine.free_cell(newX, newY)) {
      return;
    }

    this.game.engine.move_player(this._core, newX, newY);

    window.removeEventListener('keydown', this);

    this.game.rotengine.unlock();
  }

  getX() {
    return this._core.x();
  }

  getY() {
    return this._core.y();
  }
}

class Checko {
  constructor (x, y, game) {
    this.game = game;
    this._core = new PlayerCore(x, y, "B", "red", game.display);
    this._core.draw();
  }

  act() {
    const x = this.game.player.getX();
    const y = this.game.player.getY();
    const astar = new Path.AStar(x, y, passableCallback.bind(this), { topology: 4 });
    const path = [];

    function passableCallback(x, y) {
      return this.game.engine.free_cell(x, y);
    }

    function pathCallback(x, y) {
      path.push([x, y]);
    }

    astar.compute(this.getX(), this.getY(), pathCallback.bind(this));
    path.shift();

    if (path.length <= 1) {
      this.game.rotengine.lock();
      alert("Game over - you were capture by the Borrow Checker!!!");
    } else {
      const x = path[0][0];
      const y = path[0][1];

      this.game.engine.move_player(this._core, x, y);
    }
  }

  getX() {
    return this._core.x();
  }

  getY() {
    return this._core.y();
  }
}

// Initialize game
new Game();

export function stats_updated(stats) {
  document.getElementById("hitpoints").textContent = stats.hitpoints;
  document.getElementById("max-hitpoints").textContent = stats.max_hitpoints;
  document.getElementById("moves").textContent = stats.moves;
}