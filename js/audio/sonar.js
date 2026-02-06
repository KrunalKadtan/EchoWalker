/**
 * Short-Range Echo Sonar (5 tiles max)
 * Author: Krunal Kadtan
 */

let sonarVisual = null;

function createSonarVisual() {
    if (sonarVisual) return;
    
    sonarVisual = document.createElement('div');
    sonarVisual.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 350px;
        padding: 30px;
        background: rgba(0, 0, 0, 0.95);
        border: 4px solid #0ff;
        border-radius: 15px;
        color: #0ff;
        font-family: monospace;
        font-size: 24px;
        text-align: center;
        display: none;
        z-index: 4000;
    `;
    document.body.appendChild(sonarVisual);
}

function showSonarResult(distance) {
    if (!sonarVisual) createSonarVisual();
    
    let status, color, instruction;
    
    if (distance < 0.8) {
        status = '🚫 WALL!';
        color = '#f00';
        instruction = 'ROTATE NOW!';
    } else if (distance < 1.5) {
        status = '⚠️ VERY CLOSE';
        color = '#ff4400';
        instruction = 'TURN OR STOP';
    } else if (distance < 3) {
        status = '✓ CLEAR';
        color = '#ffff00';
        instruction = 'CAN MOVE FORWARD';
    } else {
        status = '✅ WIDE OPEN';
        color = '#00ff00';
        instruction = 'PATH IS CLEAR';
    }
    
    sonarVisual.innerHTML = `
        <div style="font-size: 36px; margin-bottom: 15px;">${status}</div>
        <div style="font-size: 22px; color: ${color}; margin-bottom: 15px;">${distance.toFixed(1)} tiles</div>
        <div style="font-size: 18px; color: #fff; background: rgba(0,255,255,0.2); padding: 12px; border-radius: 5px;">${instruction}</div>
    `;
    sonarVisual.style.borderColor = color;
    sonarVisual.style.display = 'block';
    
    setTimeout(() => {
        sonarVisual.style.display = 'none';
    }, 2500);
}

function fireSonarPing(player, map) {
    const audioCtx = getAudioContext();
    if (!audioCtx) return null;
    
    // Cast ray ONLY in front direction (max 5 tiles)
    const frontDistance = castRay(player.x, player.y, player.angle, map, 5);
    
    console.log(`📡 Sonar: ${frontDistance.toFixed(2)} tiles ahead (max range: 5 tiles)`);
    
    playEchoSonar(frontDistance);
    showSonarResult(frontDistance);
    
    return { front: frontDistance };
}

function playEchoSonar(distance) {
    const audioCtx = getAudioContext();
    const master = getMasterGain();
    const now = audioCtx.currentTime;
    
    // OUTGOING PING
    const pingOut = audioCtx.createOscillator();
    pingOut.type = 'sine';
    pingOut.frequency.value = 1400;
    
    const pingOutGain = audioCtx.createGain();
    pingOutGain.gain.setValueAtTime(0.5, now);
    pingOutGain.gain.exponentialRampToValueAtTime(0.01, now + 0.06);
    
    pingOut.connect(pingOutGain);
    pingOutGain.connect(master);
    pingOut.start(now);
    pingOut.stop(now + 0.06);
    
    // ECHO - adjusted for 5 tile max range
    const echoDelay = 0.1 + (distance / 5) * 0.4; // 0.1s to 0.5s
    const echoTime = now + echoDelay;
    
    const echoOsc = audioCtx.createOscillator();
    echoOsc.type = 'sine';
    echoOsc.frequency.value = 1200;
    
    const echoGain = audioCtx.createGain();
    const echoVolume = Math.max(0.2, 1 - (distance / 5)) * 0.4;
    echoGain.gain.setValueAtTime(echoVolume, echoTime);
    echoGain.gain.exponentialRampToValueAtTime(0.01, echoTime + 0.25);
    
    echoOsc.connect(echoGain);
    echoGain.connect(master);
    echoOsc.start(echoTime);
    echoOsc.stop(echoTime + 0.25);
    
    console.log(`  → Echo delay: ${(echoDelay * 1000).toFixed(0)}ms`);
}

console.log('✅ Sonar system loaded (5 tile range)');
