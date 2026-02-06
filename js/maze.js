const TILE_SIZE = 20;

const LEVELS = {
    demo: { size: 7, name: 'Demo' },
    easy: { size: 11, name: 'Easy' },
    medium: { size: 15, name: 'Medium' },
    hard: { size: 21, name: 'Hard' },
    extreme: { size: 25, name: 'Extremely Hard' },
    nightmare: { size: 31, name: 'Nightmare' }
};

/**
 * Generate a maze using recursive backtracking
 * @param {number} size - Maze dimension (size × size)
 * @returns {Array} 2D array representing the maze (0 = path, 1 = wall)
 */
function generateMaze(size) {
    console.log(`🔨 Generating ${size}×${size} maze...`);
    
    // Create map filled with walls
    let map = Array.from({ length: size }, () => new Array(size).fill(1));
    
    /**
     * Recursive carving function
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     */
    function carve(x, y) {
        map[y][x] = 0; // Mark as path
        
        // Possible directions: North, East, South, West (2 tiles apart)
        const directions = [
            [0, -2],  // North
            [2, 0],   // East
            [0, 2],   // South
            [-2, 0]   // West
        ];
        
        // Shuffle for randomness
        directions.sort(() => Math.random() - 0.5);
        
        // Try each direction
        for (let [dx, dy] of directions) {
            const nx = x + dx;
            const ny = y + dy;
            
            // Check if next position is valid and unvisited
            if (nx > 0 && nx < size - 1 && 
                ny > 0 && ny < size - 1 && 
                map[ny][nx] === 1) {
                
                // Carve path between current and next cell
                map[y + dy / 2][x + dx / 2] = 0;
                
                // Recursively carve from next cell
                carve(nx, ny);
            }
        }
    }
    
    // Start carving from (1, 1)
    carve(1, 1);
    
    // CRITICAL FIX: Ensure start area (1,1) and surroundings are CLEAR
    // This guarantees player can actually move
    for (let y = 1; y <= 3; y++) {
        for (let x = 1; x <= 3; x++) {
            if (x < size && y < size) {
                map[y][x] = 0; // Force open
            }
        }
    }
    
    // CRITICAL FIX: Ensure exit area is CLEAR
    for (let y = size - 4; y < size - 1; y++) {
        for (let x = size - 4; x < size - 1; x++) {
            if (x > 0 && y > 0) {
                map[y][x] = 0; // Force open
            }
        }
    }
    
    console.log('✅ Maze generated successfully');
    console.log('   Start area (1-3, 1-3) forced open');
    console.log('   Exit area forced open');
    
    return map;
}

console.log('✅ Maze module loaded');
