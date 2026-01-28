/**
 * Fire a sonar ping and get wall distances
 * @param {Object} player - Player object {x, y, angle}
 * @param {Array} map - The maze map
 * @returns {Object} Distances in each direction
 */
function fireSonarPing(player, map) {
    const audioCtx = getAudioContext();
    if (!audioCtx) return null;
    
    console.log('Sonar ping fired');
    
    // Cast rays in 4 cardinal directions
    const directions = [
        { name: 'front', angle: 0, baseFreq: 600, pan: 0 },
        { name: 'left', angle: 270, baseFreq: 450, pan: -0.8 },
        { name: 'right', angle: 90, baseFreq: 750, pan: 0.8 },
        { name: 'back', angle: 180, baseFreq: 300, pan: 0 }
    ];
    
    const distances = {};
    
    directions.forEach(({ name, angle, baseFreq, pan }, index) => {
        const absoluteAngle = (player.angle + angle) % 360;
        const distance = castRay(player.x, player.y, absoluteAngle, map);
        distances[name] = distance;
        
        console.log(`   ${name}: ${distance.toFixed(2)} tiles`);
        
        // Play audio ping with staggered timing
        playDirectionalPing(distance, baseFreq, pan, index * 0.08);
    });
    
    return distances;
}

/**
 * Play a directional sonar ping
 * @param {number} distance - Distance to wall
 * @param {number} baseFreq - Base frequency for this direction
 * @param {number} pan - Stereo pan value (-1 to 1)
 * @param {number} delay - Delay before playing (seconds)
 */
function playDirectionalPing(distance, baseFreq, pan, delay = 0) {
    const audioCtx = getAudioContext();
    const master = getMasterGain();
    const now = audioCtx.currentTime + delay;
    
    // Frequency modulation based on distance
    // Closer walls = higher pitch
    const freqMultiplier = Math.max(0.5, 1 - (distance / 20) * 0.8);
    const freq = baseFreq * (0.5 + freqMultiplier);
    
    // Volume modulation based on distance
    // Closer walls = louder
    const volume = Math.max(0.1, 1 - (distance / 20)) * 0.4;
    
    // Create oscillator
    const osc = audioCtx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;
    
    // Create gain envelope
    const pingGain = audioCtx.createGain();
    pingGain.gain.setValueAtTime(volume, now);
    pingGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    
    // Create stereo panner
    const panner = audioCtx.createStereoPanner();
    panner.pan.value = pan;
    
    // Audio graph: osc -> gain -> panner -> master
    osc.connect(pingGain);
    pingGain.connect(panner);
    panner.connect(master);
    
    // Play
    osc.start(now);
    osc.stop(now + 0.5);
}

console.log('Sonar system module loaded');
