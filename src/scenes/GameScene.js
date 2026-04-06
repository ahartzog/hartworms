// src/scenes/GameScene.js
import Phaser from 'phaser';
import { CONFIG } from '../config.js';
import { Terrain } from '../entities/Terrain.js';
import { TeamManager } from '../managers/TeamManager.js';
import { TurnManager } from '../managers/TurnManager.js';

export class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  create() {
    this.terrain = new Terrain(this, CONFIG.width, CONFIG.height, CONFIG.terrainSeed);

    const teamCount = this.scene.settings.data?.teamCount ?? 2;
    this.teamManager = new TeamManager(this, teamCount, this.terrain);
    this.turnManager = new TurnManager(this.teamManager, (info) => this._onTurnEnd(info));

    this.turnManager.activeWorm.setActive(true);

    this.cursors = this.input.keyboard.createCursorKeys();
    this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);

    this.debugText = this.add.text(10, 10, '', { fontSize: '14px', color: '#ffffff' });
  }

  _onTurnEnd({ team, worm, wind }) {
    console.log(`Turn ended. Now: ${team.name} / ${worm.name} / Wind: ${wind}`);
  }

  update(time, delta) {
    const worm = this.turnManager.activeWorm;
    const tm = this.turnManager;

    if (tm.turnActive && worm && !worm.isDead) {
      if (this.cursors.left.isDown) worm.walk(-1);
      else if (this.cursors.right.isDown) worm.walk(1);
      else worm.stopWalk();

      if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) worm.jump();
    }

    for (const w of this.teamManager.allWorms) {
      w.update(this.terrain, delta);
    }

    tm.update(delta);

    if (tm.isGameOver) {
      const winner = tm.winningTeam;
      this.scene.start('MenuScene');
      console.log(`Winner: ${winner?.name ?? 'Nobody'}`);
      return;
    }

    this.debugText.setText([
      `Turn: ${tm.activeTeam.name} / ${worm?.name}`,
      `Time: ${Math.ceil(tm.timeLeft)}s`,
      `Wind: ${tm.wind}`,
    ]);
  }
}
