const TILE_SIZE = 20;

const LEVELS = {
    demo: { size: 11, name: 'Demo' },
    easy: { size: 20, name: 'Easy' },
    medium: { size: 30, name: 'Medium' },
    hard: { size: 40, name: 'Hard' }
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
    
    // CREATE BRAID LOOPS (Bypass corridors for Monster stealth)
    // By randomly removing walls that separate two corridors, we convert the Perfect Maze 
    // into a Braid Maze, introducing circular loops so players don't get trapped head-on.
    let loopsToCreate = Math.floor((size * size) / 18); // ~12 loops for a 15x15 map
    let attempts = 0;
    while (loopsToCreate > 0 && attempts < 1000) {
        attempts++;
        const rx = 2 + Math.floor(Math.random() * (size - 4));
        const ry = 2 + Math.floor(Math.random() * (size - 4));
        
        if (map[ry][rx] === 1) { // If it's a structural wall
            const up = map[ry-1][rx] === 0;
            const down = map[ry+1][rx] === 0;
            const left = map[ry][rx-1] === 0;
            const right = map[ry][rx+1] === 0;
            
            // If the wall perfectly divides two parallel open corridors, knock it down
            if ((up && down && !left && !right) || (left && right && !up && !down)) {
                map[ry][rx] = 0;
                loopsToCreate--;
            }
        }
    }
    
    console.log('✅ Maze generated successfully');
    console.log('   Start area (1-3, 1-3) forced open');
    console.log('   Exit area forced open');
    console.log(`   Braid Loops inserted: ${Math.floor((size * size) / 18) - loopsToCreate}`);
    
    return map;
}

/**
 * Build a BFS tree from the exit to all reachable cells.
 * Returns a 2D array where each cell contains {x, y} of the next step toward the exit.
 */
function buildPathMap(map, exitX, exitY) {
    const size = map.length;
    const parentMap = Array.from({ length: size }, () => new Array(size).fill(null));
    const visited = Array.from({ length: size }, () => new Array(size).fill(false));
    
    const queue = [{ x: exitX, y: exitY }];
    visited[exitY][exitX] = true;
    
    // North, South, East, West
    const dirs = [[0, -1], [0, 1], [1, 0], [-1, 0]];
    
    while (queue.length > 0) {
        const curr = queue.shift();
        
        for (let [dx, dy] of dirs) {
            const nx = curr.x + dx;
            const ny = curr.y + dy;
            
            if (nx >= 0 && nx < size && ny >= 0 && ny < size) {
                if (map[ny][nx] === 0 && !visited[ny][nx]) {
                    visited[ny][nx] = true;
                    parentMap[ny][nx] = { x: curr.x, y: curr.y };
                    queue.push({ x: nx, y: ny });
                }
            }
        }
    }
    
    return parentMap;
}

/**
 * Generic BFS to find the shortest path array from start to target
 */
function findShortestPath(map, startX, startY, targetX, targetY) {
    const size = map.length;
    const parentMap = Array.from({ length: size }, () => new Array(size).fill(null));
    const visited = Array.from({ length: size }, () => new Array(size).fill(false));
    
    const queue = [{ x: startX, y: startY }];
    visited[startY][startX] = true;
    
    const dirs = [[0, -1], [0, 1], [1, 0], [-1, 0]];
    let found = false;
    
    while (queue.length > 0) {
        const curr = queue.shift();
        if (curr.x === targetX && curr.y === targetY) {
            found = true;
            break;
        }
        for (let [dx, dy] of dirs) {
            const nx = curr.x + dx;
            const ny = curr.y + dy;
            if (nx >= 0 && nx < size && ny >= 0 && ny < size) {
                if (map[ny][nx] === 0 && !visited[ny][nx]) {
                    visited[ny][nx] = true;
                    parentMap[ny][nx] = { x: curr.x, y: curr.y };
                    queue.push({ x: nx, y: ny });
                }
            }
        }
    }
    
    if (!found) return null;
    
    const path = [];
    let curr = { x: targetX, y: targetY };
    while (curr.x !== startX || curr.y !== startY) {
        path.push(curr);
        curr = parentMap[curr.y][curr.x];
    }
    return path.reverse();
}

console.log('✅ Maze module loaded');
