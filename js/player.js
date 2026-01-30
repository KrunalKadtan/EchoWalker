let keysPressed = {};
let currentMovementMode = 'walk';
let isPlayerMoving = false;

/**
 * Move the player in a direction
 * @param {Object} player - Player object {x, y, angle}
 * @param {Array} map - The maze map
 * @param {string} direction - 'forward' or 'backward'
 * @returns {Object} Result {moved: boolean, collision: string|null}
 */
function movePlayer(player, map, direction) {
    const speeds = {
        creep: 0.25,
        walk: 0.4,
        run: 0.65
    };
    
    const speed = speeds[currentMovementMode] || 0.4;
    
    const oldX = player.x;
    const oldY = player.y;
    let newX = oldX;
    let newY = oldY;
    
    if (direction === 'forward' || direction === 'backward') {
        const angleRad = (player.angle * Math.PI) / 180;
        const multiplier = direction === 'forward' ? 1 : -1;
        const dx = Math.sin(angleRad) * speed * multiplier;
        const dy = -Math.cos(angleRad) * speed * multiplier;
        
        newX += dx;
        newY += dy;
    }
    
    // Check collision
    const mapX = Math.floor(newX);
    const mapY = Math.floor(newY);
    
    // Check bounds and wall
    if (mapX >= 0 && mapX < map[0].length && 
        mapY >= 0 && mapY < map.length &&
        map[mapY][mapX] !== 1) {
        
        // No collision - update position
        player.x = newX;
        player.y = newY;
        isPlayerMoving = true;
        
        return { moved: true, collision: null };
    } else {
        // Collision detected
        const collisionDir = detectCollisionDirection(oldX, oldY, newX, newY, player.angle);
        playCollisionSound();
        
        return { moved: false, collision: collisionDir };
    }
}

/**
 * Rotate the player
 * @param {Object} player - Player object {x, y, angle}
 * @param {string} direction - 'left' or 'right'
 */
function rotatePlayer(player, direction) {
    const rotationSpeed = 4;
    
    if (direction === 'left') {
        player.angle -= rotationSpeed;
    } else if (direction === 'right') {
        player.angle += rotationSpeed;
    }
    
    // Normalize angle (0-360)
    player.angle = ((player.angle % 360) + 360) % 360;
}

/**
 * Detect which side of the player collided with a wall
 * @param {number} oldX - Previous X position
 * @param {number} oldY - Previous Y position
 * @param {number} newX - Attempted new X position
 * @param {number} newY - Attempted new Y position
 * @param {number} playerAngle - Player's facing angle
 * @returns {string} Collision direction ('front', 'back', 'left', 'right')
 */
function detectCollisionDirection(oldX, oldY, newX, newY, playerAngle) {
    const dx = newX - oldX;
    const dy = newY - oldY;
    
    // Convert movement vector to angle
    const moveAngle = Math.atan2(dx, -dy) * 180 / Math.PI;
    
    // Calculate relative angle to player's facing direction
    let relativeAngle = moveAngle - playerAngle;
    relativeAngle = ((relativeAngle + 180) % 360) - 180;
    
    const absAngle = Math.abs(relativeAngle);
    
    // Determine direction based on angle
    if (absAngle < 45) return 'front';
    if (absAngle > 135) return 'back';
    if (relativeAngle < 0) return 'left';
    return 'right';
}

/**
 * Set the movement mode
 * @param {string} mode - 'creep', 'walk', or 'run'
 */
function setMovementMode(mode) {
    const validModes = ['creep', 'walk', 'run'];
    if (validModes.includes(mode)) {
        currentMovementMode = mode;
        console.log(`Movement mode: ${mode}`);
    }
}

/**
 * Cycle to the next movement mode
 * @returns {string} The new movement mode
 */
function cycleMovementMode() {
    const modes = ['creep', 'walk', 'run'];
    const currentIndex = modes.indexOf(currentMovementMode);
    const newMode = modes[(currentIndex + 1) % modes.length];
    setMovementMode(newMode);
    return newMode;
}

/**
 * Get the current movement mode
 * @returns {string} Current mode
 */
function getMovementMode() {
    return currentMovementMode;
}

/**
 * Check if player is currently moving
 * @returns {boolean}
 */
function isMoving() {
    return isPlayerMoving;
}

/**
 * Set player moving state
 * @param {boolean} moving
 */
function setMoving(moving) {
    isPlayerMoving = moving;
}

/**
 * Initialize keyboard event listeners
 * @param {Function} onMove - Callback for movement
 * @param {Function} onRotate - Callback for rotation
 * @param {Function} onSonar - Callback for sonar ping
 * @param {Function} onModeChange - Callback for mode change
 */
function initKeyboardControls(onMove, onRotate, onSonar, onModeChange) {
    document.addEventListener('keydown', (e) => {
        const key = e.key.toLowerCase();
        keysPressed[key] = true;
        
        // Movement
        if (key === 'w') {
            onMove('forward');
        } else if (key === 's') {
            onMove('backward');
        } else if (key === 'a') {
            onRotate('left');
        } else if (key === 'd') {
            onRotate('right');
        }
        
        // Sonar
        if (e.key === ' ') {
            e.preventDefault();
            onSonar();
        }
        
        // Speed mode
        if (key === 'q') {
            const newMode = cycleMovementMode();
            if (onModeChange) onModeChange(newMode);
        }
    });
    
    document.addEventListener('keyup', (e) => {
        const key = e.key.toLowerCase();
        keysPressed[key] = false;
        
        // Stop moving if no movement keys pressed
        if (!keysPressed['w'] && !keysPressed['s']) {
            isPlayerMoving = false;
        }
    });
    
    console.log('⌨️ Keyboard controls initialized');
}

console.log('Player module loaded');
