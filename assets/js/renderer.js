import { COLORS, HEIGHT, WIDTH } from "./constants.js";
import { state } from "./state.js";

let ctx = null;

export function initRenderer(canvas) {
  ctx = canvas.getContext("2d");
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

function drawHammerPickup(hammer) {
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

function drawOil(oil) {
  ctx.fillStyle = COLORS.oil;
  ctx.fillRect(oil.x, oil.y, 30, 26);
  ctx.fillStyle = COLORS.text;
  ctx.fillRect(oil.x + 10, oil.y - 8, 10, 8);
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

function drawGoal(goal) {
  if (!goal) return;
  ctx.strokeStyle = COLORS.text;
  ctx.lineWidth = 3;
  ctx.strokeRect(goal.x, goal.y, goal.w, goal.h);
  ctx.fillStyle = "rgba(248,250,252,0.08)";
  ctx.fillRect(goal.x, goal.y, goal.w, goal.h);
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

function drawSceneOverlay(level) {
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
}

export function render() {
  const level = state.level;
  if (!level) {
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    return;
  }

  drawBackground(level);
  level.platforms.forEach(drawPlatform);
  level.ladders.forEach(drawLadder);
  level.movers.forEach(drawMover);
  level.hammers.forEach(drawHammerPickup);
  level.rivets.forEach(drawRivet);
  drawGoal(level.goal);

  drawDK(level.dk.x, level.dk.y);
  drawPauline(level.pauline.x, level.pauline.y);
  if (level.oil) drawOil(level.oil);

  level.hazards.forEach(drawHazard);
  drawPlayer(state.player);
  drawHud();
  drawSceneOverlay(level);

  if (state.flash > 0) {
    ctx.fillStyle = `rgba(251, 113, 133, ${state.flash})`;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
  }
}
