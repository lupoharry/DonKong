const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const COLORS = {
  bg: "#031525",
  steel: "#3b82f6",
  girder: "#ef4444",
  ladder: "#f59e0b",
  floor: "#1d4ed8",
  text: "#f8fafc",
  accent: "#fbbf24",
  lady: "#f472b6",
  danger: "#fb7185",
  hammer: "#fde047",
  dk: "#8b5a2b",
  jumpman: "#60a5fa",
  oil: "#22c55e",
};

const keys = new Set();
const justPressed = new Set();

window.addEventListener("keydown", (event) => {
  if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Space", "Enter"].includes(event.code)) {
    event.preventDefault();
  }
  if (!keys.has(event.code)) {
    justPressed.add(event.code);
  }
  keys.add(event.code);
});

window.addEventListener("keyup", (event) => {
  keys.delete(event.code);
});

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const rectsOverlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
const distance = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);

function makePlatform(x1, y1, x2, y2, options = {}) {
  return {
    x1,
    y1,
    x2,
    y2,
    conveyor: options.conveyor || 0,
    color: options.color || COLORS.girder,
    tag: options.tag || "platform",
  };
}

function makeLadder(x, y1, y2) {
  return { x, y1, y2, width: 24 };
}

function platformYAt(platform, x) {
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

function supportAt(level, x, footY, previousFootY) {
  let best = null;
  for (const platform of level.platforms) {
    const y = platformYAt(platform, x);
    if (y === null) continue;
    if (previousFootY <= y + 6 && footY >= y - 6) {
      if (!best || y < best.y) {
        best = { type: "platform", object: platform, y };
      }
    }
  }
  for (const mover of level.movers) {
    if (x < mover.x - 4 || x > mover.x + mover.w + 4) continue;
    const y = mover.y;
    if (previousFootY <= y + 8 && footY >= y - 6) {
      if (!best || y < best.y) {
        best = { type: "mover", object: mover, y };
      }
    }
  }
  return best;
}

function ladderNear(level, player) {
  const centerX = player.x + player.w / 2;
  const top = player.y;
  const bottom = player.y + player.h;
  return level.ladders.find((ladder) => Math.abs(centerX - ladder.x) <= ladder.width / 2 && bottom > ladder.y1 - 6 && top < ladder.y2 + 6) || null;
}

function makePlayer(x, y) {
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

function makeBarrel(level, difficulty) {
  const startPlatform = level.platforms[0];
  const x = 146;
  const slope = startPlatform.x2 - startPlatform.x1;
  const downhillDir = slope === 0 ? 1 : Math.sign(slope);
  return {
    kind: "barrel",
    x,
    y: platformYAt(startPlatform, x) - 12,
    w: 22,
    h: 22,
    platformIndex: 0,
    dir: downhillDir,
    speed: 95 + difficulty * 12,
    dropSpeed: 180 + difficulty * 15,
    dropping: false,
  };
}

function makeFireball(level, x, platformIndex, difficulty) {
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

function makePan(level, x, platformIndex, difficulty) {
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

function makeSpring(x, y, difficulty) {
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

function drawPlatform(platform) {
  ctx.lineWidth = 12;
  ctx.strokeStyle = platform.color;
  ctx.beginPath();
  ctx.moveTo(platform.x1, platform.y1);
  ctx.lineTo(platform.x2, platform.y2);
  ctx.stroke();

  ctx.lineWidth = 3;
  ctx.strokeStyle = "rgba(255,255,255,0.22)";
  ctx.beginPath();
  ctx.moveTo(platform.x1, platform.y1 - 5);
  ctx.lineTo(platform.x2, platform.y2 - 5);
  ctx.stroke();
}

function drawLadder(ladder) {
  ctx.strokeStyle = COLORS.ladder;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(ladder.x - 10, ladder.y1);
  ctx.lineTo(ladder.x - 10, ladder.y2);
  ctx.moveTo(ladder.x + 10, ladder.y1);
  ctx.lineTo(ladder.x + 10, ladder.y2);
  for (let y = ladder.y1 + 10; y < ladder.y2; y += 16) {
    ctx.moveTo(ladder.x - 10, y);
    ctx.lineTo(ladder.x + 10, y);
  }
  ctx.stroke();
}

function drawHammer(hammer) {
  if (!hammer.active) return;
  ctx.save();
  ctx.translate(hammer.x, hammer.y);
  ctx.fillStyle = COLORS.hammer;
  ctx.fillRect(-10, -10, 20, 8);
  ctx.fillStyle = "#0f172a";
  ctx.fillRect(-2, -8, 4, 24);
  ctx.restore();
}

function drawCharacter(x, y, color, pose = 0) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, 20, 12);
  ctx.fillRect(x + 4, y - 12, 12, 12);
  ctx.fillRect(x + (pose % 2 === 0 ? 0 : 12), y + 12, 8, 12);
  ctx.fillRect(x + (pose % 2 === 0 ? 12 : 0), y + 12, 8, 12);
}

function drawDK(x, y) {
  ctx.fillStyle = COLORS.dk;
  ctx.fillRect(x, y, 42, 28);
  ctx.fillRect(x + 6, y - 18, 30, 18);
  ctx.fillStyle = "#fde68a";
  ctx.fillRect(x + 6, y + 10, 12, 8);
}

function drawPauline(x, y) {
  ctx.fillStyle = COLORS.lady;
  ctx.fillRect(x, y, 18, 16);
  ctx.fillRect(x + 4, y - 12, 10, 12);
  ctx.fillStyle = COLORS.text;
  ctx.fillRect(x + 2, y - 16, 14, 3);
}

function buildBarrelStage(difficulty) {
  const platforms = [
    makePlatform(110, 120, 860, 150),
    makePlatform(100, 240, 850, 210),
    makePlatform(110, 330, 860, 360),
    makePlatform(100, 450, 850, 420),
    makePlatform(110, 570, 860, 600),
    makePlatform(90, 675, 870, 645, { color: COLORS.floor }),
  ];
  const ladders = [
    makeLadder(760, 145, 220),
    makeLadder(220, 205, 335),
    makeLadder(700, 355, 425),
    makeLadder(280, 415, 575),
    makeLadder(810, 580, 648),
    makeLadder(640, 140, 238),
  ];
  return {
    name: "Girders",
    stageColor: "#0f172a",
    platforms,
    ladders,
    movers: [],
    hammers: [
      { x: 575, y: 330, active: true },
      { x: 335, y: 560, active: true },
    ],
    rivets: [],
    goal: { x: 795, y: 74, w: 60, h: 60 },
    playerStart: { x: 120, y: 646 },
    dk: { x: 110, y: 70 },
    pauline: { x: 820, y: 72 },
    hazards: [],
    spawnTimers: { barrel: 0, fire: 0 },
    difficulty,
  };
}

function buildElevatorStage(difficulty) {
  const platforms = [
    makePlatform(120, 130, 360, 130),
    makePlatform(520, 130, 840, 130),
    makePlatform(120, 315, 360, 315),
    makePlatform(520, 315, 840, 315),
    makePlatform(120, 500, 360, 500),
    makePlatform(520, 500, 840, 500),
    makePlatform(90, 675, 870, 675, { color: COLORS.floor }),
  ];
  const ladders = [
    makeLadder(230, 505, 675),
    makeLadder(730, 320, 500),
    makeLadder(230, 135, 315),
    makeLadder(730, 135, 315),
  ];
  return {
    name: "Elevators",
    stageColor: "#111827",
    platforms,
    ladders,
    movers: [
      { x: 400, y: 630, w: 80, h: 12, top: 180, bottom: 630, speed: 110 + difficulty * 10, dir: -1, dx: 0, dy: 0 },
      { x: 400, y: 400, w: 80, h: 12, top: 180, bottom: 630, speed: 110 + difficulty * 10, dir: 1, dx: 0, dy: 0 },
    ],
    hammers: [{ x: 575, y: 470, active: true }],
    rivets: [],
    goal: { x: 760, y: 70, w: 50, h: 60 },
    playerStart: { x: 130, y: 640 },
    dk: { x: 720, y: 70 },
    pauline: { x: 795, y: 72 },
    hazards: [],
    spawnTimers: { spring: 0, fire: 0 },
    difficulty,
  };
}

function buildFactoryStage(difficulty) {
  const platforms = [
    makePlatform(110, 170, 840, 170, { conveyor: 42 }),
    makePlatform(110, 350, 840, 350, { conveyor: -55 }),
    makePlatform(110, 530, 840, 530, { conveyor: 42 }),
    makePlatform(90, 675, 870, 675, { color: COLORS.floor }),
  ];
  const ladders = [
    makeLadder(740, 535, 675),
    makeLadder(190, 355, 535),
    makeLadder(760, 175, 355),
  ];
  return {
    name: "Factory",
    stageColor: "#0b1220",
    platforms,
    ladders,
    movers: [],
    hammers: [
      { x: 460, y: 320, active: true },
      { x: 650, y: 500, active: true },
    ],
    rivets: [],
    goal: { x: 150, y: 112, w: 56, h: 58 },
    playerStart: { x: 120, y: 640 },
    dk: { x: 135, y: 104 },
    pauline: { x: 170, y: 112 },
    oil: { x: 805, y: 640 },
    hazards: [],
    spawnTimers: { pan: 0, fire: 0, reverse: 5 },
    difficulty,
  };
}

function buildRivetStage(difficulty) {
  const platforms = [
    makePlatform(160, 160, 810, 160),
    makePlatform(120, 315, 850, 315),
    makePlatform(160, 470, 810, 470),
    makePlatform(90, 675, 870, 675, { color: COLORS.floor }),
  ];
  const ladders = [
    makeLadder(720, 475, 675),
    makeLadder(240, 320, 475),
    makeLadder(680, 165, 320),
  ];
  const rivets = [
    { x: 210, y: 160, active: true },
    { x: 760, y: 160, active: true },
    { x: 170, y: 315, active: true },
    { x: 810, y: 315, active: true },
    { x: 220, y: 470, active: true },
    { x: 760, y: 470, active: true },
    { x: 160, y: 675, active: true },
    { x: 820, y: 675, active: true },
  ];
  return {
    name: "Rivets",
    stageColor: "#1f2937",
    platforms,
    ladders,
    movers: [],
    hammers: [{ x: 440, y: 438, active: true }],
    rivets,
    goal: null,
    playerStart: { x: 120, y: 640 },
    dk: { x: 760, y: 110 },
    pauline: { x: 220, y: 112 },
    hazards: [],
    spawnTimers: { fire: 0 },
    difficulty,
    collapseTimer: null,
  };
}

const levelBuilders = [buildBarrelStage, buildElevatorStage, buildFactoryStage, buildRivetStage];

const state = {
  scene: "title",
  cycle: 1,
  stageIndex: 0,
  score: 0,
  lives: 3,
  level: null,
  player: null,
  messageTimer: 0,
  flash: 0,
};

function startRun() {
  state.scene = "playing";
  state.score = 0;
  state.lives = 3;
  state.cycle = 1;
  state.stageIndex = 0;
  loadStage();
}

function loadStage() {
  const builder = levelBuilders[state.stageIndex % levelBuilders.length];
  const difficulty = state.cycle - 1;
  state.level = builder(difficulty);
  state.player = makePlayer(state.level.playerStart.x, state.level.playerStart.y);
  state.player.supportLeaveY = state.player.y;
  state.messageTimer = 1.2;
  state.flash = 0;
}

function loseLife() {
  if (state.scene !== "playing") return;
  state.lives -= 1;
  state.flash = 0.35;
  if (state.lives <= 0) {
    state.scene = "gameover";
    return;
  }
  loadStage();
}

function clearStage(bonus) {
  state.score += bonus;
  state.scene = "stageclear";
  state.messageTimer = 2.4;
}

function nextStage() {
  state.stageIndex += 1;
  if (state.stageIndex >= levelBuilders.length) {
    state.stageIndex = 0;
    state.cycle += 1;
  }
  state.scene = "playing";
  loadStage();
}

function checkPlayerHazards(level, player) {
  for (let i = level.hazards.length - 1; i >= 0; i -= 1) {
    const hazard = level.hazards[i];
    if (rectsOverlap(player, hazard)) {
      if (player.hammerTimer > 0) {
        level.hazards.splice(i, 1);
        state.score += hazard.kind === "barrel" ? 200 : 300;
      } else {
        loseLife();
        return;
      }
    }
  }
}

function updateBarrels(level, dt) {
  level.spawnTimers.barrel -= dt;
  if (level.spawnTimers.barrel <= 0) {
    level.spawnTimers.barrel = Math.max(1.15, 2.3 - level.difficulty * 0.18);
    level.hazards.push(makeBarrel(level, level.difficulty));
  }

  const ladderXs = level.ladders.map((ladder) => ladder.x);
  level.hazards = level.hazards.filter((hazard) => {
    if (hazard.kind !== "barrel") return true;
    if (hazard.dropping) {
      hazard.y += hazard.dropSpeed * dt;
      const nextPlatform = level.platforms[hazard.platformIndex];
      const landingY = platformYAt(nextPlatform, hazard.x);
      if (landingY !== null && hazard.y + hazard.h >= landingY) {
        hazard.y = landingY - hazard.h;
        hazard.dropping = false;
      }
      return hazard.y < HEIGHT + 40;
    }

    const platform = level.platforms[hazard.platformIndex];
    const slopeDir = Math.sign(platform.x2 - platform.x1) || 1;
    hazard.dir = slopeDir;
    hazard.x += hazard.dir * hazard.speed * dt;
    const top = platformYAt(platform, hazard.x);
    if (top === null) {
      const nextIndex = hazard.platformIndex + 1;
      if (nextIndex >= level.platforms.length) {
        return false;
      }
      hazard.platformIndex = nextIndex;
      const nextPlatform = level.platforms[hazard.platformIndex];
      hazard.dir = Math.sign(nextPlatform.x2 - nextPlatform.x1) || hazard.dir;
      hazard.x = hazard.dir > 0 ? Math.min(nextPlatform.x1, nextPlatform.x2) + 12 : Math.max(nextPlatform.x1, nextPlatform.x2) - 12;
      hazard.y = platformYAt(nextPlatform, hazard.x) - hazard.h;
      return true;
    }
    hazard.y = top - hazard.h;

    for (const ladderX of ladderXs) {
      if (Math.abs(hazard.x - ladderX) < 10 && hazard.platformIndex < level.platforms.length - 1 && Math.random() < 0.003 + level.difficulty * 0.0008) {
        hazard.platformIndex += 1;
        hazard.dropping = true;
        return true;
      }
    }

    return hazard.x > 40 && hazard.x < WIDTH - 20 && slopeDir !== 0;
  });
}

function updateFireballs(level, dt) {
  level.spawnTimers.fire -= dt;
  if (level.spawnTimers.fire <= 0) {
    level.spawnTimers.fire = Math.max(2.4, 4.4 - level.difficulty * 0.22);
    const platformIndex = level.name === "Rivets" ? 3 : level.name === "Factory" ? 3 : 5;
    const startX = level.name === "Factory" ? 790 : level.name === "Elevators" ? 550 : 130;
    level.hazards.push(makeFireball(level, startX, platformIndex, level.difficulty));
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

    if (Math.random() < 0.0025 && level.ladders.length) {
      const usable = level.ladders.find((ladder) => Math.abs(ladder.x - hazard.x) < 10 && hazard.platformIndex > 0);
      if (usable) {
        hazard.platformIndex -= 1;
        hazard.y = usable.y1 - hazard.h;
      }
    }
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
    if (hazard.kind === "pan") {
      const platform = level.platforms[hazard.platformIndex];
      hazard.dir = Math.sign(platform.conveyor) || hazard.dir;
      hazard.x += (hazard.speed + Math.abs(platform.conveyor)) * hazard.dir * dt;
      const top = platformYAt(platform, hazard.x);
      if (top === null) return false;
      hazard.y = top - hazard.h;
      return hazard.x > 70 && hazard.x < 890;
    }
    if (hazard.kind === "fireball") {
      const platform = level.platforms[hazard.platformIndex];
      hazard.x += hazard.dir * hazard.speed * dt;
      const top = platformYAt(platform, hazard.x);
      if (top === null) {
        hazard.dir *= -1;
        return true;
      }
      hazard.y = top - hazard.h;
      const usable = level.ladders.find((ladder) => Math.abs(ladder.x - hazard.x) < 12 && hazard.platformIndex > 0 && Math.random() < 0.003);
      if (usable) {
        hazard.platformIndex -= 1;
        hazard.y = usable.y1 - hazard.h;
      }
      return true;
    }
    return true;
  });
}

function updateMovers(level, player, dt) {
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

function updatePlayer(level, player, dt) {
  player.hammerTimer = Math.max(0, player.hammerTimer - dt);
  player.stepTimer += dt * 12;
  updateMovers(level, player, dt);

  const ladder = ladderNear(level, player);
  const wantsClimb = (keys.has("ArrowUp") || keys.has("ArrowDown")) && ladder && player.hammerTimer <= 0;
  if (wantsClimb && (!player.climbing || ladder)) {
    player.climbing = true;
    player.vx = 0;
    player.vy = 0;
    player.x = ladder.x - player.w / 2;
    player.supportType = null;
    player.supportRef = null;
  }

  if (player.climbing) {
    const climbDir = (keys.has("ArrowUp") ? -1 : 0) + (keys.has("ArrowDown") ? 1 : 0);
    player.y += climbDir * 150 * dt;
    player.x = ladder ? ladder.x - player.w / 2 : player.x;
    if (!ladder || (!keys.has("ArrowUp") && !keys.has("ArrowDown"))) {
      player.climbing = false;
    }
  } else {
    if (player.grounded) {
      let move = 0;
      if (keys.has("ArrowLeft")) move -= 1;
      if (keys.has("ArrowRight")) move += 1;
      if (move !== 0) {
        player.facing = move;
      }
      player.vx = move * (player.hammerTimer > 0 ? 145 : 180);
      const supportPlatform = player.supportType === "platform" ? player.supportRef : null;
      if (supportPlatform?.conveyor) {
        player.vx += supportPlatform.conveyor;
      }
      if (justPressed.has("Space") && player.hammerTimer <= 0) {
        player.vy = -430;
        player.grounded = false;
        player.supportType = null;
        player.supportRef = null;
      }
    }

    player.vy += 980 * dt;
    const previousFootY = player.y + player.h;
    player.x += player.vx * dt;
    player.y += player.vy * dt;
    const footY = player.y + player.h;

    const support = supportAt(level, player.x + player.w / 2, footY, previousFootY);
    if (support && player.vy >= 0) {
      if (player.y - player.supportLeaveY > player.h * 1.15) {
        loseLife();
        return;
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
      player.grounded = false;
      player.supportType = null;
      player.supportRef = null;
    }
  }

  player.x = clamp(player.x, 24, WIDTH - player.w - 24);
  if (player.y > HEIGHT + 20) {
    loseLife();
    return;
  }

  for (const hammer of level.hammers) {
    if (hammer.active && distance(player.x + player.w / 2, player.y + player.h / 2, hammer.x, hammer.y) < 28) {
      hammer.active = false;
      player.hammerTimer = 8;
      state.score += 100;
    }
  }

  for (const rivet of level.rivets) {
    if (rivet.active && Math.abs(player.x + player.w / 2 - rivet.x) < 22 && Math.abs(player.y + player.h - rivet.y) < 18) {
      rivet.active = false;
      state.score += 150;
      if (level.rivets.every((item) => !item.active)) {
        clearStage(1200);
      }
    }
  }

  if (level.goal && rectsOverlap(player, level.goal)) {
    clearStage(800 + state.stageIndex * 100);
  }

  checkPlayerHazards(level, player);
}

function updateLevel(dt) {
  const level = state.level;
  const player = state.player;

  if (state.flash > 0) {
    state.flash = Math.max(0, state.flash - dt);
  }

  if (level.name === "Girders") {
    updateBarrels(level, dt);
  } else if (level.name === "Elevators") {
    updateSprings(level, dt);
    updateFireballs(level, dt);
  } else if (level.name === "Factory") {
    updateFactory(level, dt);
  } else if (level.name === "Rivets") {
    updateFireballs(level, dt);
  }

  updatePlayer(level, player, dt);
}

function drawBackground(level) {
  ctx.fillStyle = level.stageColor;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.fillStyle = "rgba(255,255,255,0.04)";
  for (let i = 0; i < 18; i += 1) {
    ctx.fillRect(i * 56, 0, 2, HEIGHT);
  }

  ctx.fillStyle = "rgba(248,250,252,0.05)";
  for (let i = 0; i < 10; i += 1) {
    ctx.fillRect(0, i * 72, WIDTH, 1);
  }
}

function drawGoal(level) {
  if (!level.goal) return;
  ctx.strokeStyle = COLORS.text;
  ctx.lineWidth = 3;
  ctx.strokeRect(level.goal.x, level.goal.y, level.goal.w, level.goal.h);
  ctx.fillStyle = "rgba(248,250,252,0.08)";
  ctx.fillRect(level.goal.x, level.goal.y, level.goal.w, level.goal.h);
}

function drawMover(mover) {
  ctx.fillStyle = "#e2e8f0";
  ctx.fillRect(mover.x, mover.y - mover.h, mover.w, mover.h);
  ctx.fillStyle = "rgba(248,250,252,0.2)";
  ctx.fillRect(mover.x + 6, mover.y - mover.h - 8, mover.w - 12, 5);
}

function drawHazard(hazard) {
  if (hazard.kind === "barrel") {
    ctx.fillStyle = "#92400e";
    ctx.fillRect(hazard.x, hazard.y, hazard.w, hazard.h);
    ctx.fillStyle = "#f59e0b";
    ctx.fillRect(hazard.x + 4, hazard.y + 4, hazard.w - 8, 4);
    ctx.fillRect(hazard.x + 4, hazard.y + 14, hazard.w - 8, 4);
    return;
  }
  if (hazard.kind === "spring") {
    ctx.strokeStyle = "#fca5a5";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(hazard.x, hazard.y + hazard.h);
    ctx.lineTo(hazard.x + 6, hazard.y + 6);
    ctx.lineTo(hazard.x + 12, hazard.y + hazard.h);
    ctx.lineTo(hazard.x + 18, hazard.y + 6);
    ctx.stroke();
    return;
  }
  ctx.fillStyle = hazard.color || COLORS.danger;
  ctx.fillRect(hazard.x, hazard.y, hazard.w, hazard.h);
  ctx.fillStyle = "rgba(255,255,255,0.38)";
  ctx.fillRect(hazard.x + 4, hazard.y + 4, hazard.w - 8, 4);
}

function drawRivet(rivet) {
  if (!rivet.active) return;
  ctx.fillStyle = "#fde047";
  ctx.beginPath();
  ctx.arc(rivet.x, rivet.y - 6, 7, 0, Math.PI * 2);
  ctx.fill();
}

function drawPlayer(player) {
  const pose = Math.floor(player.stepTimer) % 2;
  drawCharacter(player.x, player.y + 4, player.hammerTimer > 0 ? COLORS.hammer : COLORS.jumpman, pose);
  if (player.hammerTimer > 0) {
    ctx.save();
    ctx.translate(player.x + (player.facing > 0 ? 28 : -8), player.y + 10);
    ctx.rotate(Math.sin(player.stepTimer * 0.8) * 0.8);
    ctx.fillStyle = COLORS.hammer;
    ctx.fillRect(-8, -4, 18, 8);
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(-1, -2, 4, 24);
    ctx.restore();
  }
}

function drawHud() {
  ctx.fillStyle = "rgba(2, 6, 23, 0.72)";
  ctx.fillRect(0, 0, WIDTH, 48);
  ctx.fillStyle = COLORS.text;
  ctx.font = "bold 20px Trebuchet MS";
  ctx.fillText(`Score ${state.score}`, 20, 30);
  ctx.fillText(`Lives ${Math.max(state.lives, 0)}`, 200, 30);
  ctx.fillText(`Stage ${state.stageIndex + 1}/4`, 340, 30);
  ctx.fillText(`Loop ${state.cycle}`, 500, 30);
  ctx.fillText(state.level.name, 620, 30);
  if (state.player.hammerTimer > 0) {
    ctx.fillStyle = COLORS.hammer;
    ctx.fillText(`Hammer ${state.player.hammerTimer.toFixed(1)}s`, 780, 30);
  }
}

function drawOverlay(title, bodyLines) {
  ctx.fillStyle = "rgba(2, 6, 23, 0.72)";
  ctx.fillRect(120, 185, 720, 260);
  ctx.strokeStyle = "rgba(251, 191, 36, 0.75)";
  ctx.lineWidth = 3;
  ctx.strokeRect(120, 185, 720, 260);
  ctx.fillStyle = COLORS.text;
  ctx.font = "bold 48px Trebuchet MS";
  ctx.textAlign = "center";
  ctx.fillText(title, WIDTH / 2, 265);
  ctx.font = "22px Trebuchet MS";
  bodyLines.forEach((line, index) => {
    ctx.fillText(line, WIDTH / 2, 325 + index * 34);
  });
  ctx.textAlign = "left";
}

function render() {
  if (!state.level) {
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    return;
  }

  const level = state.level;
  drawBackground(level);

  for (const platform of level.platforms) drawPlatform(platform);
  for (const ladder of level.ladders) drawLadder(ladder);
  for (const mover of level.movers) drawMover(mover);
  for (const hammer of level.hammers) drawHammer(hammer);
  for (const rivet of level.rivets) drawRivet(rivet);
  drawGoal(level);

  drawDK(level.dk.x, level.dk.y);
  drawPauline(level.pauline.x, level.pauline.y);
  if (level.oil) {
    ctx.fillStyle = COLORS.oil;
    ctx.fillRect(level.oil.x, level.oil.y, 30, 26);
    ctx.fillStyle = COLORS.text;
    ctx.fillRect(level.oil.x + 10, level.oil.y - 8, 10, 8);
  }

  for (const hazard of level.hazards) drawHazard(hazard);
  drawPlayer(state.player);
  drawHud();

  if (state.messageTimer > 0 && state.scene === "playing") {
    drawOverlay(level.name, ["Reach Pauline, survive the hazards, and keep climbing."]);
  }
  if (state.scene === "title") {
    drawOverlay("DonKong", ["Press Enter to start.", "Jumpman cannot steer mid-air.", "Use hammers wisely."]);
  }
  if (state.scene === "stageclear") {
    drawOverlay("Stage Clear!", ["Pauline is one step closer.", "Get ready for the next challenge."]);
  }
  if (state.scene === "gameover") {
    drawOverlay("Game Over", ["Press Enter to try again.", `Final score: ${state.score}`]);
  }

  if (state.flash > 0) {
    ctx.fillStyle = `rgba(251, 113, 133, ${state.flash})`;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
  }
}

let lastTime = 0;
function frame(timestamp) {
  const dt = Math.min(0.033, (timestamp - lastTime) / 1000 || 0);
  lastTime = timestamp;

  if (state.scene === "title") {
    if (justPressed.has("Enter")) {
      startRun();
    }
  } else if (state.scene === "playing") {
    if (state.messageTimer > 0) {
      state.messageTimer = Math.max(0, state.messageTimer - dt);
    }
    updateLevel(dt);
  } else if (state.scene === "stageclear") {
    state.messageTimer -= dt;
    if (state.messageTimer <= 0) {
      nextStage();
    }
  } else if (state.scene === "gameover") {
    if (justPressed.has("Enter")) {
      startRun();
    }
  }

  render();
  justPressed.clear();
  requestAnimationFrame(frame);
}

state.level = buildBarrelStage(0);
state.player = makePlayer(state.level.playerStart.x, state.level.playerStart.y);
render();
requestAnimationFrame(frame);
