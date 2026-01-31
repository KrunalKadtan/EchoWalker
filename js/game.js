// Game state
let gameState = {
    currentLevel: 'easy',
    map: null,
    player: { x: 1.5, y: 1.5, angle: 0 },
    exit: { x: 0, y: 0 },
    startTime: 0,
    steps: 0,
    pings: 0,
    collisions: 0,
    gameActive: false,
    viewMode: 'blind' // Vansh will add view mode switching
};

// Game loop timing
let lastUpdateTime = 0;
const UPDATE_INTERVAL = 16; // 60 FPS

/**
 * Initialize a new game
 * @param {string} level - Level difficulty key
 */
function initializeGame(level) {
    console.log('='.repeat(60));
    console.log('ECHOWALKER - Initializing Game');
    console.log('='.repeat(60));
    console.log(`Level: ${LEVELS[level].name} (${LEVELS[level].size}×${LEVELS[level].size})`);
    
    const mapSize = LEVELS[level].size;
    
    // Generate maze
    gameState.map = generateMaze(mapSize);
    gameState.currentLevel = level;
    
    // Set player at start (top-left area)
    gameState.player = {
        x: 1.5,
        y: 1.5,
        angle: 0
    };
    
    // Set exit at opposite corner (bottom-right area)
    gameState.exit = {
        x: mapSize - 2.5,
        y: mapSize - 2.5
    };
    
    // Reset stats
    gameState.startTime = Date.now();
    gameState.steps = 0;
    gameState.pings = 0;
    gameState.collisions = 0;
    gameState.gameActive = true;
    
    console.log('Player start:', gameState.player);
    console.log('Exit location:', gameState.exit);
    console.log('='.repeat(60));
    
    // Update ocean wave position
    updateOceanPosition(gameState.exit);
    
    // Update spatial audio listener
    updateListenerPosition();
}

/**
 * Update 3D audio listener position and orientation
 */
function updateListenerPosition() {
    const audioCtx = getAudioContext();
    const panner = getExitPanner();
    
    if (!audioCtx || !panner || !gameState.gameActive) return;
    
    const { player } = gameState;
    
    // Set listener position
    audioCtx.listener.positionX.value = player.x * TILE_SIZE;
    audioCtx.listener.positionY.value = 0;
    audioCtx.listener.positionZ.value = player.y * TILE_SIZE;
    
    // Set listener orientation
    const angleRad = (player.angle * Math.PI) / 180;
    const forwardX = Math.sin(angleRad);
    const forwardZ = -Math.cos(angleRad);
    
    audioCtx.listener.forwardX.value = forwardX;
    audioCtx.listener.forwardY.value = 0;
    audioCtx.listener.forwardZ.value = forwardZ;
    
    audioCtx.listener.upX.value = 0;
    audioCtx.listener.upY.value = 1;
    audioCtx.listener.upZ.value = 0;
}

/**
 * Check if player reached the exit
 * @returns {boolean} True if player won
 */
function checkWinCondition() {
    const { player, exit } = gameState;
    const distance = Math.sqrt(
        (player.x - exit.x) ** 2 + 
        (player.y - exit.y) ** 2
    );
    
    if (distance < 1.2) {
        winGame();
        return true;
    }
    
    return false;
}

/**
 * Handle game victory
 */
function winGame() {
    if (!gameState.gameActive) return;
    
    gameState.gameActive = false;
    stopFootsteps();
    
    const elapsedTime = ((Date.now() - gameState.startTime) / 1000).toFixed(1);
    
    console.log('='.repeat(60));
    console.log('VICTORY!');
    console.log('='.repeat(60));
    console.log('Statistics:');
    console.log(`  Time: ${elapsedTime}s`);
    console.log(`  Steps: ${gameState.steps}`);
    console.log(`  Sonar pings: ${gameState.pings}`);
    console.log(`  Collisions: ${gameState.collisions}`);
    console.log('='.repeat(60));
    
    playVictorySound();
    
    // Vansh will show victory screen UI here
}

/**
 * Main game loop
 * @param {number} currentTime - Current timestamp
 */
function gameLoop(currentTime) {
    if (currentTime - lastUpdateTime > UPDATE_INTERVAL) {
        if (gameState.gameActive) {
            updateListenerPosition();
            checkWinCondition();
            
            // Vansh will add view rendering here
        }
        lastUpdateTime = currentTime;
    }
    
    requestAnimationFrame(gameLoop);
}

/**
 * Start the game
 */
function startGame() {
    console.log('ECHOWALKER - The Blind Audio Maze');
    console.log('By: Krunal Kadtan & Vansh');
    console.log('');
    console.log('CONTROLS:');
    console.log('  W/S - Move Forward/Backward');
    console.log('  A/D - Rotate Left/Right');
    console.log('  SPACEBAR - Sonar Ping');
    console.log('  Q - Toggle Speed (Creep/Walk/Run)');
    console.log('  V - Toggle View (Vansh will add)');
    console.log('');
    console.log('Click anywhere to enable audio and start...');
    
    // Wait for user click to initialize audio
    document.addEventListener('click', () => {
        const loadingScreen = document.getElementById('loadingScreen');
        
        if (!getAudioContext()) {
            // Initialize audio
            initAudio();
            
            // Create ocean waves
            setTimeout(() => {
                createOceanWaves();
                
                // Initialize game
                initializeGame('easy');
                
                // Setup controls
                initKeyboardControls(
                    // Movement callback
                    (direction) => {
                        const result = movePlayer(gameState.player, gameState.map, direction);
                        if (result.moved) {
                            gameState.steps++;
                        } else {
                            gameState.collisions++;
                            console.log(`Collision: ${result.collision} (Total: ${gameState.collisions})`);
                            // Vansh will add visual feedback here
                        }
                    },
                    // Rotation callback
                    (direction) => {
                        rotatePlayer(gameState.player, direction);
                    },
                    // Sonar callback
                    () => {
                        gameState.pings++;
                        const distances = fireSonarPing(gameState.player, gameState.map);
                        // Vansh will add visual sonar feedback here
                    },
                    // Mode change callback
                    (newMode) => {
                        stopFootsteps();
                        startFootsteps(newMode);
                    }
                );
                
                // Start footsteps
                startFootsteps(getMovementMode());
                
                // Start game loop
                requestAnimationFrame(gameLoop);
                
                // Hide loading screen
                if (loadingScreen) {
                    loadingScreen.classList.add('hidden');
                }
                
                console.log('Game started!');
            }, 100);
        }
    }, { once: true });
}

// Start when page loads
window.addEventListener('load', startGame);

console.log('Game module loaded');
