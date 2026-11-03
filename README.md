# DonKong

A Donkey Kong-inspired game that runs in a web page. It targets a server running **PHP 8.3 with FastCGI (PHP-FPM / FastCGI)**: PHP renders the page, and the game itself runs in the browser on a `<canvas>` using plain ES modules (no build step).

## Brief

Donkey Kong is the escaped pet ape of a carpenter named Jumpman. Seeking revenge for being mistreated, the ape kidnaps Jumpman's girlfriend, Pauline (originally just called "Lady"), and carries her to the top of a dangerous construction site. The player controls Jumpman as he scales the scaffolding to rescue her.

Visual reference: [Donkey Kong gameplay screenshot](https://en.wikipedia.org/wiki/Donkey_Kong_%281981_video_game%29#/media/File:Donkey_Kong_Gameplay.png)

## Core mechanics

- **Movement:** Jumpman runs left and right, climbs ladders, and jumps. He cannot steer mid-air, and falling from a height greater than his own stature is fatal.
- **The hammer:** Glowing hammers grant a few seconds of invincibility; touching barrels, fireballs and other hazards shatters them for points. Jumpman cannot climb ladders or jump while holding the hammer.

## The four stages

The stages loop with increasing difficulty.

1. **Girders (75m), the barrel stage:** a zigzagging scaffold. DonKong rolls barrels down the ramps; some drop down ladders at random. Dodge them and reach the top.
2. **Elevators (50m), the precision stage:** time jumps between two vertical elevators while avoiding bouncing springs and wandering fireballs.
3. **Factory (25m), the conveyor stage:** conveyor belts that change direction carry cement pans, and fire creatures roam the level.
4. **Rivets (100m), the final confrontation:** remove all eight rivets to bring the structure down and reunite Jumpman with Pauline. The game then loops at a harder speed.

## Controls

| Key | Action |
| --- | --- |
| ← → | Move |
| ↑ ↓ | Climb ladders |
| Space | Jump |
| Enter | Start / restart |

## Project layout

```
index.php            Page template (PHP 8.3, strict types, escaped output, cache-busted assets)
src/content.php      Page copy: controls, rules, stage list
assets/css/          Styles
assets/js/
  main.js            Entry point
  game.js            Game loop and scene updates
  state.js           Shared game state and stage flow (lives, score, stage changes)
  levels.js          Stage definitions
  entities.js        Player and hazard factories
  hazards.js         Per-stage hazard and elevator updates
  player.js          Player movement, physics, pickups, collisions
  geometry.js        Platform and ladder helpers
  renderer.js        Canvas drawing
  input.js           Keyboard handling
  constants.js       Dimensions, colours, tuning values
  utils.js           Math helpers
```

## Run locally

Install PHP (on Windows: `winget install PHP`), then from the project folder:

```powershell
php -l index.php
php -S localhost:8000
```

Open <http://localhost:8000/>.

## Deploy

Copy the whole folder to any web root served by PHP 8.3 through FastCGI. No Composer, database or build step is required. The server must serve `.js` files with a JavaScript MIME type (the default on nginx, Apache and IIS) because the game uses ES modules.