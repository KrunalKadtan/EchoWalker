
// ─────────────────────────────────────────────
// SPAWN
// ─────────────────────────────────────────────

/**
 * Populate gameState.monsters[] based on difficulty level.
 * Called from initializeGame() in game.js.
 */
function spawnMonsters(level, mapSize) {
    gameState.monsters = [];

    let count = 0;
    if      (level === 'hard')   count = 6;
    else if (level === 'medium') count = 3;
    else if (level === 'easy')   count = 1;
    // Demo: count stays 0

    for (let i = 0; i < count; i++) {
        let sx, sy;

        // Spawn far from player's starting corner (top-left)
        do {
            sx = 2 + Math.floor(Math.random() * (mapSize - 4));
            sy = 2 + Math.floor(Math.random() * (mapSize - 4));
        } while (gameState.map[sy][sx] !== 0 || (sx < 5 && sy < 5));

        gameState.monsters.push({
            id: i,
            x: sx + 0.5,
            y: sy + 0.5,
            active: true,
            lastMoveTime: Date.now() + 5000 + (i * 1000), // Stagger initial spawns
            targetInterval: level === 'hard' ? 800 : 1500,
            behavior: level === 'hard' ? 'hunt' : 'investigate',
            investigateTarget: null  // Null = wandering; set to {x,y} = converging on noise
        });
    }

    console.log(`Spawned ${count} monster(s) — behavior: ${level === 'hard' ? 'HUNT' : 'INVESTIGATE'}`);
}

// ─────────────────────────────────────────────
// AI UPDATE LOOP
// ─────────────────────────────────────────────

/**
 * Called every game loop tick.
 * Moves all active monsters, plays their positional audio,
 * and checks for player collision.
 */
function updateMonsters(now) {
    if (!gameState.monsters || !gameState.gameActive) return;

    const p = gameState.player;

    gameState.monsters.forEach(m => {
        if (!m.active) return;

        // ── Caught check (before move) ──────────────────────────────────
        if (Math.floor(m.x) === Math.floor(p.x) && Math.floor(m.y) === Math.floor(p.y)) {
            triggerJumpScare();
            return;
        }

        // ── Movement tick ───────────────────────────────────────────────
        if (now - m.lastMoveTime > m.targetInterval) {
            m.lastMoveTime = now;

            let path = null;

            if (m.behavior === 'hunt') {
                // ── HUNT: always BFS toward exact player position ──────
                path = findShortestPath(
                    gameState.map,
                    Math.floor(m.x), Math.floor(m.y),
                    Math.floor(p.x), Math.floor(p.y)
                );

            } else if (m.behavior === 'investigate') {
                // ── INVESTIGATE: BFS to noise origin, else random walk ─
                if (m.investigateTarget) {
                    path = findShortestPath(
                        gameState.map,
                        Math.floor(m.x), Math.floor(m.y),
                        Math.floor(m.investigateTarget.x), Math.floor(m.investigateTarget.y)
                    );

                    // Arrived at noise source — resume wandering
                    if (!path || path.length === 0) {
                        m.investigateTarget = null;
                    }
                }

                // Random wander when idle
                if (!m.investigateTarget) {
                    const dirs = [[0,-1],[0,1],[1,0],[-1,0]];
                    const validMoves = dirs
                        .map(([dx, dy]) => ({ x: Math.floor(m.x)+dx, y: Math.floor(m.y)+dy }))
                        .filter(n => gameState.map[n.y] && gameState.map[n.y][n.x] === 0);

                    if (validMoves.length > 0) {
                        const step = validMoves[Math.floor(Math.random() * validMoves.length)];
                        m.x = step.x + 0.5;
                        m.y = step.y + 0.5;
                    }
                }
            }

            // Apply BFS path step
            if (path && path.length > 0) {
                m.x = path[0].x + 0.5;
                m.y = path[0].y + 0.5;
            }

            // Update 3D positional audio for this monster
            if (typeof playMonsterStep === 'function') {
                playMonsterStep(m);
            }

            // ── Caught check (after move) ────────────────────────────
            if (Math.floor(m.x) === Math.floor(p.x) && Math.floor(m.y) === Math.floor(p.y)) {
                triggerJumpScare();
            }
        }

        // ── Speed governor ──────────────────────────────────────────────
        if (m.behavior === 'hunt') {
            m.targetInterval = 800;              // Relentless
        } else {
            m.targetInterval = m.investigateTarget ? 900 : 2200; // Aggro vs. wander
        }
    });
}

// ─────────────────────────────────────────────
// NOISE BROADCAST
// ─────────────────────────────────────────────

/**
 * Alert all Investigate-mode monsters to a noise at (x, y).
 * Called by game.js on footstep or sonar ping.
 */
function alertMonsters(x, y) {
    if (!gameState.monsters) return;
    gameState.monsters.forEach(m => {
        if (m.behavior === 'investigate') {
            m.investigateTarget = { x, y };
            m.lastMoveTime = 0; // Force immediate response
        }
    });
}

// ─────────────────────────────────────────────
// JUMP SCARE / GAME OVER
// ─────────────────────────────────────────────

/**
 * Triggered when any monster occupies the same tile as the player.
 * Cuts all audio, plays jump scare screech, shows SYSTEM FAILURE screen.
 */
function triggerJumpScare() {
    if (!gameState.gameActive) return;
    gameState.gameActive = false;

    showMap = false;
    if (mapCanvas) mapCanvas.style.display = 'none';

    stopAllAudio();
    if (typeof playJumpScareLevel === 'function') playJumpScareLevel();

    const victoryScreen = document.getElementById('victoryScreen');
    if (victoryScreen) {
        victoryScreen.style.backgroundColor = '#4a0000';
        setTimeout(() => victoryScreen.style.backgroundColor = '', 500);

        victoryScreen.querySelector('h2').textContent           = 'YOU WERE CAUGHT';
        victoryScreen.querySelector('h2').style.color           = '#ff0000';
        victoryScreen.querySelector('.icon-header').textContent = '🩸';
        victoryScreen.querySelector('.subtitle').textContent    = 'The Monster found you.';

        const statsElem = document.getElementById('stats');
        if (statsElem) statsElem.innerHTML = '';

        victoryScreen.classList.remove('hidden');
        victoryScreen.classList.add('fade-up');
    }

    const gameHUD = document.getElementById('gameHUD');
    if (gameHUD) gameHUD.classList.add('hidden');

    console.log('SLAIN BY MONSTER - GAME OVER');
}

console.log('Monster module loaded');
