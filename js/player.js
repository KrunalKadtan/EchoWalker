let keysPressed = {};
let currentMovementMode = 'walk';
let isPlayerMoving = false;

/**
 * Check if a position is valid for movement
 * Only checks buffer in the direction of movement
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {number} oldX - Previous X position
 * @param {number} oldY - Previous Y position
 * @param {Array} map - The maze map
 * @returns {boolean} True if position is valid
 */
function isValidPosition(x, y, oldX, oldY, map) {
    // Check center tile
    const mapX = Math.floor(x);
    const mapY = Math.floor(y);
    
    if (mapX < 0 || mapX >= map[0].length || 
        mapY < 0 || mapY >= map.length) {
        return false;
    }
    
    // Must be on a path (0)
    if (map[mapY][mapX] !== 0) {
        return false;
    }
    
    // Calculate movement direction
    const dx = x - oldX;
    const dy = y - oldY;
    
    // Buffer zone - only check in direction of movement
    const buffer = 0.25;
    const fractionalX = x - mapX;
    const fractionalY = y - mapY;
    
    // Only check buffers if moving in that direction
    
    // Moving left (dx < 0)
    if (dx < 0 && fractionalX < buffer && mapX > 0) {
        if (map[mapY][mapX - 1] === 1) return false;
    }
    
    // Moving right (dx > 0)
    if (dx > 0 && fractionalX > (1 - buffer) && mapX < map[0].length - 1) {
        if (map[mapY][mapX + 1] === 1) return false;
    }
    
    // Moving up (dy < 0)
    if (dy < 0 && fractionalY < buffer && mapY > 0) {
        if (map[mapY - 1][mapX] === 1) return false;
    }
    
    // Moving down (dy > 0)
    if (dy > 0 && fractionalY > (1 - buffer) && mapY < map.length - 1) {
        if (map[mapY + 1][mapX] === 1) return false;
    }
    
    return true;
}

/**
 * Move the player in a direction
 * @param {Object} player - Player object {x, y, angle}
 * @param {Array} map - The maze map
 * @param {string} direction - 'forward' or 'backward'
 * @returns {Object} Result {moved: boolean, collision: string|null}
 */
function movePlayer(player, map, direction) {
    const speeds = {
        creep: 0.15,   // Very slow, precise
        walk: 0.3,     // Normal movement
        run: 0.5       // Fast movement
    };
    
    const speed = speeds[currentMovementMode] || 0.3;
    
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
    
    // Check if new position is valid
    if (isValidPosition(newX, newY, oldX, oldY, map)) {
        // Move player
        player.x = newX;
        player.y = newY;
        isPlayerMoving = true;
        
        return { moved: true, collision: null };
    } else {
        // Real collision
        const collisionDir = detectCollisionDirection(oldX, oldY, newX, newY, player.angle);
        if (typeof playCollisionSound === 'function') {
            playCollisionSound(collisionDir);
        }
        
        return { moved: false, collision: collisionDir };
    }
}

/**
 * Rotate the player
 * @param {Object} player - Player object {x, y, angle}
 * @param {string} direction - 'left' or 'right'
 */
function rotatePlayer(player, direction) {
    const rotationSpeed = 5;
    
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
    
    const moveAngle = Math.atan2(dx, -dy) * 180 / Math.PI;
    let relativeAngle = moveAngle - playerAngle;
    relativeAngle = ((relativeAngle + 180) % 360) - 180;
    
    const absAngle = Math.abs(relativeAngle);
    
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
        console.log(`🏃 Movement mode: ${mode}`);
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

console.log('✅ Player module loaded');
