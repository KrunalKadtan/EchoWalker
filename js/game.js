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

let showMap = true;
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
        alert(`🎉 VICTORY! 🎉\n\nTime: ${elapsedTime}s\nSteps: ${gameState.steps}\nSonar: ${gameState.pings}\nCollisions: ${gameState.collisions}\n\nExcellent navigation!`);
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
        top: 20px;
        right: 20px;
        border: 3px solid #00ff00;
        background: #000;
        z-index: 1000;
    `;
    document.body.appendChild(mapCanvas);
    mapCtx = mapCanvas.getContext('2d');
    
    console.log('🗺️ Debug map visible (Press M to toggle)');
}

function drawDebugMap() {
    if (!showMap || !gameState.map || !mapCanvas) return;
    
    const mapSize = gameState.map.length;
    const canvasSize = 450;
    const cellSize = canvasSize / mapSize;
    
    mapCanvas.width = canvasSize;
    mapCanvas.height = canvasSize + 120;
    
    mapCtx.fillStyle = '#000';
    mapCtx.fillRect(0, 0, canvasSize, canvasSize + 120);
    
    // Draw maze
    for (let y = 0; y < mapSize; y++) {
        for (let x = 0; x < mapSize; x++) {
            if (gameState.map[y][x] === 1) {
                mapCtx.fillStyle = '#666';
                mapCtx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
            }
        }
    }
    
    // Draw exit
    mapCtx.fillStyle = '#0ff';
    mapCtx.fillRect(
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
    
    mapCtx.strokeStyle = rayDist < 1.5 ? '#f00' : '#0f0';
    mapCtx.lineWidth = 3;
    mapCtx.setLineDash([5, 5]);
    mapCtx.beginPath();
    mapCtx.moveTo(gameState.player.x * cellSize, gameState.player.y * cellSize);
    mapCtx.lineTo(rayEndX * cellSize, rayEndY * cellSize);
    mapCtx.stroke();
    mapCtx.setLineDash([]);
    
    mapCtx.fillStyle = '#ff0';
    mapCtx.beginPath();
    mapCtx.arc(rayEndX * cellSize, rayEndY * cellSize, 5, 0, Math.PI * 2);
    mapCtx.fill();
    
    // Draw player
    mapCtx.fillStyle = '#0f0';
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
    
    mapCtx.strokeStyle = '#ff0';
    mapCtx.lineWidth = 4;
    mapCtx.beginPath();
    mapCtx.moveTo(gameState.player.x * cellSize, gameState.player.y * cellSize);
    mapCtx.lineTo(endX, endY);
    mapCtx.stroke();
    
    // Info text
    const dist = Math.sqrt(
        (gameState.player.x - gameState.exit.x) ** 2 + 
        (gameState.player.y - gameState.exit.y) ** 2
    );
    
    mapCtx.fillStyle = '#0f0';
    mapCtx.font = 'bold 16px monospace';
    const y0 = canvasSize + 20;
    mapCtx.fillText(`Pos: (${gameState.player.x.toFixed(1)}, ${gameState.player.y.toFixed(1)})`, 10, y0);
    mapCtx.fillText(`Angle: ${Math.round(gameState.player.angle)}° | Sonar: ${rayDist.toFixed(1)}t`, 10, y0 + 25);
    mapCtx.fillText(`Steps: ${gameState.steps} | Pings: ${gameState.pings}`, 10, y0 + 50);
    
    mapCtx.fillStyle = dist < 3 ? '#ff0' : '#0f0';
    mapCtx.fillText(`🌊 EXIT: ${dist.toFixed(1)} tiles`, 10, y0 + 75);
    
    mapCtx.fillStyle = '#fff';
    mapCtx.font = '13px monospace';
    mapCtx.fillText('[M] Map | [SPACE] Sonar | [WASD] Move', 10, y0 + 100);
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
        }
        lastUpdateTime = currentTime;
    }
    
    requestAnimationFrame(gameLoop);
}

function startGame() {
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
    
    document.addEventListener('click', () => {
        const loadingScreen = document.getElementById('loadingScreen');
        
        if (!getAudioContext()) {
            initAudio();
            
            setTimeout(() => {
                createOceanWaves();
                initializeGame('easy');
                createMapCanvas();
                
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
                        gameState.pings++;
                        fireSonarPing(gameState.player, gameState.map);
                    },
                    (newMode) => {
                        restartFootsteps();
                    }
                );
                
                startFootsteps(getMovementMode());
                requestAnimationFrame(gameLoop);
                
                if (loadingScreen) {
                    loadingScreen.classList.add('hidden');
                }
                
                console.log('✅ Game started!');
                console.log('💡 Press SPACEBAR for sonar');
            }, 100);
        }
    }, { once: true });
}

window.addEventListener('load', startGame);
console.log('✅ Game module loaded');
