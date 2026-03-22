let gameState = {
    currentLevel: 'demo',
    map: null,
    player: { x: 2.5, y: 2.5, angle: 0 },
    exit: { x: 0, y: 0 },
    monsters: [],
    pathMap: null,
    currentWaypoint: null,
    startTime: 0,
    steps: 0,
    pings: 0,
    collisions: 0,
    energy: 100,
    gameActive: false,
    viewMode: 'map'
};

let lastUpdateTime = 0;
const UPDATE_INTERVAL = 16;

let showMap = false;
let mapCanvas = null;
let mapCtx = null;

let footstepTimer = null;

function updateEnergyHUD() {
    const energyElem = document.getElementById('hud-energy');
    if (energyElem) {
        energyElem.textContent = gameState.energy + '%';
        if (gameState.energy > 50) energyElem.style.color = '#0f0';
        else if (gameState.energy > 25) energyElem.style.color = '#ff0';
        else energyElem.style.color = '#f00';
    }
}

function triggerEnergyDeath() {
    if (!gameState.gameActive) return;
    gameState.gameActive = false;
    
    showMap = false;
    if (mapCanvas) mapCanvas.style.display = 'none';
    
    stopAllAudio();
    
    const victoryScreen = document.getElementById('victoryScreen');
    if (victoryScreen) {
        victoryScreen.querySelector('h2').textContent = 'POWER FAILURE';
        victoryScreen.querySelector('h2').style.color = '#ff8800';
        victoryScreen.querySelector('.icon-header').textContent = '🔋';
        victoryScreen.querySelector('.subtitle').textContent = 'Energy depleted. Systems offline.';
        
        const statsElem = document.getElementById('stats');
        if (statsElem) statsElem.innerHTML = '';
        
        victoryScreen.classList.remove('hidden');
        victoryScreen.classList.add('fade-up');
    }
    
    const gameHUD = document.getElementById('gameHUD');
    if (gameHUD) gameHUD.classList.add('hidden');
    
    console.log('ENERGY DEPLETED - GAME OVER');
}

function initializeGame(level) {
    console.log('='.repeat(60));
    console.log('ECHOWALKER - Initializing Game');
    console.log('='.repeat(60));
    console.log(`Level: ${LEVELS[level].name} (${LEVELS[level].size}×${LEVELS[level].size})`);
    
    const mapSize = LEVELS[level].size;
    gameState.map = generateMaze(mapSize);
    gameState.currentLevel = level;
    
    gameState.player = { x: 2.5, y: 2.5, angle: 135 };
    gameState.exit = { x: mapSize - 2.5, y: mapSize - 2.5 };
    
    gameState.startTime = Date.now();
    gameState.steps = 0;
    gameState.pings = 0;
    gameState.collisions = 0;
    gameState.energy = 100;
    gameState.gameActive = true;
    
    updateEnergyHUD();
    
    // Build BFS solution tree
    const exitX = Math.floor(gameState.exit.x);
    const exitY = Math.floor(gameState.exit.y);
    gameState.pathMap = buildPathMap(gameState.map, exitX, exitY);
    gameState.currentWaypoint = { x: gameState.exit.x, y: gameState.exit.y };
    
    console.log('Player start:', gameState.player);
    console.log('Exit location:', gameState.exit);
    console.log('='.repeat(60));
    
    // Spawn monsters
    spawnMonsters(level, mapSize);
    
    updateOceanPosition(gameState.currentWaypoint);
    updateListenerPosition();
    updateOceanVolume(gameState.player, gameState.exit);
}

function updateWaypoint() {
    if (!gameState.pathMap || !gameState.gameActive) return;
    
    const px = Math.floor(gameState.player.x);
    const py = Math.floor(gameState.player.y);
    
    let current = { x: px, y: py };
    for (let i = 0; i < 6; i++) {
        const next = gameState.pathMap[current.y][current.x];
        if (!next) break;
        current = next;
    }
    
    gameState.currentWaypoint = {
        x: current.x + 0.5,
        y: current.y + 0.5
    };
}

function updateListenerPosition() {
    const audioCtx = getAudioContext();
    const panner = getExitPanner();
    
    if (!audioCtx || !panner || !gameState.gameActive) return;
    
    const { player } = gameState;
    
    audioCtx.listener.positionX.value = player.x * TILE_SIZE;
    audioCtx.listener.positionY.value = 0;
    audioCtx.listener.positionZ.value = player.y * TILE_SIZE;
    
    const angleRad = (player.angle * Math.PI) / 180;
    const forwardX = Math.sin(angleRad);
    const forwardZ = -Math.cos(angleRad);
    
    audioCtx.listener.forwardX.value = forwardX;
    audioCtx.listener.forwardY.value = 0;
    audioCtx.listener.forwardZ.value = forwardZ;
    
    audioCtx.listener.upX.value = 0;
    audioCtx.listener.upY.value = 1;
    audioCtx.listener.upZ.value = 0;
    
    updateOceanVolume(player, gameState.exit);
}

function checkWinCondition() {
    const { player, exit } = gameState;
    const distance = Math.sqrt(
        (player.x - exit.x) ** 2 + 
        (player.y - exit.y) ** 2
    );
    
    if (distance < 1.5) {
        winGame();
        return true;
    }
    
    return false;
}

function winGame() {
    if (!gameState.gameActive) return;
    
    gameState.gameActive = false;
    stopAllAudio();
    
    const elapsedTime = ((Date.now() - gameState.startTime) / 1000).toFixed(1);
    
    // Save best time
    const bestKey = 'echo_best_' + gameState.currentLevel;
    const prevBest = localStorage.getItem(bestKey);
    if (!prevBest || parseFloat(elapsedTime) < parseFloat(prevBest)) {
        localStorage.setItem(bestKey, elapsedTime);
        if (typeof updateBestTimeUI === 'function') updateBestTimeUI();
    }
    
    console.log('='.repeat(60));
    console.log('VICTORY!');
    console.log('='.repeat(60));
    console.log('Statistics:');
    console.log(`  Time: ${elapsedTime}s`);
    console.log(`  Steps: ${gameState.steps}`);
    console.log(`  Sonar pings: ${gameState.pings}`);
    console.log(`  Collisions: ${gameState.collisions}`);
    console.log(`  Energy remaining: ${gameState.energy}%`);
    console.log('='.repeat(60));
    
    playVictorySound();
    
    // Show victory screen
    const victoryScreen = document.getElementById('victoryScreen');
    if (victoryScreen) {
        victoryScreen.querySelector('h2').textContent = 'VICTORY!';
        victoryScreen.querySelector('h2').style.color = '#00ffcc';
        victoryScreen.querySelector('.icon-header').textContent = '🎉';
        victoryScreen.querySelector('.subtitle').textContent = 'Signal Intercepted & Extraction Complete';
        
        const statsElem = document.getElementById('stats');
        if (statsElem) {
            statsElem.innerHTML = `
                <div class="stat-item"><div class="stat-label">Time</div><div class="stat-value highlight">${elapsedTime}s</div></div>
                <div class="stat-item"><div class="stat-label">Steps</div><div class="stat-value">${gameState.steps}</div></div>
                <div class="stat-item"><div class="stat-label">Sonar</div><div class="stat-value">${gameState.pings}</div></div>
                <div class="stat-item"><div class="stat-label">Collisions</div><div class="stat-value">${gameState.collisions}</div></div>
                <div class="stat-item"><div class="stat-label">Energy</div><div class="stat-value ${gameState.energy > 50 ? 'highlight' : 'warning'}">${gameState.energy}%</div></div>
            `;
        }
        
        victoryScreen.classList.remove('hidden');
        victoryScreen.classList.add('fade-up');
    }
    
    const gameHUD = document.getElementById('gameHUD');
    if (gameHUD) gameHUD.classList.add('hidden');
    
    showMap = false;
    if (mapCanvas) mapCanvas.style.display = 'none';
}

function stopAllAudio() {
    const audioCtx = getAudioContext();
    if (!audioCtx) return;
    
    console.log('Stopping all game audio...');
    
    if (window.oceanWaveNodes && window.oceanWaveNodes.length > 0) {
        window.oceanWaveNodes.forEach(node => {
            try {
                if (node.noise) node.noise.stop();
                if (node.lfo) node.lfo.stop();
                if (node.ampLFO) node.ampLFO.stop();
            } catch(e) {}
        });
    }
    
    const master = getMasterGain();
    if (master) {
        const now = audioCtx.currentTime;
        master.gain.linearRampToValueAtTime(0, now + 0.3);
    }
    
    console.log('All audio stopped');
}

// ========== DEBUG MAP ==========
function createMapCanvas() {
    mapCanvas = document.createElement('canvas');
    mapCanvas.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        border: 2px solid rgba(0, 255, 204, 0.3);
        border-radius: 16px;
        background: rgba(2, 10, 20, 0.95);
        z-index: 1000;
        box-shadow: 0 20px 60px rgba(0,0,0,0.8), 0 0 40px rgba(0, 255, 204, 0.2);
        backdrop-filter: blur(10px);
        display: none;
    `;
    document.body.appendChild(mapCanvas);
    mapCtx = mapCanvas.getContext('2d');

    console.log('Debug map visible (Press M to toggle)');
}

function drawDebugMap() {
    if (!showMap || !gameState.map || !mapCanvas) return;

    const mapSize = gameState.map.length;
    const canvasSize = 550;
    const cellSize = canvasSize / mapSize;

    mapCanvas.width = canvasSize;
    mapCanvas.height = canvasSize + 120;

    mapCtx.fillStyle = 'rgba(2, 10, 20, 0.95)';
    mapCtx.fillRect(0, 0, canvasSize, canvasSize + 120);

    mapCtx.shadowBlur = 10;
    mapCtx.shadowColor = '#00ffcc';
    mapCtx.lineWidth = 1;

    // Draw maze walls (neon rounded rects)
    for (let y = 0; y < mapSize; y++) {
        for (let x = 0; x < mapSize; x++) {
            if (gameState.map[y][x] === 1) {
                mapCtx.strokeStyle = 'rgba(0, 255, 204, 0.4)';
                mapCtx.fillStyle = 'rgba(0, 255, 204, 0.05)';
                mapCtx.beginPath();
                mapCtx.roundRect(x * cellSize + 2, y * cellSize + 2, cellSize - 4, cellSize - 4, 6);
                mapCtx.fill();
                mapCtx.stroke();
            }
        }
    }

    // Draw exit (glowing blue rounded rect)
    mapCtx.shadowColor = '#00aaff';
    mapCtx.strokeStyle = '#00aaff';
    mapCtx.fillStyle = 'rgba(0, 170, 255, 0.2)';
    mapCtx.beginPath();
    mapCtx.roundRect(
        (gameState.exit.x - 0.5) * cellSize,
        (gameState.exit.y - 0.5) * cellSize,
        cellSize * 1.5,
        cellSize * 1.5,
        12
    );
    mapCtx.fill();
    mapCtx.stroke();

    // Draw sonar ray (gradient laser)
    const angleRad = (gameState.player.angle * Math.PI) / 180;
    const rayDist = castRay(gameState.player.x, gameState.player.y, gameState.player.angle, gameState.map, 5);
    const rayEndX = gameState.player.x + Math.sin(angleRad) * rayDist;
    const rayEndY = gameState.player.y - Math.cos(angleRad) * rayDist;

    const grad = mapCtx.createLinearGradient(
        gameState.player.x * cellSize, gameState.player.y * cellSize,
        rayEndX * cellSize, rayEndY * cellSize
    );
    const rayColor = rayDist < 1.5 ? '255, 80, 80' : '0, 255, 204';
    grad.addColorStop(0, `rgba(${rayColor}, 0.9)`);
    grad.addColorStop(1, `rgba(${rayColor}, 0.1)`);

    mapCtx.shadowColor = `rgba(${rayColor}, 0.8)`;
    mapCtx.strokeStyle = grad;
    mapCtx.lineWidth = 3;
    mapCtx.setLineDash([]);
    mapCtx.beginPath();
    mapCtx.moveTo(gameState.player.x * cellSize, gameState.player.y * cellSize);
    mapCtx.lineTo(rayEndX * cellSize, rayEndY * cellSize);
    mapCtx.stroke();

    mapCtx.fillStyle = `rgba(${rayColor}, 1)`;
    mapCtx.beginPath();
    mapCtx.arc(rayEndX * cellSize, rayEndY * cellSize, 4, 0, Math.PI * 2);
    mapCtx.fill();

    // Draw monsters (red glowing circles)
    if (gameState.monsters) {
        gameState.monsters.forEach(m => {
            if (!m.active) return;
            mapCtx.shadowColor = '#ff0000';
            mapCtx.fillStyle = '#ff0000';
            mapCtx.beginPath();
            mapCtx.arc(m.x * cellSize, m.y * cellSize, cellSize * 0.4, 0, Math.PI * 2);
            mapCtx.fill();
        });
    }

    // Draw player (glowing cyan circle)
    mapCtx.shadowColor = '#00ffcc';
    mapCtx.fillStyle = '#00ffcc';
    mapCtx.beginPath();
    mapCtx.arc(
        gameState.player.x * cellSize,
        gameState.player.y * cellSize,
        cellSize * 0.25,
        0,
        Math.PI * 2
    );
    mapCtx.fill();

    // Draw facing direction line
    const lineLength = cellSize * 2;
    const endX = gameState.player.x * cellSize + Math.sin(angleRad) * lineLength;
    const endY = gameState.player.y * cellSize - Math.cos(angleRad) * lineLength;
    mapCtx.strokeStyle = '#fff';
    mapCtx.lineWidth = 2;
    mapCtx.beginPath();
    mapCtx.moveTo(gameState.player.x * cellSize, gameState.player.y * cellSize);
    mapCtx.lineTo(endX, endY);
    mapCtx.stroke();

    // Info panel text
    mapCtx.shadowBlur = 0;
    const dist = Math.sqrt(
        (gameState.player.x - gameState.exit.x) ** 2 +
        (gameState.player.y - gameState.exit.y) ** 2
    );

    mapCtx.fillStyle = '#00ffcc';
    mapCtx.font = 'bold 16px monospace';
    const y0 = canvasSize + 25;
    mapCtx.fillText(`Pos: (${gameState.player.x.toFixed(1)}, ${gameState.player.y.toFixed(1)})`, 15, y0);
    mapCtx.fillText(`Angle: ${Math.round(gameState.player.angle)}° | Sonar: ${rayDist.toFixed(1)}t`, 15, y0 + 25);
    mapCtx.fillText(`Steps: ${gameState.steps} | Pings: ${gameState.pings} | Energy: ${gameState.energy}%`, 15, y0 + 50);

    mapCtx.fillStyle = dist < 3 ? '#00aaff' : '#00ffcc';
    mapCtx.fillText(`EXIT: ${dist.toFixed(1)} tiles`, 15, y0 + 75);
}

document.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'm') {
        showMap = !showMap;
        if (mapCanvas) {
            mapCanvas.style.display = showMap ? 'block' : 'none';
        }
        console.log(`Map ${showMap ? 'SHOWN' : 'HIDDEN'}`);
    }
});

function updateFootstepTiming(now) {
    const mode = getMovementMode();
    const intervals = { creep: 800, walk: 500, run: 300 };
    const interval = intervals[mode];
    
    if (isMoving()) {
        if (!footstepTimer || now - footstepTimer > interval) {
            playFootstep();
            footstepTimer = now;
        }
    }
}

function gameLoop(currentTime) {
    if (currentTime - lastUpdateTime > UPDATE_INTERVAL) {
        if (gameState.gameActive) {
            updateWaypoint();
            updateOceanPosition(gameState.currentWaypoint);
            updateListenerPosition();
            updateMonsters(currentTime);
            updateFootstepTiming(currentTime);
            checkWinCondition();
            drawDebugMap();
        }
        lastUpdateTime = currentTime;
    }
    
    requestAnimationFrame(gameLoop);
}

function startGame(level = 'demo') {
    console.log('Starting EchoWalker...');
    
    if (!getAudioContext()) {
        console.error('Audio not initialized!');
        return;
    }
    
    resetOceanLerp();   // Clear stale interpolation from previous session

    const master = getMasterGain();
    const audioCtx = getAudioContext();
    if (master && audioCtx) {
        master.gain.cancelScheduledValues(audioCtx.currentTime);
        master.gain.setValueAtTime(0.8, audioCtx.currentTime);
    }

    createOceanWaves();
    initializeGame(level);

    // Always destroy any old canvas and build fresh (ensures new styles apply immediately)
    if (mapCanvas) { mapCanvas.remove(); mapCanvas = null; }
    createMapCanvas();
    
    initKeyboardControls(
        (direction) => {
            const result = movePlayer(gameState.player, gameState.map, direction);
            if (result.moved) {
                gameState.steps++;
                
                // Alert monsters on walk/run, not creep
                const mode = getMovementMode();
                if (mode === 'walk' || mode === 'run') {
                    alertMonsters(
                        Math.floor(gameState.player.x), 
                        Math.floor(gameState.player.y)
                    );
                }
            } else {
                gameState.collisions++;

                alertMonsters(
                    Math.floor(gameState.player.x), 
                    Math.floor(gameState.player.y)
                );
                
                gameState.energy = Math.max(0, gameState.energy - 5);
                updateEnergyHUD();
                
                if (gameState.energy === 0) {
                    triggerEnergyDeath();
                }
            }
        },
        (direction) => {
            rotatePlayer(gameState.player, direction);
        },
        
        () => {
            if (gameState.energy < 2) {
                if (typeof playSonarError === 'function') playSonarError();
                console.log('Not enough energy for sonar');
                return;
            }
            
            gameState.energy -= 2;
            updateEnergyHUD();
            gameState.pings++;
            
            const result = fireSonarPing(gameState.player, gameState.map);
            
            if (result) {
                
                alertMonsters(
                    Math.floor(gameState.player.x), 
                    Math.floor(gameState.player.y)
                );
            }
        },
        (newMode) => {
            console.log(`Speed: ${newMode}`);
            if (typeof playModeChangeSound === 'function') playModeChangeSound(newMode);
            
            // Update HUD
            const modeElem = document.getElementById('hud-mode');
            if (modeElem) {
                modeElem.textContent = newMode.toUpperCase();
            }
        }
    );
    
    // Show game HUD
    const gameHUD = document.getElementById('gameHUD');
    if (gameHUD) {
        gameHUD.classList.remove('hidden');
    }
    
    requestAnimationFrame(gameLoop);
    
    console.log('Game started!');
    console.log('Press M to toggle debug map');
}

console.log('Game module loaded');
