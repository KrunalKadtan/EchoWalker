/**
 * Short-Range Echo Sonar (5 tiles max)
 * Author: Krunal Kadtan
 */

// Sonar Visuals removed. Relying on minimalistic HUD.

let lastSonarTime = 0;
const SONAR_COOLDOWN = 1.0; // 1 second cooldown

function fireSonarPing(player, map) {
    const audioCtx = getAudioContext();
    if (!audioCtx) return null;
    
    const now = audioCtx.currentTime;
    if (now - lastSonarTime < SONAR_COOLDOWN) {
        if (typeof playSonarError === 'function') playSonarError();
        return false;
    }
    lastSonarTime = now;
    
    // Cast ray ONLY in front direction (max 10 tiles)
    const frontDistance = castRay(player.x, player.y, player.angle, map, 10);
    
    console.log(`📡 Sonar: ${frontDistance.toFixed(2)} tiles ahead`);
    
    playEchoSonar(frontDistance);
    
    return { front: frontDistance };
}

function playEchoSonar(distance) {
    const audioCtx = getAudioContext();
    const master = getMasterGain();
    const reverb = typeof getReverbNode === 'function' ? getReverbNode() : null;
    const now = audioCtx.currentTime;
    
    // OUTGOING PING (Dull thud like hitting a wrench on a pipe)
    const pingOut = audioCtx.createOscillator();
    pingOut.type = 'triangle';
    pingOut.frequency.setValueAtTime(400, now);
    pingOut.frequency.exponentialRampToValueAtTime(100, now + 0.1);
    
    const pingOutGain = audioCtx.createGain();
    pingOutGain.gain.setValueAtTime(0.4, now);
    pingOutGain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    
    pingOut.connect(pingOutGain);
    pingOutGain.connect(master);
    if (reverb) pingOutGain.connect(reverb);
    pingOut.start(now);
    pingOut.stop(now + 0.1);
    
    // ECHO - delayed mathematically based on distance
    const maxRange = 10;
    const echoDelay = 0.1 + (Math.min(distance, maxRange) / maxRange) * 0.9; // 0.1s to 1.0s
    const echoTime = now + echoDelay;
    
    if (distance <= maxRange) {
        const echoOsc = audioCtx.createOscillator();
        echoOsc.type = 'sine';
        // Closer = higher pitch, Farther = lower pitch (between 800hz and 1400hz)
        const pitch = 1400 - (distance / maxRange) * 600;
        echoOsc.frequency.value = pitch;
        
        const echoGain = audioCtx.createGain();
        // Distance attenuation
        const echoVolume = Math.max(0.1, 1 - (distance / maxRange)) * 0.6;
        echoGain.gain.setValueAtTime(echoVolume, echoTime);
        echoGain.gain.exponentialRampToValueAtTime(0.01, echoTime + 0.3);
        
        echoOsc.connect(echoGain);
        echoGain.connect(master);
        if (reverb) echoGain.connect(reverb);
        echoOsc.start(echoTime);
        echoOsc.stop(echoTime + 0.3);
    }
    
    console.log(`  → Echo delay: ${(echoDelay * 1000).toFixed(0)}ms`);
}

console.log('✅ Sonar system loaded (5 tile range)');
