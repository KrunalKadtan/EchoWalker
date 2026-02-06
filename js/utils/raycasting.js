/**
 * Raycasting Utilities - FIXED
 * Author: Krunal Kadtan
 */

function castRay(startX, startY, angleDeg, map, maxDistance = 5) {
    // Convert to radians CORRECTLY
    const angleRad = (angleDeg * Math.PI) / 180;
    
    // Direction vector
    const dx = Math.sin(angleRad);  // X component
    const dy = -Math.cos(angleRad); // Y component (negative because Y increases downward)
    
    const stepSize = 0.05;
    const maxSteps = maxDistance / stepSize;
    
    for (let step = 1; step <= maxSteps; step++) {
        const x = startX + dx * step * stepSize;
        const y = startY + dy * step * stepSize;
        
        const mapX = Math.floor(x);
        const mapY = Math.floor(y);
        
        // Bounds check
        if (mapX < 0 || mapX >= map[0].length || 
            mapY < 0 || mapY >= map.length) {
            return maxDistance;
        }
        
        // Wall check
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
        distances[name] = castRay(player.x, player.y, absoluteAngle, map, 5);
    });
    
    return distances;
}

console.log('✅ Raycasting utilities loaded (FIXED)');
