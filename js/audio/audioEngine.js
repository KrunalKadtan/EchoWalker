let audioContext = null;
let masterGain = null;
let waveNoiseBuffer = null;

/**
 * Initialize the Web Audio API context
 * Must be called after user interaction (click)
 */
function initAudio() {
    console.log('Initializing Web Audio API...');
    
    // Create audio context
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    // Create master gain node
    masterGain = audioContext.createGain();
    masterGain.gain.value = 0.8;
    masterGain.connect(audioContext.destination);
    
    console.log('Audio context initialized');
    console.log(`Sample rate: ${audioContext.sampleRate}Hz`);
    
    // Create noise buffer for wave synthesis
    createNoiseBuffer();
    
    return audioContext;
}

/**
 * Create a white noise buffer for wave synthesis
 */
function createNoiseBuffer() {
    const bufferSize = audioContext.sampleRate * 2; // 2 seconds
    waveNoiseBuffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
    const data = waveNoiseBuffer.getChannelData(0);
    
    // Generate white noise
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }
    
    console.log('Noise buffer created (2s @ ' + audioContext.sampleRate + 'Hz)');
}

/**
 * Get the current audio context
 * @returns {AudioContext} The audio context instance
 */
function getAudioContext() {
    return audioContext;
}

/**
 * Get the master gain node
 * @returns {GainNode} The master gain node
 */
function getMasterGain() {
    return masterGain;
}

/**
 * Get the noise buffer
 * @returns {AudioBuffer} The noise buffer
 */
function getNoiseBuffer() {
    return waveNoiseBuffer;
}

console.log('Audio engine module loaded');
