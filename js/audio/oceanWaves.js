/**
 * Ocean Wave Synthesis - Directional Audio Guide
 * Author: Krunal Kadtan
 */

let exitPanner = null;
let exitGain = null;
let oceanWaveNodes = [];
let waveCrashTimeout = null;

function createOceanWaves() {
    if (waveCrashTimeout) clearTimeout(waveCrashTimeout);
    oceanWaveNodes = [];
    window.oceanWaveNodes = oceanWaveNodes;
    const audioCtx = getAudioContext();
    const master = getMasterGain();
    
    if (!audioCtx) return;
    
    console.log('🌊 Creating ocean wave soundscape...');
    
    // 3D Panner for exit
    exitPanner = audioCtx.createPanner();
    exitPanner.panningModel = 'HRTF';
    exitPanner.distanceModel = 'linear';
    exitPanner.refDistance = 1;
    exitPanner.maxDistance = 500;
    exitPanner.rolloffFactor = 1;
    exitPanner.coneInnerAngle = 360;
    exitPanner.coneOuterAngle = 360;
    
    exitGain = audioCtx.createGain();
    exitGain.gain.value = 0.6; // Increased base volume
    
    exitGain.connect(exitPanner);
    exitPanner.connect(master);
    
    // Create wave layers
    createWaveLayer(0.3, 200, 800, 0.5);
    createWaveLayer(0.5, 400, 1200, 0.4);
    createWaveLayer(0.8, 800, 2000, 0.3);
    
    console.log('✅ Ocean waves created');
    
    scheduleWaveCrash();
}

function createWaveLayer(lfoRate, minFreq, maxFreq, volume) {
    const audioCtx = getAudioContext();
    const noiseBuffer = getNoiseBuffer();
    
    const noise = audioCtx.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;
    
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = (minFreq + maxFreq) / 2;
    filter.Q.value = 1;
    
    const lfo = audioCtx.createOscillator();
    lfo.frequency.value = lfoRate;
    const lfoGain = audioCtx.createGain();
    lfoGain.gain.value = (maxFreq - minFreq) / 2;
    
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    
    const ampLFO = audioCtx.createOscillator();
    ampLFO.frequency.value = lfoRate * 0.7;
    const ampLFOGain = audioCtx.createGain();
    ampLFOGain.gain.value = volume * 0.3;
    
    const waveGain = audioCtx.createGain();
    waveGain.gain.value = volume;
    
    ampLFO.connect(ampLFOGain);
    ampLFOGain.connect(waveGain.gain);
    
    noise.connect(filter);
    filter.connect(waveGain);
    waveGain.connect(exitGain);
    
    noise.start();
    lfo.start();
    ampLFO.start();
    
    oceanWaveNodes.push({ noise, filter, lfo, ampLFO, waveGain });
}

function scheduleWaveCrash() {
    const audioCtx = getAudioContext();
    const noiseBuffer = getNoiseBuffer();
    
    if (!audioCtx) {
        waveCrashTimeout = setTimeout(scheduleWaveCrash, 3000);
        return;
    }
    
    const now = audioCtx.currentTime;
    
    const crash = audioCtx.createBufferSource();
    crash.buffer = noiseBuffer;
    
    const crashFilter = audioCtx.createBiquadFilter();
    crashFilter.type = 'highpass';
    crashFilter.frequency.value = 1200;
    
    const crashGain = audioCtx.createGain();
    crashGain.gain.setValueAtTime(0, now);
    crashGain.gain.linearRampToValueAtTime(0.4, now + 0.15);
    crashGain.gain.exponentialRampToValueAtTime(0.01, now + 1.2);
    
    crash.connect(crashFilter);
    crashFilter.connect(crashGain);
    crashGain.connect(exitGain);
    
    crash.start(now);
    crash.stop(now + 1.2);
    
    waveCrashTimeout = setTimeout(scheduleWaveCrash, 2000 + Math.random() * 3000);
}

let currentOceanX = null;
let currentOceanZ = null;

function resetOceanLerp() {
    currentOceanX = null;
    currentOceanZ = null;
}

function updateOceanPosition(exit) {
    if (!exitPanner) return;
    
    const targetX = exit.x * TILE_SIZE;
    const targetZ = exit.y * TILE_SIZE;
    
    // Snap instantly if uninitialized or teleporting across maps
    if (currentOceanX === null || 
        Math.abs(targetX - currentOceanX) > TILE_SIZE * 15 || 
        Math.abs(targetZ - currentOceanZ) > TILE_SIZE * 15) {
        
        currentOceanX = targetX;
        currentOceanZ = targetZ;
        exitPanner.positionX.value = currentOceanX;
        exitPanner.positionY.value = 0;
        exitPanner.positionZ.value = currentOceanZ;
        return;
    }
    
    // Extremely smooth exponential drag for fluid acoustic transitions (2% per frame)
    // This makes the audio smoothly and progressively bend around corners 
    // over the course of 1-2 seconds as the player approaches.
    currentOceanX += (targetX - currentOceanX) * 0.02;
    currentOceanZ += (targetZ - currentOceanZ) * 0.02;
    
    exitPanner.positionX.value = currentOceanX;
    exitPanner.positionY.value = 0;
    exitPanner.positionZ.value = currentOceanZ;
}

function updateOceanVolume(player, exit) {
    if (!exitGain) return;
    
    const distance = Math.sqrt(
        (player.x - exit.x) ** 2 + 
        (player.y - exit.y) ** 2
    );
    
    // Volume: far = 0.4, close = 1.0
    const maxDist = 14;
    const normalizedDist = Math.min(distance / maxDist, 1);
    const targetVolume = 1.0 - (normalizedDist * 0.6);
    
    const audioCtx = getAudioContext();
    const now = audioCtx.currentTime;
    exitGain.gain.linearRampToValueAtTime(targetVolume, now + 0.3);
}

function getExitPanner() {
    return exitPanner;
}

// Expose nodes for cleanup
window.oceanWaveNodes = oceanWaveNodes;

console.log('✅ Ocean waves module loaded');
