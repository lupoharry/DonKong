import { GAME_KEYS } from "./constants.js";

const down = new Set();
const pressed = new Set();

export function initInput(target = window) {
  target.addEventListener("keydown", (event) => {
    if (GAME_KEYS.includes(event.code)) {
      event.preventDefault();
    }
    if (!down.has(event.code)) {
      pressed.add(event.code);
    }
    down.add(event.code);
  });

  target.addEventListener("keyup", (event) => {
    down.delete(event.code);
  });

  target.addEventListener("blur", () => down.clear());
}

export const isDown = (code) => down.has(code);
export const wasPressed = (code) => pressed.has(code);
export const endFrame = () => pressed.clear();
