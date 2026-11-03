<?php

declare(strict_types=1);

return [
    'title' => 'DonKong',
    'tagline' => 'A Donkey Kong-inspired browser game built for plain PHP hosting.',
    'canvas' => ['width' => 960, 'height' => 720],
    'controls' => [
        ['← →', 'move'],
        ['↑ ↓', 'climb ladders'],
        ['Space', 'jump'],
        ['Enter', 'start / restart'],
    ],
    'rules' => [
        'Climb four themed stages to rescue Pauline.',
        'Jumpman cannot steer while airborne.',
        "Falling farther than Jumpman's height costs a life.",
        'Pick up glowing hammers to smash hazards, but you cannot jump or climb while swinging one.',
        'Clear all rivets in the final stage to topple DonKong and loop at a harder speed.',
    ],
    'stages' => ['Girders', 'Elevators', 'Factory', 'Rivets'],
];
