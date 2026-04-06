// src/config.js
// Cole's tuning zone: change these numbers and see what happens!
export const CONFIG = {
  // Game dimensions
  width: 1280,
  height: 720,

  // Teams & worms
  maxTeams: 4,
  wormsPerTeam: 2,       // Cole: try 3 or 4!
  wormHP: 100,           // Cole: try 50 for faster games!

  // Turn rules
  turnDuration: 30,      // seconds
  windMin: -5,
  windMax: 5,

  // Team colors (hex)
  teamColors: [0xff4444, 0x4488ff, 0x44cc44, 0xffdd00],
  teamNames: ['Red', 'Blue', 'Green', 'Yellow'],

  // Weapons — ammo per match
  ammo: {
    bazooka: 3,          // Cole: try Infinity for chaos!
    grenade: 3,
    shotgun: 2,
    ninjaRope: Infinity,
  },

  // Bazooka
  bazooka: {
    damage: 50,          // Cole: try 75 for big hits!
    blastRadius: 60,     // pixels
    speed: 600,
  },

  // Grenade
  grenade: {
    damage: 50,
    blastRadius: 60,
    fuseTime: 3000,      // ms — Cole: try 1500 for panic mode!
    bounce: 0.5,         // 0 = no bounce, 1 = super bouncy
  },

  // Shotgun
  shotgun: {
    damage: 15,          // per pellet
    pellets: 3,          // Cole: try 6 for a blunderbuss!
    spread: 12,          // degrees total spread
    knockback: 200,
  },

  // Ninja rope
  ninjaRope: {
    maxLength: 300,      // pixels
    swingSpeed: 3,       // Cole: try 5 for fast swings!
  },

  // Terrain
  terrainSeed: null,     // null = random; set a number to replay same map
};
