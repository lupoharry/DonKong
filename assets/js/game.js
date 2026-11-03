import { updateHazards } from "./hazards.js";
import { endFrame, initInput, wasPressed } from "./input.js";
import { updatePlayer } from "./player.js";
import { initRenderer, render } from "./renderer.js";
import { nextStage, showTitleStage, startRun, state } from "./state.js";

const MAX_DT = 0.033;

function update(dt) {
  switch (state.scene) {
    case "title":
    case "gameover":
      if (wasPressed("Enter")) startRun();
      break;
    case "playing":
      state.messageTimer = Math.max(0, state.messageTimer - dt);
      state.flash = Math.max(0, state.flash - dt);
      updateHazards(state.level, dt);
      updatePlayer(state.level, state.player, dt);
      break;
    case "stageclear":
      state.messageTimer -= dt;
      if (state.messageTimer <= 0) nextStage();
      break;
  }
}

export function startGame(canvas) {
  initInput();
  initRenderer(canvas);
  showTitleStage();
  render();

  let lastTime = 0;
  const frame = (timestamp) => {
    const dt = Math.min(MAX_DT, (timestamp - lastTime) / 1000 || 0);
    lastTime = timestamp;
    update(dt);
    render();
    endFrame();
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}
