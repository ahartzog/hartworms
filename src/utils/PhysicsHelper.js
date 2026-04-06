// src/utils/PhysicsHelper.js

/** Seeded pseudo-random number generator (mulberry32) */
export function makeRng(seed) {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Convert degrees to radians */
export function toRad(degrees) {
  return (degrees * Math.PI) / 180;
}

/** Return all worms within blastRadius of (x, y) */
export function getWormsInBlast(worms, x, y, blastRadius) {
  return worms.filter((w) => {
    if (w.isDead) return false;
    const dx = w.x - x;
    const dy = w.y - y;
    return Math.sqrt(dx * dx + dy * dy) <= blastRadius;
  });
}

/** Distance between two points */
export function dist(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}
