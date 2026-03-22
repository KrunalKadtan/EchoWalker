let audioContext = null;
let masterGain = null;
let waveNoiseBuffer = null;
let reverbNode = null;
let reverbGain = null;

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
    
    // Create Reverb System
    reverbNode = audioContext.createConvolver();
    reverbGain = audioContext.createGain();
    reverbGain.gain.value = 0.5; // Wet mix
    
    createReverbBuffer();
    reverbNode.connect(reverbGain);
    reverbGain.connect(masterGain);
    
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

function getReverbNode() {
    return reverbNode;
}

function createReverbBuffer() {
    const duration = 2.5; // 2.5 seconds of decay
    const sampleRate = audioContext.sampleRate;
    const length = sampleRate * duration;
    const impulse = audioContext.createBuffer(2, length, sampleRate);
    
    for (let channel = 0; channel < 2; channel++) {
        const channelData = impulse.getChannelData(channel);
        for (let i = 0; i < length; i++) {
            // White noise exponentially decaying
            channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 4);
        }
    }
    reverbNode.buffer = impulse;
    console.log('Synthetic cavern reverb generated');
}

console.log('Audio engine module loaded');
