// src/managers/TeamManager.js
import { CONFIG } from '../config.js';
import { Worm } from '../entities/Worm.js';

export class Team {
  constructor(index, name, color) {
    this.index = index;
    this.name = name;
    this.color = color;
    this.worms = [];
  }
  get isEliminated() {
    return this.worms.every((w) => w.isDead);
  }
  get livingWorms() {
    return this.worms.filter((w) => !w.isDead);
  }
}

const SPRITE_PREFIXES = ['pink', 'owlet', 'dude', 'pink'];

export class TeamManager {
  constructor(scene, teamCount, terrain) {
    this.teams = [];

    for (let i = 0; i < teamCount; i++) {
      const team = new Team(i, CONFIG.teamNames[i], CONFIG.teamColors[i]);

      for (let w = 0; w < CONFIG.wormsPerTeam; w++) {
        const sectionWidth = CONFIG.width / teamCount;
        const spawnX = sectionWidth * i + sectionWidth / 2 + (w - 0.5) * 80;
        const worm = new Worm(
          scene,
          spawnX,
          50,
          CONFIG.teamColors[i],
          `${CONFIG.teamNames[i]} ${w + 1}`,
          SPRITE_PREFIXES[i]
        );
        team.worms.push(worm);
      }

      this.teams.push(team);
    }
  }

  get allWorms() {
    return this.teams.flatMap((t) => t.worms);
  }

  get activeTeams() {
    return this.teams.filter((t) => !t.isEliminated);
  }
}
