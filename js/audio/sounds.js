let footstepInterval = null;

/**
 * Play a single footstep sound
 */
function playFootstep() {
    const audioCtx = getAudioContext();
    const master = getMasterGain();
    
    if (!audioCtx) return;
    
    const now = audioCtx.currentTime;
    const bufferSize = audioCtx.sampleRate * 0.08; // 80ms
    
    // Create noise buffer for footstep
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.4;
    }
    
    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;
    
    // Lowpass filter for muffled footstep sound
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 300;
    
    const footGain = audioCtx.createGain();
    footGain.gain.value = 0.2;
    footGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    
    noise.connect(filter);
    filter.connect(footGain);
    footGain.connect(master);
    
    const reverb = getReverbNode();
    if (reverb) footGain.connect(reverb);
    
    noise.start(now);
    noise.stop(now + 0.08);
}

/**
 * Start playing footsteps based on movement mode
 * @param {string} mode - Movement mode ('creep', 'walk', 'run')
 */
function startFootsteps(mode = 'walk') {
    stopFootsteps();
    
    const intervals = {
        creep: 800,   // Slower footsteps
        walk: 500,    // Normal footsteps
        run: 300      // Faster footsteps
    };
    
    const interval = intervals[mode] || 500;
    
    footstepInterval = setInterval(() => {
        // FIXED: Only play if actually moving
        if (isMoving()) {
            playFootstep();
        }
    }, interval);
    
    console.log(`👣 Footsteps started (${mode} mode, ${interval}ms interval)`);
}

/**
 * Stop playing footsteps
 */
function stopFootsteps() {
    if (footstepInterval) {
        clearInterval(footstepInterval);
        footstepInterval = null;
    }
}

/**
 * Restart footsteps with current mode
 * Call this when movement mode changes
 */
function restartFootsteps() {
    const currentMode = getMovementMode();
    startFootsteps(currentMode);
}

/**
 * Play collision sound effect
 */
function playCollisionSound() {
    const audioCtx = getAudioContext();
    const master = getMasterGain();
    
    if (!audioCtx) return;
    
    const now = audioCtx.currentTime;
    
    // Low-frequency thud
    const osc = audioCtx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(80, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.1);
    
    const collisionGain = audioCtx.createGain();
    collisionGain.gain.setValueAtTime(0.3, now);
    collisionGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    
    osc.connect(collisionGain);
    collisionGain.connect(master);
    
    const reverb = getReverbNode();
    if (reverb) collisionGain.connect(reverb);
    
    osc.start(now);
    osc.stop(now + 0.1);
}

/**
 * Play victory sound sequence
 */
function playVictorySound() {
    const audioCtx = getAudioContext();
    const master = getMasterGain();
    
    if (!audioCtx) return;
    
    console.log('🎉 Playing victory sound');
    
    const now = audioCtx.currentTime;
    
    // Ascending arpeggio: A4, C#5, E5, A5
    const notes = [440, 554.37, 659.25, 880];
    
    notes.forEach((freq, i) => {
        const osc = audioCtx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = freq;
        
        const gain = audioCtx.createGain();
        gain.gain.setValueAtTime(0.3, now + i * 0.2);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.2 + 0.8);
        
        osc.connect(gain);
        gain.connect(master);
        
        osc.start(now + i * 0.2);
        osc.stop(now + i * 0.2 + 0.8);
    });
    
    // Final chord: A4, C#5, E5
    const chordNotes = [440, 554.37, 659.25];
    
    chordNotes.forEach(freq => {
        const osc = audioCtx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = freq;
        
        const gain = audioCtx.createGain();
        gain.gain.setValueAtTime(0.2, now + 0.8);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 2.5);
        
        osc.connect(gain);
        gain.connect(master);
        
        osc.start(now + 0.8);
        osc.stop(now + 2.5);
    });
}

/**
 * Play UI sound when switching movement modes
 * @param {string} mode - 'creep', 'walk', 'run'
 */
function playModeChangeSound(mode) {
    const audioCtx = getAudioContext();
    const master = getMasterGain();
    if (!audioCtx || !master) return;
    
    const now = audioCtx.currentTime;
    
    let count = 1;
    let pitch = 800; // Creep
    if (mode === 'walk') { count = 2; pitch = 1000; }
    if (mode === 'run') { count = 3; pitch = 1200; }
    
    for (let i = 0; i < count; i++) {
        const timeOffset = now + i * 0.12;
        const osc = audioCtx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(pitch, timeOffset);
        osc.frequency.exponentialRampToValueAtTime(pitch * 0.5, timeOffset + 0.05);
        
        const gain = audioCtx.createGain();
        gain.gain.setValueAtTime(0.2, timeOffset);
        gain.gain.exponentialRampToValueAtTime(0.01, timeOffset + 0.05);
        
        osc.connect(gain);
        gain.connect(master);
        
        osc.start(timeOffset);
        osc.stop(timeOffset + 0.05);
    }
}

console.log('✅ Sound effects module loaded');
