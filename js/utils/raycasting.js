/**
 * Cast a ray from a position in a direction to detect walls
 * @param {number} startX - Starting X position (in tiles)
 * @param {number} startY - Starting Y position (in tiles)
 * @param {number} angleDeg - Direction angle in degrees
 * @param {Array} map - The maze map
 * @param {number} maxDistance - Maximum ray distance in tiles
 * @returns {number} Distance to nearest wall
 */
function castRay(startX, startY, angleDeg, map, maxDistance = 20) {
    const angleRad = (angleDeg * Math.PI) / 180;
    const dx = Math.cos(angleRad);
    const dy = Math.sin(angleRad);
    
    const stepSize = 0.1; // Step 0.1 tiles at a time
    const maxSteps = maxDistance * 10;
    
    // Step along the ray
    for (let step = 0; step < maxSteps; step++) {
        const x = startX + dx * step * stepSize;
        const y = startY + dy * step * stepSize;
        
        const mapX = Math.floor(x);
        const mapY = Math.floor(y);
        
        // Check bounds
        if (mapX < 0 || mapX >= map[0].length || 
            mapY < 0 || mapY >= map.length) {
            return maxDistance;
        }
        
        // Check if hit wall
        if (map[mapY][mapX] === 1) {
            const distance = Math.sqrt(
                (x - startX) ** 2 + 
                (y - startY) ** 2
            );
            return distance;
        }
    }
    
    return maxDistance;
}

/**
 * Cast multiple rays for comprehensive detection
 * @param {Object} player - Player object with x, y, angle
 * @param {Array} map - The maze map
 * @returns {Object} Distances in each direction
 */
function castMultipleRays(player, map) {
    const directions = [
        { name: 'front', angle: 0 },
        { name: 'right', angle: 90 },
        { name: 'back', angle: 180 },
        { name: 'left', angle: 270 }
    ];
    
    const distances = {};
    
    directions.forEach(({ name, angle }) => {
        const absoluteAngle = (player.angle + angle) % 360;
        distances[name] = castRay(player.x, player.y, absoluteAngle, map);
    });
    
    return distances;
}

console.log('Raycasting utilities loaded');
