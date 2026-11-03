import { STARTING_LIVES } from "./constants.js";
import { makePlayer } from "./entities.js";
import { levelBuilders } from "./levels.js";

export const state = {
  scene: "title",
  cycle: 1,
  stageIndex: 0,
  score: 0,
  lives: STARTING_LIVES,
  level: null,
  player: null,
  messageTimer: 0,
  flash: 0,
};

export function loadStage() {
  const builder = levelBuilders[state.stageIndex % levelBuilders.length];
  state.level = builder(state.cycle - 1);
  state.player = makePlayer(state.level.playerStart.x, state.level.playerStart.y);
  state.messageTimer = 1.2;
  state.flash = 0;
}

export function showTitleStage() {
  loadStage();
  state.messageTimer = 0;
}

export function startRun() {
  state.scene = "playing";
  state.score = 0;
  state.lives = STARTING_LIVES;
  state.cycle = 1;
  state.stageIndex = 0;
  loadStage();
}

export function loseLife() {
  if (state.scene !== "playing") return;
  state.lives -= 1;
  state.flash = 0.35;
  if (state.lives <= 0) {
    state.scene = "gameover";
    return;
  }
  loadStage();
}

export function clearStage(bonus) {
  state.score += bonus;
  state.scene = "stageclear";
  state.messageTimer = 2.4;
}

export function nextStage() {
  state.stageIndex += 1;
  if (state.stageIndex >= levelBuilders.length) {
    state.stageIndex = 0;
    state.cycle += 1;
  }
  state.scene = "playing";
  loadStage();
}
