import { HEIGHT, WIDTH } from "./constants.js";
import { makeBarrel, makeFireball, makePan, makeSpring } from "./entities.js";
import { downhillDir, platformYAt } from "./geometry.js";

function updateBarrels(level, dt) {
  level.spawnTimers.barrel -= dt;
  if (level.spawnTimers.barrel <= 0) {
    level.spawnTimers.barrel = Math.max(1.15, 2.3 - level.difficulty * 0.18);
    level.hazards.push(makeBarrel(level, level.difficulty));
  }

  level.hazards = level.hazards.filter((hazard) => {
    if (hazard.kind !== "barrel") return true;
    if (hazard.dropping) {
      return updateDroppingBarrel(level, hazard, dt);
    }
    return updateRollingBarrel(level, hazard, dt);
  });
}

function updateDroppingBarrel(level, hazard, dt) {
  hazard.y += hazard.dropSpeed * dt;
  const landingY = platformYAt(level.platforms[hazard.platformIndex], hazard.x);
  if (landingY !== null && hazard.y + hazard.h >= landingY) {
    hazard.y = landingY - hazard.h;
    hazard.dropping = false;
  }
  return hazard.y < HEIGHT + 40;
}

function updateRollingBarrel(level, hazard, dt) {
  const platform = level.platforms[hazard.platformIndex];
  hazard.dir = downhillDir(platform);
  hazard.x += hazard.dir * hazard.speed * dt;

  const top = platformYAt(platform, hazard.x);
  if (top === null) {
    const nextIndex = hazard.platformIndex + 1;
    if (nextIndex >= level.platforms.length) return false;
    hazard.platformIndex = nextIndex;
    const nextPlatform = level.platforms[nextIndex];
    hazard.dir = downhillDir(nextPlatform);
    hazard.x =
      hazard.dir > 0
        ? Math.min(nextPlatform.x1, nextPlatform.x2) + 12
        : Math.max(nextPlatform.x1, nextPlatform.x2) - 12;
    hazard.y = platformYAt(nextPlatform, hazard.x) - hazard.h;
    return true;
  }
  hazard.y = top - hazard.h;

  const dropChance = 0.003 + level.difficulty * 0.0008;
  const canDrop = hazard.platformIndex < level.platforms.length - 1;
  for (const ladder of level.ladders) {
    if (canDrop && Math.abs(hazard.x - ladder.x) < 10 && Math.random() < dropChance) {
      hazard.platformIndex += 1;
      hazard.dropping = true;
      return true;
    }
  }

  return hazard.x > 40 && hazard.x < WIDTH - 20;
}

function climbDownLadder(level, hazard, reach, chance) {
  if (hazard.platformIndex <= 0 || Math.random() >= chance) return;
  const ladder = level.ladders.find((item) => Math.abs(item.x - hazard.x) < reach);
  if (ladder) {
    hazard.platformIndex -= 1;
    hazard.y = ladder.y1 - hazard.h;
  }
}

function updateFireballs(level, dt) {
  level.spawnTimers.fire -= dt;
  if (level.spawnTimers.fire <= 0) {
    level.spawnTimers.fire = Math.max(2.4, 4.4 - level.difficulty * 0.22);
    const { x, platformIndex } = level.fireSpawn;
    level.hazards.push(makeFireball(level, x, platformIndex, level.difficulty));
  }

  level.hazards = level.hazards.filter((hazard) => {
    if (hazard.kind !== "fireball") return true;
    const platform = level.platforms[hazard.platformIndex];
    hazard.x += hazard.dir * hazard.speed * dt;
    const top = platformYAt(platform, hazard.x);
    if (top === null) {
      hazard.dir *= -1;
      hazard.x += hazard.dir * 8;
      return true;
    }
    hazard.y = top - hazard.h;
    climbDownLadder(level, hazard, 10, 0.0025);
    return true;
  });
}

function updateSprings(level, dt) {
  level.spawnTimers.spring -= dt;
  if (level.spawnTimers.spring <= 0) {
    level.spawnTimers.spring = Math.max(1.45, 2.3 - level.difficulty * 0.12);
    level.hazards.push(makeSpring(790, 98, level.difficulty));
  }

  level.hazards = level.hazards.filter((hazard) => {
    if (hazard.kind !== "spring") return true;
    hazard.age += dt * 4.6;
    hazard.x += hazard.vx * dt;
    hazard.y = hazard.baseY + Math.sin(hazard.age) * 62;
    return hazard.x > -40;
  });
}

function updateFactory(level, dt) {
  level.spawnTimers.reverse -= dt;
  if (level.spawnTimers.reverse <= 0) {
    level.spawnTimers.reverse = 5.6;
    for (const platform of level.platforms) {
      platform.conveyor *= -1;
    }
  }

  level.spawnTimers.pan -= dt;
  if (level.spawnTimers.pan <= 0) {
    level.spawnTimers.pan = Math.max(1.65, 2.4 - level.difficulty * 0.14);
    level.hazards.push(makePan(level, 150, 0, level.difficulty));
  }

  level.spawnTimers.fire -= dt;
  if (level.spawnTimers.fire <= 0) {
    level.spawnTimers.fire = Math.max(3, 5.3 - level.difficulty * 0.18);
    level.hazards.push(makeFireball(level, 790, 3, level.difficulty));
  }

  level.hazards = level.hazards.filter((hazard) => {
    const platform = level.platforms[hazard.platformIndex];
    if (hazard.kind === "pan") {
      hazard.dir = Math.sign(platform.conveyor) || hazard.dir;
      hazard.x += (hazard.speed + Math.abs(platform.conveyor)) * hazard.dir * dt;
      const top = platformYAt(platform, hazard.x);
      if (top === null) return false;
      hazard.y = top - hazard.h;
      return hazard.x > 70 && hazard.x < 890;
    }
    if (hazard.kind === "fireball") {
      hazard.x += hazard.dir * hazard.speed * dt;
      const top = platformYAt(platform, hazard.x);
      if (top === null) {
        hazard.dir *= -1;
        return true;
      }
      hazard.y = top - hazard.h;
      climbDownLadder(level, hazard, 12, 0.003);
    }
    return true;
  });
}

const stageHazardUpdaters = {
  girders: (level, dt) => updateBarrels(level, dt),
  elevators: (level, dt) => {
    updateSprings(level, dt);
    updateFireballs(level, dt);
  },
  factory: updateFactory,
  rivets: updateFireballs,
};

export function updateHazards(level, dt) {
  stageHazardUpdaters[level.id](level, dt);
}

export function updateMovers(level, player, dt) {
  for (const mover of level.movers) {
    const previousY = mover.y;
    mover.y += mover.speed * mover.dir * dt;
    if (mover.y <= mover.top) {
      mover.y = mover.top;
      mover.dir = 1;
    }
    if (mover.y >= mover.bottom) {
      mover.y = mover.bottom;
      mover.dir = -1;
    }
    mover.dy = mover.y - previousY;
    mover.dx = 0;
    if (player.supportType === "mover" && player.supportRef === mover && player.grounded) {
      player.y += mover.dy;
      player.x += mover.dx;
    }
  }
}
