/**
 * Main Game Controller
 * Authors: Krunal Kadtan & Vansh
 */

let gameState = {
    currentLevel: 'easy',
    map: null,
    player: { x: 2.5, y: 2.5, angle: 0 },
    exit: { x: 0, y: 0 },
    startTime: 0,
    steps: 0,
    pings: 0,
    collisions: 0,
    gameActive: false,
    viewMode: 'map'
};

let lastUpdateTime = 0;
const UPDATE_INTERVAL = 16;

const FALLBACK_LEVEL = `
1111111
1000001
1011101
1001001
1101011
1000001
1111111
`.trim();

let showMap = false;
let lastFootstepTime = 0;
let mapCanvas = null;
let mapCtx = null;

function initializeGame(level) {
    console.log('='.repeat(60));
    console.log('🌊 ECHOWALKER - Initializing Game');
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
    gameState.gameActive = true;
    
    console.log('Player start:', gameState.player);
    console.log('Exit location:', gameState.exit);
    console.log('='.repeat(60));
    
    updateOceanPosition(gameState.exit);
    updateListenerPosition();
    updateOceanVolume(gameState.player, gameState.exit);
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
    
    // Hide debug map if open so it doesn't block the Victory screen
    showMap = false;
    if (mapCanvas) {
        mapCanvas.style.display = 'none';
    }
    
    // STOP ALL SOUNDS
    stopAllAudio();
    
    const elapsedTime = ((Date.now() - gameState.startTime) / 1000).toFixed(1);
    
    console.log('='.repeat(60));
    console.log('🎉 VICTORY! 🎉');
    console.log('='.repeat(60));
    console.log('Statistics:');
    console.log(`  Time: ${elapsedTime}s`);
    console.log(`  Steps: ${gameState.steps}`);
    console.log(`  Sonar pings: ${gameState.pings}`);
    console.log(`  Collisions: ${gameState.collisions}`);
    console.log('='.repeat(60));
    
    playVictorySound();
    
    setTimeout(() => {
        const statsElem = document.getElementById('stats');
        if (statsElem) {
            statsElem.innerHTML = `
                <div class="stat-item"><span class="stat-label">Time</span><span class="stat-value highlight">${elapsedTime}s</span></div>
                <div class="stat-item"><span class="stat-label">Steps</span><span class="stat-value">${gameState.steps}</span></div>
                <div class="stat-item"><span class="stat-label">Sonar Pings</span><span class="stat-value">${gameState.pings}</span></div>
                <div class="stat-item"><span class="stat-label">Collisions</span><span class="stat-value ${gameState.collisions > 0 ? 'warning' : ''}">${gameState.collisions}</span></div>
            `;
        }
        const victoryScreen = document.getElementById('victoryScreen');
        if (victoryScreen) {
            victoryScreen.classList.remove('hidden');
            victoryScreen.classList.add('fade-up');
        }
        const gameHUD = document.getElementById('gameHUD');
        if (gameHUD) gameHUD.classList.add('hidden');
    }, 1000);
}

function stopAllAudio() {
    const audioCtx = getAudioContext();
    if (!audioCtx) return;
    
    console.log('🔇 Stopping all game audio...');
    
    // Stop footsteps
    stopFootsteps();
    
    // Stop ocean waves by disconnecting nodes
    if (window.oceanWaveNodes && window.oceanWaveNodes.length > 0) {
        window.oceanWaveNodes.forEach(node => {
            try {
                if (node.noise) node.noise.stop();
                if (node.lfo) node.lfo.stop();
                if (node.ampLFO) node.ampLFO.stop();
            } catch(e) {
                // Already stopped
            }
        });
    }
    
    // Mute master gain
    const master = getMasterGain();
    if (master) {
        const now = audioCtx.currentTime;
        master.gain.linearRampToValueAtTime(0, now + 0.3);
    }
    
    console.log('✅ All audio stopped');
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
    `;
    document.body.appendChild(mapCanvas);
    mapCtx = mapCanvas.getContext('2d');
    
    console.log('🗺️ Debug map visible (Press M to toggle)');
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
    
    // Draw maze
    for (let y = 0; y < mapSize; y++) {
        for (let x = 0; x < mapSize; x++) {
            if (gameState.map[y][x] === 1) {
                mapCtx.strokeStyle = 'rgba(0, 255, 204, 0.4)';
                mapCtx.strokeRect(x * cellSize, y * cellSize, cellSize, cellSize);
                mapCtx.fillStyle = 'rgba(0, 255, 204, 0.05)';
                mapCtx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
            }
        }
    }
    
    // Draw exit
    mapCtx.shadowColor = '#00aaff';
    mapCtx.strokeStyle = '#00aaff';
    mapCtx.fillStyle = 'rgba(0, 170, 255, 0.2)';
    mapCtx.fillRect(
        (gameState.exit.x - 0.5) * cellSize,
        (gameState.exit.y - 0.5) * cellSize,
        cellSize * 1.5,
        cellSize * 1.5
    );
    mapCtx.strokeRect(
        (gameState.exit.x - 0.5) * cellSize,
        (gameState.exit.y - 0.5) * cellSize,
        cellSize * 1.5,
        cellSize * 1.5
    );
    
    // DRAW SONAR RAY
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
    
    // Draw player
    mapCtx.shadowColor = '#00ffcc';
    mapCtx.fillStyle = '#00ffcc';
    mapCtx.beginPath();
    mapCtx.arc(
        gameState.player.x * cellSize,
        gameState.player.y * cellSize,
        cellSize * 0.6,
        0,
        Math.PI * 2
    );
    mapCtx.fill();
    
    // Draw facing direction
    const lineLength = cellSize * 2;
    const endX = gameState.player.x * cellSize + Math.sin(angleRad) * lineLength;
    const endY = gameState.player.y * cellSize - Math.cos(angleRad) * lineLength;
    
    mapCtx.strokeStyle = '#fff';
    mapCtx.lineWidth = 2;
    mapCtx.beginPath();
    mapCtx.moveTo(gameState.player.x * cellSize, gameState.player.y * cellSize);
    mapCtx.lineTo(endX, endY);
    mapCtx.stroke();
    
    // Reset shadow for text
    mapCtx.shadowBlur = 0;
    
    // Info text
    const dist = Math.sqrt(
        (gameState.player.x - gameState.exit.x) ** 2 + 
        (gameState.player.y - gameState.exit.y) ** 2
    );
    
    mapCtx.fillStyle = '#00ffcc';
    mapCtx.font = 'bold 16px monospace';
    const y0 = canvasSize + 25;
    mapCtx.fillText(`Pos: (${gameState.player.x.toFixed(1)}, ${gameState.player.y.toFixed(1)})`, 15, y0);
    mapCtx.fillText(`Angle: ${Math.round(gameState.player.angle)}° | Sonar: ${rayDist.toFixed(1)}t`, 15, y0 + 25);
    mapCtx.fillText(`Steps: ${gameState.steps} | Pings: ${gameState.pings}`, 15, y0 + 50);
    
    mapCtx.fillStyle = dist < 3 ? '#00aaff' : '#00ffcc';
    mapCtx.fillText(`🌊 EXIT: ${dist.toFixed(1)} tiles`, 15, y0 + 75);
}

document.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'm') {
        showMap = !showMap;
        if (mapCanvas) {
            mapCanvas.style.display = showMap ? 'block' : 'none';
        }
        console.log(`🗺️ Map ${showMap ? 'SHOWN' : 'HIDDEN - BLIND MODE'}`);
    }
});

function gameLoop(currentTime) {
    if (currentTime - lastUpdateTime > UPDATE_INTERVAL) {
        if (gameState.gameActive) {
            updateListenerPosition();
            checkWinCondition();
            drawDebugMap();
            updateHUD();
            
            // Instantly responsive footsteps physics
            if (typeof isMoving === 'function') {
                if (isMoving()) {
                    let interval = 500;
                    const mode = getMovementMode();
                    if (mode === 'creep') interval = 800;
                    if (mode === 'run') interval = 300;
                    
                    if (currentTime - lastFootstepTime > interval) {
                        if (typeof playFootstep === 'function') playFootstep();
                        lastFootstepTime = currentTime;
                    }
                } else {
                    lastFootstepTime = 0; // Reset tracking immediately to ensure first step plays instantly
                }
            }
        }
        lastUpdateTime = currentTime;
    }
    
    requestAnimationFrame(gameLoop);
}

function updateHUD() {
    const modeSpan = document.getElementById('hud-mode');
    if (modeSpan && typeof getMovementMode === 'function') {
        modeSpan.textContent = getMovementMode().toUpperCase();
    }
}

function startGame(level = 'easy') {
    console.log('🌊 ECHOWALKER - The Blind Audio Maze');
    console.log('By: Krunal Kadtan & Vansh');
    console.log('');
    console.log('CONTROLS:');
    console.log('  W/S - Move Forward/Backward');
    console.log('  A/D - Rotate Left/Right');
    console.log('  SPACEBAR - Sonar Ping (check path ahead)');
    console.log('  Q - Speed Mode');
    console.log('  M - Toggle Map');
    console.log('');
    console.log('NAVIGATION STRATEGY:');
    console.log('  1. Press SPACEBAR to check if path is clear');
    console.log('  2. Move with W when sonar shows clear path');
    console.log('  3. Ocean waves get LOUDER as you approach exit');
    console.log('');
    console.log('🎧 Put on headphones and click to start...');
    
    if (!getAudioContext()) {
        initAudio();
        
        setTimeout(() => {
            createOceanWaves();
            if (!mapCanvas) createMapCanvas();
            
            initKeyboardControls(
                (direction) => {
                    const result = movePlayer(gameState.player, gameState.map, direction);
                    if (result.moved) {
                        gameState.steps++;
                    } else {
                        gameState.collisions++;
                    }
                },
                (direction) => {
                    rotatePlayer(gameState.player, direction);
                },
                () => {
                    const result = fireSonarPing(gameState.player, gameState.map);
                    if (result === false) return; // Cooldown blocked it
                    
                    gameState.pings++;
                    const pingSpan = document.getElementById('hud-ping');
                    if (pingSpan) {
                        pingSpan.textContent = 'PINGING...';
                        pingSpan.classList.remove('ping-anim');
                        void pingSpan.offsetWidth;
                        pingSpan.classList.add('ping-anim');
                        setTimeout(() => pingSpan.textContent = 'READY', 500);
                    }
                },
                (newMode) => {
                    console.log(`Speed updated to: ${newMode}`);
                    if (typeof playModeChangeSound === 'function') {
                        playModeChangeSound(newMode);
                    }
                }
            );
            initializeGame(level);
            requestAnimationFrame(gameLoop);
            
            const gameHUD = document.getElementById('gameHUD');
            if (gameHUD) gameHUD.classList.remove('hidden');
            
            console.log('✅ Game started!');
            console.log('💡 Press SPACEBAR for sonar');
        }, 100);
    } else {
        setTimeout(() => {
            const master = getMasterGain();
            if (master) {
                const audioCtx = getAudioContext();
                master.gain.setValueAtTime(0.8, audioCtx.currentTime);
            }
            createOceanWaves();
            const gameHUD = document.getElementById('gameHUD');
            if (gameHUD) gameHUD.classList.remove('hidden');
            
            initializeGame(level);
            console.log('✅ Game restarted!');
        }, 100);
    }
}

console.log('✅ Game module loaded');
