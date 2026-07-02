<?php
?><!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DonKong</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <main class="layout">
    <section class="panel game-panel">
      <div class="hud-copy">
        <div>
          <p class="eyebrow">Jumpman vs DonKong</p>
          <h1>DonKong</h1>
        </div>
        <p class="tagline">A Donkey Kong-inspired browser game built for plain PHP hosting.</p>
      </div>
      <canvas id="game" width="960" height="720" aria-label="DonKong game canvas"></canvas>
    </section>

    <aside class="panel sidebar">
      <section>
        <h2>Controls</h2>
        <ul>
          <li><strong>← →</strong> move</li>
          <li><strong>↑ ↓</strong> climb ladders</li>
          <li><strong>Space</strong> jump</li>
          <li><strong>Enter</strong> start / restart</li>
        </ul>
      </section>

      <section>
        <h2>How to play</h2>
        <ul>
          <li>Climb four themed stages to rescue Pauline.</li>
          <li>Jumpman cannot steer while airborne.</li>
          <li>Falling farther than Jumpman's height costs a life.</li>
          <li>Pick up glowing hammers to smash hazards, but you cannot jump or climb while swinging one.</li>
          <li>Clear all rivets in the final stage to topple DonKong and loop at a harder speed.</li>
        </ul>
      </section>

      <section>
        <h2>Stages</h2>
        <ol>
          <li>Girders</li>
          <li>Elevators</li>
          <li>Factory</li>
          <li>Rivets</li>
        </ol>
      </section>
    </aside>
  </main>

  <script src="game.js"></script>
</body>
</html>
