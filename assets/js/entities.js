import { downhillDir, platformYAt } from "./geometry.js";

export function makePlayer(x, y) {
  return {
    x,
    y,
    w: 20,
    h: 28,
    vx: 0,
    vy: 0,
    grounded: false,
    climbing: false,
    facing: 1,
    supportLeaveY: y,
    supportType: null,
    supportRef: null,
    hammerTimer: 0,
    stepTimer: 0,
  };
}

export function makeBarrel(level, difficulty) {
  const startPlatform = level.platforms[0];
  const x = 146;
  return {
    kind: "barrel",
    x,
    y: platformYAt(startPlatform, x) - 12,
    w: 22,
    h: 22,
    platformIndex: 0,
    dir: downhillDir(startPlatform),
    speed: 95 + difficulty * 12,
    dropSpeed: 180 + difficulty * 15,
    dropping: false,
  };
}

export function makeFireball(level, x, platformIndex, difficulty) {
  const platform = level.platforms[platformIndex];
  return {
    kind: "fireball",
    x,
    y: platformYAt(platform, x) - 18,
    w: 18,
    h: 18,
    platformIndex,
    dir: Math.random() > 0.5 ? 1 : -1,
    speed: 85 + difficulty * 10,
    color: "#f97316",
  };
}

export function makePan(level, x, platformIndex, difficulty) {
  const platform = level.platforms[platformIndex];
  return {
    kind: "pan",
    x,
    y: platformYAt(platform, x) - 18,
    w: 26,
    h: 18,
    platformIndex,
    dir: Math.sign(platform.conveyor) || 1,
    speed: 70 + difficulty * 8,
    color: "#94a3b8",
  };
}

export function makeSpring(x, y, difficulty) {
  return {
    kind: "spring",
    x,
    y,
    w: 20,
    h: 20,
    vx: -(130 + difficulty * 12),
    baseY: y,
    age: 0,
  };
}
