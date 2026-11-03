import { COLORS } from "./constants.js";
import { makeLadder, makePlatform, platformYAt } from "./geometry.js";

const floorPlatform = (y, x1 = 90, x2 = 870) => makePlatform(x1, y, x2, y, { color: COLORS.floor });
const hammerOn = (platform, x) => ({ x, y: platformYAt(platform, x) - 18, active: true });

function buildGirders(difficulty) {
  const platforms = [
    makePlatform(110, 120, 860, 150),
    makePlatform(100, 240, 850, 210),
    makePlatform(110, 330, 860, 360),
    makePlatform(100, 450, 850, 420),
    makePlatform(110, 570, 860, 600),
    makePlatform(90, 675, 870, 645, { color: COLORS.floor }),
  ];
  return {
    id: "girders",
    name: "Girders",
    stageColor: "#0f172a",
    platforms,
    ladders: [
      makeLadder(760, 145, 220),
      makeLadder(220, 205, 335),
      makeLadder(700, 355, 425),
      makeLadder(280, 415, 575),
      makeLadder(810, 580, 648),
      makeLadder(640, 140, 238),
    ],
    movers: [],
    hammers: [
      hammerOn(platforms[0], 400),
      hammerOn(platforms[1], 450),
      hammerOn(platforms[2], 520),
      hammerOn(platforms[3], 500),
      hammerOn(platforms[4], 450),
      hammerOn(platforms[5], 500),
    ],
    rivets: [],
    goal: { x: 795, y: 74, w: 60, h: 60 },
    playerStart: { x: 120, y: 646 },
    dk: { x: 110, y: 70 },
    pauline: { x: 820, y: 72 },
    hazards: [],
    spawnTimers: { barrel: 0 },
    difficulty,
  };
}

function buildElevators(difficulty) {
  const moverSpeed = 110 + difficulty * 10;
  const platforms = [
    makePlatform(120, 130, 360, 130),
    makePlatform(520, 130, 840, 130),
    makePlatform(120, 315, 360, 315),
    makePlatform(520, 315, 840, 315),
    makePlatform(120, 500, 360, 500),
    makePlatform(520, 500, 840, 500),
    floorPlatform(675),
  ];
  return {
    id: "elevators",
    name: "Elevators",
    stageColor: "#111827",
    platforms,
    ladders: [
      makeLadder(230, 505, 675),
      makeLadder(730, 320, 500),
      makeLadder(230, 135, 315),
      makeLadder(730, 135, 315),
    ],
    movers: [
      { x: 400, y: 630, w: 80, h: 12, top: 180, bottom: 630, speed: moverSpeed, dir: -1, dx: 0, dy: 0 },
      { x: 400, y: 400, w: 80, h: 12, top: 180, bottom: 630, speed: moverSpeed, dir: 1, dx: 0, dy: 0 },
    ],
    hammers: [
      hammerOn(platforms[1], 600),
      hammerOn(platforms[2], 300),
      hammerOn(platforms[5], 600),
      hammerOn(platforms[6], 500),
    ],
    rivets: [],
    goal: { x: 760, y: 70, w: 50, h: 60 },
    playerStart: { x: 130, y: 640 },
    dk: { x: 720, y: 70 },
    pauline: { x: 795, y: 72 },
    hazards: [],
    fireSpawn: { x: 550, platformIndex: 5 },
    spawnTimers: { spring: 0, fire: 0 },
    difficulty,
  };
}

function buildFactory(difficulty) {
  const platforms = [
    makePlatform(110, 170, 840, 170, { conveyor: 42 }),
    makePlatform(110, 350, 840, 350, { conveyor: -55 }),
    makePlatform(110, 530, 840, 530, { conveyor: 42 }),
    floorPlatform(675),
  ];
  return {
    id: "factory",
    name: "Factory",
    stageColor: "#0b1220",
    platforms,
    ladders: [makeLadder(740, 535, 675), makeLadder(190, 355, 535), makeLadder(760, 175, 355)],
    movers: [],
    hammers: [
      hammerOn(platforms[0], 450),
      hammerOn(platforms[1], 460),
      hammerOn(platforms[2], 650),
      hammerOn(platforms[3], 450),
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

function buildRivets(difficulty) {
  const rivetPositions = [
    [210, 160],
    [760, 160],
    [170, 315],
    [810, 315],
    [220, 470],
    [760, 470],
    [160, 675],
    [820, 675],
  ];
  const platforms = [
    makePlatform(160, 160, 810, 160),
    makePlatform(120, 315, 850, 315),
    makePlatform(160, 470, 810, 470),
    floorPlatform(675),
  ];
  return {
    id: "rivets",
    name: "Rivets",
    stageColor: "#1f2937",
    platforms,
    ladders: [makeLadder(720, 475, 675), makeLadder(240, 320, 475), makeLadder(680, 165, 320)],
    movers: [],
    hammers: [
      hammerOn(platforms[0], 450),
      hammerOn(platforms[1], 450),
      hammerOn(platforms[2], 450),
      hammerOn(platforms[3], 450),
    ],
    rivets: rivetPositions.map(([x, y]) => ({ x, y, active: true })),
    goal: null,
    playerStart: { x: 120, y: 640 },
    dk: { x: 760, y: 110 },
    pauline: { x: 220, y: 112 },
    hazards: [],
    fireSpawn: { x: 130, platformIndex: 3 },
    spawnTimers: { fire: 0 },
    difficulty,
  };
}

export const levelBuilders = [buildGirders, buildElevators, buildFactory, buildRivets];
