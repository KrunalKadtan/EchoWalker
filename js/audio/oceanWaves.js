let exitPanner = null;
let exitGain = null;
let oceanWaveNodes = [];

/**
 * Create the ocean wave soundscape at the exit position
 */
function createOceanWaves() {
    const audioCtx = getAudioContext();
    const master = getMasterGain();
    
    if (!audioCtx) {
        console.error('Audio context not initialized');
        return;
    }
    
    console.log('Creating ocean wave soundscape...');
    
    // Create 3D panner for spatial positioning
    exitPanner = audioCtx.createPanner();
    exitPanner.panningModel = 'HRTF';
    exitPanner.distanceModel = 'inverse';
    exitPanner.refDistance = 3;
    exitPanner.rolloffFactor = 1.5;
    exitPanner.maxDistance = 1000;
    
    // Exit gain control
    exitGain = audioCtx.createGain();
    exitGain.gain.value = 0.4;
    
    // Connect exit gain -> panner -> master
    exitGain.connect(exitPanner);
    exitPanner.connect(master);
    
    // Create 3 wave layers with different characteristics
    createWaveLayer(0.3, 200, 800, 0.4);   // Low rumble
    createWaveLayer(0.5, 400, 1200, 0.3);  // Mid wash
    createWaveLayer(0.8, 800, 2000, 0.2);  // High splash
    
    console.log('Ocean waves created (3 layers)');
    
    // Schedule random wave crashes
    scheduleWaveCrash();
}

/**
 * Create a single wave layer with LFO modulation
 * @param {number} lfoRate - LFO frequency in Hz
 * @param {number} minFreq - Minimum filter frequency
 * @param {number} maxFreq - Maximum filter frequency
 * @param {number} volume - Layer volume (0-1)
 */
function createWaveLayer(lfoRate, minFreq, maxFreq, volume) {
    const audioCtx = getAudioContext();
    const noiseBuffer = getNoiseBuffer();
    
    // Noise source (loops continuously)
    const noise = audioCtx.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;
    
    // Bandpass filter for wave character
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = (minFreq + maxFreq) / 2;
    filter.Q.value = 1;
    
    // LFO for filter frequency modulation (wave motion)
    const lfo = audioCtx.createOscillator();
    lfo.frequency.value = lfoRate;
    const lfoGain = audioCtx.createGain();
    lfoGain.gain.value = (maxFreq - minFreq) / 2;
    
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    
    // Amplitude LFO (creates swells)
    const ampLFO = audioCtx.createOscillator();
    ampLFO.frequency.value = lfoRate * 0.7;
    const ampLFOGain = audioCtx.createGain();
    ampLFOGain.gain.value = volume * 0.3;
    
    const waveGain = audioCtx.createGain();
    waveGain.gain.value = volume;
    
    ampLFO.connect(ampLFOGain);
    ampLFOGain.connect(waveGain.gain);
    
    // Audio graph: noise -> filter -> gain -> exit gain
    noise.connect(filter);
    filter.connect(waveGain);
    waveGain.connect(exitGain);
    
    // Start all sources
    noise.start();
    lfo.start();
    ampLFO.start();
    
    // Store references
    oceanWaveNodes.push({ noise, filter, lfo, ampLFO, waveGain, lfoGain, ampLFOGain });
    
    console.log(`   Layer: ${minFreq}-${maxFreq}Hz @ ${lfoRate}Hz LFO, volume ${volume}`);
}

/**
 * Schedule random wave crash sound effects
 */
function scheduleWaveCrash() {
    const audioCtx = getAudioContext();
    const noiseBuffer = getNoiseBuffer();
    
    if (!audioCtx) {
        setTimeout(scheduleWaveCrash, 3000);
        return;
    }
    
    const now = audioCtx.currentTime;
    
    // Create crash (high-frequency burst)
    const crash = audioCtx.createBufferSource();
    crash.buffer = noiseBuffer;
    
    const crashFilter = audioCtx.createBiquadFilter();
    crashFilter.type = 'highpass';
    crashFilter.frequency.value = 1000;
    
    const crashGain = audioCtx.createGain();
    crashGain.gain.setValueAtTime(0, now);
    crashGain.gain.linearRampToValueAtTime(0.3, now + 0.2);
    crashGain.gain.exponentialRampToValueAtTime(0.01, now + 1.5);
    
    crash.connect(crashFilter);
    crashFilter.connect(crashGain);
    crashGain.connect(exitGain);
    
    crash.start(now);
    crash.stop(now + 1.5);
    
    // Schedule next crash (3-7 seconds later)
    const nextCrash = 3000 + Math.random() * 4000;
    setTimeout(scheduleWaveCrash, nextCrash);
}

/**
 * Update 3D position of ocean sound based on exit location
 * @param {Object} exit - Exit coordinates {x, y}
 */
function updateOceanPosition(exit) {
    if (!exitPanner) return;
    
    exitPanner.positionX.value = exit.x * TILE_SIZE;
    exitPanner.positionY.value = 0;
    exitPanner.positionZ.value = exit.y * TILE_SIZE;
}

/**
 * Get the exit panner for external use
 * @returns {PannerNode} The exit panner node
 */
function getExitPanner() {
    return exitPanner;
}

console.log('Ocean waves module loaded');
