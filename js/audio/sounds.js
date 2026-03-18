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
    noise.stop(now + 0.3);
}

let minotaurPanner = null;

function playMinotaurStep(minotaur) {
    const audioCtx = getAudioContext();
    const master = getMasterGain();
    const reverb = typeof getReverbNode === 'function' ? getReverbNode() : null;
    
    if (!audioCtx || !master) return;
    
    if (!minotaurPanner) {
        minotaurPanner = audioCtx.createPanner();
        minotaurPanner.panningModel = 'HRTF';
        minotaurPanner.distanceModel = 'linear';
        minotaurPanner.refDistance = 20; // 100% volume within 1 tile
        minotaurPanner.maxDistance = 600; // Linear fade across 30 tiles (full map)
        minotaurPanner.rolloffFactor = 1.0;
        
        minotaurPanner.connect(master);
        if (reverb) minotaurPanner.connect(reverb);
    }
    
    const now = audioCtx.currentTime;
    
    // Snap to minotaur's exact physical coordinates smoothly
    minotaurPanner.positionX.setTargetAtTime(minotaur.x * 20, now, 0.1); 
    minotaurPanner.positionY.value = 0;
    minotaurPanner.positionZ.setTargetAtTime(minotaur.y * 20, now, 0.1);
    
    // Low, distorted stomp with square growl
    const osc = audioCtx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(60, now);
    osc.frequency.exponentialRampToValueAtTime(10, now + 0.5);
    
    const growl = audioCtx.createOscillator();
    growl.type = 'square';
    growl.frequency.setValueAtTime(40, now);
    growl.frequency.exponentialRampToValueAtTime(10, now + 0.5);
    
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, now);
    filter.frequency.exponentialRampToValueAtTime(50, now + 0.5);
    filter.Q.value = 5; // Resonant 'thwack'
    
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(3.0, now + 0.05); // Massive Thump
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
    
    osc.connect(filter);
    growl.connect(filter);
    filter.connect(gain);
    gain.connect(minotaurPanner);
    
    osc.start(now);
    growl.start(now);
    osc.stop(now + 0.5);
    growl.stop(now + 0.5);
}

function playJumpScareLevel() {
    const audioCtx = getAudioContext();
    const master = getMasterGain();
    if (!audioCtx || !master) return;
    
    const now = audioCtx.currentTime;
    
    // Max volume override
    master.gain.setValueAtTime(1.0, now);
    
    // Piercing screech
    const osc1 = audioCtx.createOscillator();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(800, now);
    osc1.frequency.exponentialRampToValueAtTime(300, now + 1.5);
    
    const osc2 = audioCtx.createOscillator();
    osc2.type = 'square';
    osc2.frequency.setValueAtTime(850, now);
    osc2.frequency.exponentialRampToValueAtTime(320, now + 1.5);
    
    const lfo = audioCtx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 40; // FM synthesis rattle
    
    const lfoGain = audioCtx.createGain();
    lfoGain.gain.value = 500;
    
    lfo.connect(lfoGain);
    lfoGain.connect(osc1.frequency);
    lfoGain.connect(osc2.frequency);
    
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1000, now);
    filter.Q.value = 5;
    
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(1.0, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 1.5);
    
    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    
    lfo.start(now);
    osc1.start(now);
    osc2.start(now);
    
    lfo.stop(now + 1.5);
    osc1.stop(now + 1.5);
    osc2.stop(now + 1.5);
}

// Footstep timing moved to gameLoop for perfect responsiveness

/**
 * Play collision sound effect
 * @param {string} direction - 'front', 'back', 'left', 'right'
 */
function playCollisionSound(direction = 'front') {
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
    
    // Stereo panning based on wall impact direction
    const panner = audioCtx.createStereoPanner();
    if (direction === 'left') panner.pan.value = -1;
    else if (direction === 'right') panner.pan.value = 1;
    else panner.pan.value = 0;
    
    osc.connect(collisionGain);
    collisionGain.connect(panner);
    
    panner.connect(master);
    
    const reverb = getReverbNode();
    if (reverb) panner.connect(reverb);
    
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

/**
 * Play a cinematic power-up sound for the main menu
 */
function playPowerUpSound() {
    const audioCtx = getAudioContext();
    const master = getMasterGain();
    const reverb = typeof getReverbNode === 'function' ? getReverbNode() : null;
    if (!audioCtx || !master) return;
    
    const now = audioCtx.currentTime;
    
    // Deep bass sweep
    const osc = audioCtx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(50, now);
    osc.frequency.exponentialRampToValueAtTime(150, now + 1.5);
    
    // High tech shimmer
    const osc2 = audioCtx.createOscillator();
    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(400, now);
    osc2.frequency.exponentialRampToValueAtTime(800, now + 1.5);
    
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.3, now + 1.0);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 3.0);
    
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(200, now);
    filter.frequency.linearRampToValueAtTime(2000, now + 1.5);
    
    osc.connect(gain);
    osc2.connect(filter);
    filter.connect(gain);
    
    gain.connect(master);
    if (reverb) gain.connect(reverb);
    
    osc.start(now);
    osc2.start(now);
    osc.stop(now + 3.0);
    osc2.stop(now + 3.0);
}

/**
 * Play dull click when sonar is on cooldown
 */
function playSonarError() {
    const audioCtx = getAudioContext();
    const master = getMasterGain();
    const reverb = typeof getReverbNode === 'function' ? getReverbNode() : null;
    if (!audioCtx || !master) return;
    
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(100, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.05);
    
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
    
    osc.connect(gain);
    gain.connect(master);
    if (reverb) gain.connect(reverb);
    osc.start(now);
    osc.stop(now + 0.05);
}

console.log('✅ Sound effects module loaded');
