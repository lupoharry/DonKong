<?php

declare(strict_types=1);

const ASSET_DIR = __DIR__ . '/assets';

$content = require __DIR__ . '/src/content.php';

function e(string $value): string
{
    return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

// Appends the file mtime so browsers refetch assets after a deploy.
function asset(string $path): string
{
    $mtime = @filemtime(ASSET_DIR . '/' . $path);

    return 'assets/' . e($path) . ($mtime !== false ? '?v=' . $mtime : '');
}

header('Content-Type: text/html; charset=UTF-8');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: same-origin');
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title><?= e($content['title']) ?></title>
  <link rel="stylesheet" href="<?= asset('css/styles.css') ?>">
</head>
<body>
  <main class="layout">
    <section class="panel game-panel">
      <div class="hud-copy">
        <div>
          <p class="eyebrow">Jumpman vs DonKong</p>
          <h1><?= e($content['title']) ?></h1>
        </div>
        <p class="tagline"><?= e($content['tagline']) ?></p>
      </div>
      <canvas id="game" width="<?= (int) $content['canvas']['width'] ?>" height="<?= (int) $content['canvas']['height'] ?>" aria-label="DonKong game canvas"></canvas>
    </section>

    <aside class="panel sidebar">
      <section>
        <h2>Controls</h2>
        <ul>
<?php foreach ($content['controls'] as [$keys, $action]): ?>
          <li><strong><?= e($keys) ?></strong> <?= e($action) ?></li>
<?php endforeach; ?>
        </ul>
      </section>

      <section>
        <h2>How to play</h2>
        <ul>
<?php foreach ($content['rules'] as $rule): ?>
          <li><?= e($rule) ?></li>
<?php endforeach; ?>
        </ul>
      </section>

      <section>
        <h2>Stages</h2>
        <ol>
<?php foreach ($content['stages'] as $stage): ?>
          <li><?= e($stage) ?></li>
<?php endforeach; ?>
        </ol>
      </section>
    </aside>
  </main>

  <noscript>This game needs JavaScript enabled.</noscript>
  <script type="module" src="<?= asset('js/main.js') ?>"></script>
</body>
</html>
