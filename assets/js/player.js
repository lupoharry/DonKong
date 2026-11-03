import { HAMMER_SECONDS, HEIGHT, WIDTH } from "./constants.js";
import { ladderNear, supportAt } from "./geometry.js";
import { updateMovers } from "./hazards.js";
import { isDown, wasPressed } from "./input.js";
import { clearStage, loseLife, state } from "./state.js";
import { clamp, distance, rectsOverlap } from "./utils.js";

const WALK_SPEED = 180;
const HAMMER_WALK_SPEED = 145;
const CLIMB_SPEED = 150;
const JUMP_SPEED = -430;
const GRAVITY = 980;
const FATAL_FALL_FACTOR = 1.15;

function startClimbing(player, ladder) {
  player.climbing = true;
  player.vx = 0;
  player.vy = 0;
  player.x = ladder.x - player.w / 2;
  player.supportType = null;
  player.supportRef = null;
}

function updateClimbing(player, ladder, dt) {
  const up = isDown("ArrowUp");
  const down = isDown("ArrowDown");
  player.y += ((up ? -1 : 0) + (down ? 1 : 0)) * CLIMB_SPEED * dt;
  if (ladder) player.x = ladder.x - player.w / 2;
  if (!ladder || (!up && !down)) {
    player.climbing = false;
  }
}

function leaveGround(player) {
  player.grounded = false;
  player.supportType = null;
  player.supportRef = null;
}

function updateWalkingAndJumping(player) {
  const move = (isDown("ArrowRight") ? 1 : 0) - (isDown("ArrowLeft") ? 1 : 0);
  if (move !== 0) {
    player.facing = move;
  }
  player.vx = move * (player.hammerTimer > 0 ? HAMMER_WALK_SPEED : WALK_SPEED);
  if (player.supportType === "platform" && player.supportRef.conveyor) {
    player.vx += player.supportRef.conveyor;
  }
  if (wasPressed("Space") && player.hammerTimer <= 0) {
    player.vy = JUMP_SPEED;
    leaveGround(player);
  }
}

// Returns false when the player died from a fatal fall.
function applyPhysics(level, player, dt) {
  player.vy += GRAVITY * dt;
  const previousFootY = player.y + player.h;
  player.x += player.vx * dt;
  player.y += player.vy * dt;

  const support = supportAt(level, player.x + player.w / 2, player.y + player.h, previousFootY);
  if (support && player.vy >= 0) {
    if (player.y - player.supportLeaveY > player.h * FATAL_FALL_FACTOR) {
      loseLife();
      return false;
    }
    player.y = support.y - player.h;
    player.vy = 0;
    player.grounded = true;
    player.supportType = support.type;
    player.supportRef = support.object;
  } else {
    if (player.grounded) {
      player.supportLeaveY = player.y;
    }
    leaveGround(player);
  }
  return true;
}

function collectPickups(level, player) {
  const cx = player.x + player.w / 2;
  for (const hammer of level.hammers) {
    if (hammer.active && distance(cx, player.y + player.h / 2, hammer.x, hammer.y) < 28) {
      hammer.active = false;
      player.hammerTimer = HAMMER_SECONDS;
      state.score += 100;
    }
  }

  for (const rivet of level.rivets) {
    if (rivet.active && Math.abs(cx - rivet.x) < 22 && Math.abs(player.y + player.h - rivet.y) < 18) {
      rivet.active = false;
      state.score += 150;
      if (level.rivets.every((item) => !item.active)) {
        clearStage(1200);
      }
    }
  }
}

function checkHazards(level, player) {
  for (let i = level.hazards.length - 1; i >= 0; i -= 1) {
    const hazard = level.hazards[i];
    if (!rectsOverlap(player, hazard)) continue;
    if (player.hammerTimer > 0) {
      level.hazards.splice(i, 1);
      state.score += hazard.kind === "barrel" ? 200 : 300;
    } else {
      loseLife();
      return;
    }
  }
}

export function updatePlayer(level, player, dt) {
  player.hammerTimer = Math.max(0, player.hammerTimer - dt);
  player.stepTimer += dt * 12;
  updateMovers(level, player, dt);

  const ladder = ladderNear(level, player);
  const wantsClimb = (isDown("ArrowUp") || isDown("ArrowDown")) && ladder && player.hammerTimer <= 0;
  if (wantsClimb) {
    startClimbing(player, ladder);
  }

  if (player.climbing) {
    updateClimbing(player, ladder, dt);
  } else {
    if (player.grounded) {
      updateWalkingAndJumping(player);
    }
    if (!applyPhysics(level, player, dt)) return;
  }

  player.x = clamp(player.x, 24, WIDTH - player.w - 24);
  if (player.y > HEIGHT + 20) {
    loseLife();
    return;
  }

  collectPickups(level, player);

  if (level.goal && rectsOverlap(player, level.goal)) {
    clearStage(800 + state.stageIndex * 100);
  }

  checkHazards(level, player);
}
