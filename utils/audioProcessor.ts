
export type AudioFilterType = 'ORIGINAL' | 'RADIO' | 'PHONE' | 'AUDITORIUM' | 'CLEAN';

// Helper to convert Blob to AudioBuffer
const decodeAudioData = async (audioBlob: Blob): Promise<AudioBuffer> => {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const arrayBuffer = await audioBlob.arrayBuffer();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  audioContext.close(); // Clean up
  return audioBuffer;
};

// Helper to create an impulse response buffer for Reverb
const createReverbImpulse = (ctx: BaseAudioContext, duration: number, decay: number, reverse: boolean = false) => {
    const rate = ctx.sampleRate;
    const length = rate * duration;
    const impulse = ctx.createBuffer(2, length, rate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
        let n = reverse ? length - i : i;
        // Generate noise with exponential decay
        const val = (Math.random() * 2 - 1) * Math.pow(1 - n / length, decay);
        left[i] = val;
        right[i] = val;
    }
    return impulse;
};

// Helper to encode AudioBuffer to WAV Blob
const audioBufferToWav = (buffer: AudioBuffer): Blob => {
    const numOfChan = buffer.numberOfChannels;
    const length = buffer.length * numOfChan * 2 + 44;
    const bufferArray = new ArrayBuffer(length);
    const view = new DataView(bufferArray);
    const channels = [];
    let i;
    let sample;
    let offset = 0;
    let pos = 0;

    // write WAVE header
    setUint32(0x46464952); // "RIFF"
    setUint32(length - 8); // file length - 8
    setUint32(0x45564157); // "WAVE"

    setUint32(0x20746d66); // "fmt " chunk
    setUint32(16); // length = 16
    setUint16(1); // PCM (uncompressed)
    setUint16(numOfChan);
    setUint32(buffer.sampleRate);
    setUint32(buffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
    setUint16(numOfChan * 2); // block-align
    setUint16(16); // 16-bit (hardcoded in this example)

    setUint32(0x61746164); // "data" - chunk
    setUint32(length - pos - 4); // chunk length

    // write interleaved data
    for(i = 0; i < buffer.numberOfChannels; i++)
        channels.push(buffer.getChannelData(i));

    while(pos < buffer.length) {
        for(i = 0; i < numOfChan; i++) {
            // clamp
            sample = Math.max(-1, Math.min(1, channels[i][pos])); 
            // scale to 16-bit signed int
            sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767)|0; 
            view.setInt16(44 + offset, sample, true); 
            offset += 2;
        }
        pos++;
    }

    return new Blob([bufferArray], { type: 'audio/wav' });

    function setUint16(data: any) {
        view.setUint16(pos, data, true);
        pos += 2;
    }

    function setUint32(data: any) {
        view.setUint32(pos, data, true);
        pos += 4;
    }
};

export const applyAudioFilter = async (
    audioBlob: Blob, 
    filterType: AudioFilterType
): Promise<Blob> => {
    if (filterType === 'ORIGINAL') return audioBlob;

    const originalBuffer = await decodeAudioData(audioBlob);
    
    // We use OfflineAudioContext to render the effect faster than real-time
    const offlineCtx = new OfflineAudioContext(
        originalBuffer.numberOfChannels,
        originalBuffer.length,
        originalBuffer.sampleRate
    );

    const source = offlineCtx.createBufferSource();
    source.buffer = originalBuffer;

    let connectionChain: AudioNode = source;

    switch (filterType) {
        case 'RADIO':
            // 1. Compressor (Even out volume)
            const compressor = offlineCtx.createDynamicsCompressor();
            compressor.threshold.value = -24;
            compressor.knee.value = 30;
            compressor.ratio.value = 12;
            compressor.attack.value = 0.003;
            compressor.release.value = 0.25;
            
            // 2. EQ (Boost Bass and Treble for "Broadcast" sound)
            const lowShelf = offlineCtx.createBiquadFilter();
            lowShelf.type = 'lowshelf';
            lowShelf.frequency.value = 200;
            lowShelf.gain.value = 4; // Boost bass

            const highShelf = offlineCtx.createBiquadFilter();
            highShelf.type = 'highshelf';
            highShelf.frequency.value = 3000;
            highShelf.gain.value = 4; // Boost treble

            connectionChain.connect(compressor);
            compressor.connect(lowShelf);
            lowShelf.connect(highShelf);
            connectionChain = highShelf;
            break;

        case 'PHONE':
            // Bandpass filter to simulate telephone bandwidth (300Hz - 3000Hz)
            const lowCut = offlineCtx.createBiquadFilter();
            lowCut.type = 'highpass';
            lowCut.frequency.value = 300;

            const highCut = offlineCtx.createBiquadFilter();
            highCut.type = 'lowpass';
            highCut.frequency.value = 3000;
            
            // Slight distortion/compression
            const phoneCompressor = offlineCtx.createDynamicsCompressor();
            phoneCompressor.threshold.value = -10;
            phoneCompressor.ratio.value = 20;

            connectionChain.connect(lowCut);
            lowCut.connect(highCut);
            highCut.connect(phoneCompressor);
            connectionChain = phoneCompressor;
            break;

        case 'AUDITORIUM':
            // Convolution Reverb
            const convolver = offlineCtx.createConvolver();
            // Create a 2-second decay impulse
            convolver.buffer = createReverbImpulse(offlineCtx, 2, 2, false); 
            
            // Dry/Wet Mix (Simulated by parallel connection)
            const dryGain = offlineCtx.createGain();
            const wetGain = offlineCtx.createGain();
            dryGain.gain.value = 0.6; // 60% original signal
            wetGain.gain.value = 0.4; // 40% reverb

            source.connect(dryGain);
            source.connect(convolver);
            convolver.connect(wetGain);
            
            dryGain.connect(offlineCtx.destination);
            wetGain.connect(offlineCtx.destination);
            
            source.start(0);
            const reverbBuffer = await offlineCtx.startRendering();
            return audioBufferToWav(reverbBuffer);

        case 'CLEAN':
            // AI Voice Clean Chain
            // 1. High Pass (Remove rumble/wind < 80Hz)
            const hpFilter = offlineCtx.createBiquadFilter();
            hpFilter.type = 'highpass';
            hpFilter.frequency.value = 85;

            // 2. High Shelf Cut (Remove excessive hiss > 10kHz)
            const hissFilter = offlineCtx.createBiquadFilter();
            hissFilter.type = 'highshelf';
            hissFilter.frequency.value = 10000;
            hissFilter.gain.value = -5; // Cut 5dB

            // 3. Presence Boost (Enhance articulation around 4kHz)
            const presenceFilter = offlineCtx.createBiquadFilter();
            presenceFilter.type = 'peaking';
            presenceFilter.frequency.value = 4000;
            presenceFilter.Q.value = 1.0;
            presenceFilter.gain.value = 3; // Boost 3dB for clarity

            // 4. Compressor (Level out volume and boost quiet parts)
            const cleanComp = offlineCtx.createDynamicsCompressor();
            cleanComp.threshold.value = -24;
            cleanComp.knee.value = 30;
            cleanComp.ratio.value = 4; // Moderate compression
            cleanComp.attack.value = 0.003;
            cleanComp.release.value = 0.25;

            // Chain: Source -> HP -> HissCut -> Presence -> Comp -> Dest
            connectionChain.connect(hpFilter);
            hpFilter.connect(hissFilter);
            hissFilter.connect(presenceFilter);
            presenceFilter.connect(cleanComp);
            connectionChain = cleanComp;
            break;
    }

    // For linear chains
    connectionChain.connect(offlineCtx.destination);
    source.start(0);
    const renderedBuffer = await offlineCtx.startRendering();
    return audioBufferToWav(renderedBuffer);
};
