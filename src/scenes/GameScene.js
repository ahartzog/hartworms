// src/scenes/GameScene.js
import Phaser from 'phaser';
import { CONFIG } from '../config.js';
import { Terrain } from '../entities/Terrain.js';
import { TeamManager } from '../managers/TeamManager.js';
import { TurnManager } from '../managers/TurnManager.js';
import { Bazooka } from '../entities/weapons/Bazooka.js';
import { Grenade } from '../entities/weapons/Grenade.js';
import { Shotgun } from '../entities/weapons/Shotgun.js';
import { NinjaRope } from '../entities/weapons/NinjaRope.js';

const WEAPONS = ['Bazooka', 'Grenade', 'Shotgun', 'Ninja Rope'];

export class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  preload() {
    const BASE = 'assets/craftpix-net-622999-free-pixel-art-tiny-hero-sprites';
    // Pink Monster
    this.load.spritesheet('pink_idle',  `${BASE}/1 Pink_Monster/Pink_Monster_Idle_4.png`,  { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('pink_walk',  `${BASE}/1 Pink_Monster/Pink_Monster_Walk_6.png`,  { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('pink_jump',  `${BASE}/1 Pink_Monster/Pink_Monster_Jump_8.png`,  { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('pink_death', `${BASE}/1 Pink_Monster/Pink_Monster_Death_8.png`, { frameWidth: 32, frameHeight: 32 });
    // Owlet Monster
    this.load.spritesheet('owlet_idle',  `${BASE}/2 Owlet_Monster/Owlet_Monster_Idle_4.png`,  { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('owlet_walk',  `${BASE}/2 Owlet_Monster/Owlet_Monster_Walk_6.png`,  { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('owlet_jump',  `${BASE}/2 Owlet_Monster/Owlet_Monster_Jump_8.png`,  { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('owlet_death', `${BASE}/2 Owlet_Monster/Owlet_Monster_Death_8.png`, { frameWidth: 32, frameHeight: 32 });
    // Dude Monster
    this.load.spritesheet('dude_idle',  `${BASE}/3 Dude_Monster/Dude_Monster_Idle_4.png`,  { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('dude_walk',  `${BASE}/3 Dude_Monster/Dude_Monster_Walk_6.png`,  { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('dude_jump',  `${BASE}/3 Dude_Monster/Dude_Monster_Jump_8.png`,  { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('dude_death', `${BASE}/3 Dude_Monster/Dude_Monster_Death_8.png`, { frameWidth: 32, frameHeight: 32 });
  }

  _createAnims() {
    const defs = [
      { prefix: 'pink',  idle: 4, walk: 6, jump: 8, death: 8 },
      { prefix: 'owlet', idle: 4, walk: 6, jump: 8, death: 8 },
      { prefix: 'dude',  idle: 4, walk: 6, jump: 8, death: 8 },
    ];
    for (const { prefix, idle, walk, jump, death } of defs) {
      this.anims.create({ key: `${prefix}_idle`,  frames: this.anims.generateFrameNumbers(`${prefix}_idle`,  { start: 0, end: idle  - 1 }), frameRate: 8,  repeat: -1 });
      this.anims.create({ key: `${prefix}_walk`,  frames: this.anims.generateFrameNumbers(`${prefix}_walk`,  { start: 0, end: walk  - 1 }), frameRate: 10, repeat: -1 });
      this.anims.create({ key: `${prefix}_jump`,  frames: this.anims.generateFrameNumbers(`${prefix}_jump`,  { start: 0, end: jump  - 1 }), frameRate: 10, repeat: 0  });
      this.anims.create({ key: `${prefix}_death`, frames: this.anims.generateFrameNumbers(`${prefix}_death`, { start: 0, end: death - 1 }), frameRate: 10, repeat: 0  });
    }
  }

  create(data) {
    this.terrain = new Terrain(this, CONFIG.width, CONFIG.height, CONFIG.terrainSeed);

    this._createAnims();

    const teamCount = data?.teamCount ?? 2;
    this.teamManager = new TeamManager(this, teamCount, this.terrain);
    this.turnManager = new TurnManager(this.teamManager, (info) => this._onTurnEnd(info));
    this.turnManager.activeWorm.setActive(true);

    // Weapon state
    this.weaponIndex = 0;
    this.ammo = { ...CONFIG.ammo };

    this.cursors = this.input.keyboard.createCursorKeys();
    this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.keyQ = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q);
    this.keyE = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);

    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.powerCharge = 0;
    this.isCharging = false;
    this._currentWeapon = null;
    this._rope = null;
    this._gameOverShown = false;
  }

  _ammoKey() {
    return ['bazooka', 'grenade', 'shotgun', 'ninjaRope'][this.weaponIndex];
  }

  _onTurnEnd({ team, worm, wind }) {
    this.weaponIndex = 0;
    this._currentWeapon = null;
    this.isCharging = false;
    this.powerCharge = 0;
    if (this._rope) { this._rope.destroy(); this._rope = null; }
  }

  update(time, delta) {
    const tm = this.turnManager;
    const worm = tm.activeWorm;

    if (tm.turnActive && worm && !worm.isDead && !this._currentWeapon?.active) {
      // Movement
      if (this.cursors.left.isDown) worm.walk(-1);
      else if (this.cursors.right.isDown) worm.walk(1);
      else worm.stopWalk();

      if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) worm.jump();

      // Aim rotation
      if (this.keyA.isDown) worm.rotateAim(-1);
      if (this.keyD.isDown) worm.rotateAim(1);

      // Weapon switch
      if (Phaser.Input.Keyboard.JustDown(this.keyQ)) {
        this.weaponIndex = (this.weaponIndex + WEAPONS.length - 1) % WEAPONS.length;
        this.isCharging = false;
        this.powerCharge = 0;
        if (this._rope) { this._rope.destroy(); this._rope = null; }
      }
      if (Phaser.Input.Keyboard.JustDown(this.keyE)) {
        this.weaponIndex = (this.weaponIndex + 1) % WEAPONS.length;
        this.isCharging = false;
        this.powerCharge = 0;
        if (this._rope) { this._rope.destroy(); this._rope = null; }
      }

      // Fire bazooka (weapon index 0)
      if (this.weaponIndex === 0 && this.ammo.bazooka > 0) {
        if (this.spaceKey.isDown && !this.isCharging) {
          this.isCharging = true;
          this.powerCharge = 0;
        }
        if (this.isCharging && this.spaceKey.isDown) {
          this.powerCharge = Math.min(1, this.powerCharge + delta / 1000);
        }
        if (this.isCharging && Phaser.Input.Keyboard.JustUp(this.spaceKey)) {
          this.isCharging = false;
          this.ammo.bazooka--;
          this._currentWeapon = new Bazooka(
            this, this.terrain, this.teamManager.allWorms, tm.wind,
            () => { tm.endTurn(); },
            (hitWorm, dmg) => {
              const ui = this.scene.get('UIScene');
              if (ui) ui.showDamage(hitWorm.x, hitWorm.y - 20, dmg);
            }
          );
          this._currentWeapon.fire(worm.x, worm.y, worm.getAimVector(), this.powerCharge);
        }
      }

      // Grenade (weapon index 1)
      if (this.weaponIndex === 1 && this.ammo.grenade > 0) {
        if (this.spaceKey.isDown && !this.isCharging) {
          this.isCharging = true;
          this.powerCharge = 0;
        }
        if (this.isCharging && this.spaceKey.isDown) {
          this.powerCharge = Math.min(1, this.powerCharge + delta / 1000);
        }
        if (this.isCharging && Phaser.Input.Keyboard.JustUp(this.spaceKey)) {
          this.isCharging = false;
          this.ammo.grenade--;
          this._currentWeapon = new Grenade(
            this, this.terrain, this.teamManager.allWorms,
            () => { tm.endTurn(); },
            (hitWorm, dmg) => {
              const ui = this.scene.get('UIScene');
              if (ui) ui.showDamage(hitWorm.x, hitWorm.y - 20, dmg);
            }
          );
          this._currentWeapon.fire(worm.x, worm.y, worm.getAimVector(), this.powerCharge);
        }
      }

      // Shotgun (weapon index 2)
      if (this.weaponIndex === 2 && this.ammo.shotgun > 0 && worm.state !== 'falling') {
        if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
          this.ammo.shotgun--;
          this._currentWeapon = new Shotgun(
            this, this.terrain, this.teamManager.allWorms,
            () => { tm.endTurn(); },
            (hitWorm, dmg) => {
              const ui = this.scene.get('UIScene');
              if (ui) ui.showDamage(hitWorm.x, hitWorm.y - 20, dmg);
            }
          );
          this._currentWeapon.fire(worm.x, worm.y, worm.getAimVector());
        }
      }

      // Ninja Rope (weapon index 3)
      if (this.weaponIndex === 3) {
        if (this._rope && this._rope.active) {
          this._rope.update(delta);
          if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
            this._rope.release();
            this._rope = null;
          }
        } else if (!this._rope?.active) {
          if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
            if (this._rope) { this._rope.destroy(); this._rope = null; }
            const rope = new NinjaRope(
              this, this.terrain, worm,
              () => { /* rope release doesn't end turn */ }
            );
            rope.fire(worm.getAimVector());
            if (rope.active) {
              this._rope = rope;
            } else {
              rope.destroy();
            }
          }
        }
      }
    }

    // Update all worms (skip active worm while on rope)
    for (const w of this.teamManager.allWorms) {
      if (w === worm && this._rope?.active) continue;
      w.update(this.terrain, delta);
    }

    tm.update(delta);

    // Push state to UIScene
    const ui = this.scene.get('UIScene');
    if (ui && worm) {
      const ammoVal = this.ammo[this._ammoKey()];
      ui.updateHUD({
        teamName: tm.activeTeam.name,
        teamColor: tm.activeTeam.color,
        wormName: worm.name,
        hp: worm.hp,
        timeLeft: tm.timeLeft,
        wind: tm.wind,
        weaponName: WEAPONS[this.weaponIndex],
        ammo: ammoVal,
        power: this.isCharging ? this.powerCharge : null,
      });
    }

    // Game over
    if (tm.isGameOver && !this._gameOverShown) {
      this._gameOverShown = true;
      const winner = tm.winningTeam;
      const cx = CONFIG.width / 2;
      const cy = CONFIG.height / 2;

      this.add.rectangle(cx, cy, CONFIG.width, CONFIG.height, 0x000000, 0.6);
      this.add.rectangle(cx, cy, 500, 200, 0x1a1a2e).setOrigin(0.5);
      this.add.rectangle(cx, cy, 496, 196, 0x2a2a4e).setOrigin(0.5);

      const winColor = winner ? '#' + winner.color.toString(16).padStart(6, '0') : '#ffffff';
      this.add.text(cx, cy - 40, winner ? `${winner.name} Wins! 🎉` : 'Draw!', {
        fontSize: '48px', color: winColor, fontStyle: 'bold',
      }).setOrigin(0.5);

      this.add.text(cx, cy + 20, 'Returning to menu...', {
        fontSize: '20px', color: '#aaaaaa',
      }).setOrigin(0.5);

      this.time.delayedCall(3000, () => {
        this.scene.stop('UIScene');
        this.scene.start('MenuScene');
      });

      this.turnManager.turnActive = false;
    }
  }
}
