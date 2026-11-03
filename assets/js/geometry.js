import { COLORS } from "./constants.js";

export function makePlatform(x1, y1, x2, y2, options = {}) {
  return {
    x1,
    y1,
    x2,
    y2,
    conveyor: options.conveyor || 0,
    color: options.color || COLORS.girder,
  };
}

export function makeLadder(x, y1, y2) {
  return { x, y1, y2, width: 24 };
}

export function platformYAt(platform, x) {
  const minX = Math.min(platform.x1, platform.x2);
  const maxX = Math.max(platform.x1, platform.x2);
  if (x < minX - 2 || x > maxX + 2) {
    return null;
  }
  const span = platform.x2 - platform.x1;
  if (Math.abs(span) < 0.01) {
    return platform.y1;
  }
  const t = (x - platform.x1) / span;
  return platform.y1 + (platform.y2 - platform.y1) * t;
}

// Horizontal direction (-1 or 1) in which the platform descends; flat platforms default to 1.
export function downhillDir(platform) {
  const dx = Math.sign(platform.x2 - platform.x1) || 1;
  const dy = Math.sign(platform.y2 - platform.y1);
  return dy === 0 ? 1 : dx * dy;
}

export function supportAt(level, x, footY, previousFootY) {
  let best = null;
  for (const platform of level.platforms) {
    const y = platformYAt(platform, x);
    if (y === null) continue;
    if (previousFootY <= y + 6 && footY >= y - 6 && (!best || y < best.y)) {
      best = { type: "platform", object: platform, y };
    }
  }
  for (const mover of level.movers) {
    if (x < mover.x - 4 || x > mover.x + mover.w + 4) continue;
    const y = mover.y;
    if (previousFootY <= y + 8 && footY >= y - 6 && (!best || y < best.y)) {
      best = { type: "mover", object: mover, y };
    }
  }
  return best;
}

export function ladderNear(level, player) {
  const centerX = player.x + player.w / 2;
  const top = player.y;
  const bottom = player.y + player.h;
  return (
    level.ladders.find(
      (ladder) =>
        Math.abs(centerX - ladder.x) <= ladder.width / 2 && bottom > ladder.y1 - 6 && top < ladder.y2 + 6,
    ) || null
  );
}
