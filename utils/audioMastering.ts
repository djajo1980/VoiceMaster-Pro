
export interface AudioQualityReport {
    duration: number;
    maxPeakDB: number;
    rmsDB: number;
    estimatedLUFS: number; // Approximate
    clippingDetected: boolean;
    hasSilenceIssues: boolean;
    dynamicRange: number;
}

// Convert audio blob to buffer
const decodeAudioData = async (audioBlob: Blob): Promise<AudioBuffer> => {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const arrayBuffer = await audioBlob.arrayBuffer();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  audioContext.close();
  return audioBuffer;
};

// Helper to convert linear amplitude to dB
const toDB = (amplitude: number) => 20 * Math.log10(Math.max(amplitude, 0.00001));

export const analyzeAudioQuality = async (blob: Blob): Promise<AudioQualityReport> => {
    const buffer = await decodeAudioData(blob);
    const rawData = buffer.getChannelData(0); // Analyze first channel (mono compatible)
    
    let maxPeak = 0;
    let sumSquares = 0;
    let clippingCount = 0;

    for (let i = 0; i < rawData.length; i++) {
        const abs = Math.abs(rawData[i]);
        if (abs > maxPeak) maxPeak = abs;
        if (abs >= 0.99) clippingCount++;
        sumSquares += abs * abs;
    }

    const rms = Math.sqrt(sumSquares / rawData.length);
    const rmsDB = toDB(rms);
    const maxPeakDB = toDB(maxPeak);
    
    // Very rough LUFS approximation: RMS dB - 0.691 (offset varies, simplified here)
    // K-weighting is complex to implement client-side without heavy WASM, 
    // so we use RMS as a "Loudness" proxy for training purposes.
    const estimatedLUFS = rmsDB - 3; 

    return {
        duration: buffer.duration,
        maxPeakDB: Number(maxPeakDB.toFixed(1)),
        rmsDB: Number(rmsDB.toFixed(1)),
        estimatedLUFS: Number(estimatedLUFS.toFixed(1)),
        clippingDetected: clippingCount > 10, // tolerance
        hasSilenceIssues: rmsDB < -50,
        dynamicRange: maxPeakDB - rmsDB
    };
};

// Master the audio: Normalize to target LUFS/Peak
export const masterAudio = async (blob: Blob): Promise<Blob> => {
    const originalBuffer = await decodeAudioData(blob);
    
    // Target: -1.0 dB Peak, approx -14 LUFS volume boost
    // Since we don't have true LUFS measurement, we normalize Peak to -1dB 
    // and apply mild compression to bring up volume.
    
    const offlineCtx = new OfflineAudioContext(
        originalBuffer.numberOfChannels,
        originalBuffer.length,
        originalBuffer.sampleRate
    );

    const source = offlineCtx.createBufferSource();
    source.buffer = originalBuffer;

    // 1. Dynamics Compressor (The "Glue")
    const compressor = offlineCtx.createDynamicsCompressor();
    compressor.threshold.value = -20;
    compressor.knee.value = 30;
    compressor.ratio.value = 4; // Gentle compression
    compressor.attack.value = 0.003;
    compressor.release.value = 0.25;

    // 2. Limiter (Prevent Clipping)
    // We simulate a limiter using another compressor with high ratio
    const limiter = offlineCtx.createDynamicsCompressor();
    limiter.threshold.value = -1.0;
    limiter.ratio.value = 20.0; // Hard limit behavior
    limiter.attack.value = 0.001;
    limiter.release.value = 0.1;

    // 3. Gain (Make up gain)
    // Analyze peak of original first to see how much room we have?
    // Simplified: Just boost into the limiter.
    const gain = offlineCtx.createGain();
    gain.gain.value = 1.5; // boost volume by 50% before limiting to make it "loud"

    source.connect(compressor);
    compressor.connect(gain);
    gain.connect(limiter);
    limiter.connect(offlineCtx.destination);

    source.start(0);
    const renderedBuffer = await offlineCtx.startRendering();
    
    return audioBufferToWav(renderedBuffer);
};


// Helper (duplicated from audioProcessor to avoid circular deps or complex refactoring)
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

    function setUint16(data: any) { view.setUint16(pos, data, true); pos += 2; }
    function setUint32(data: any) { view.setUint32(pos, data, true); pos += 4; }

    setUint32(0x46464952); // "RIFF"
    setUint32(length - 8); 
    setUint32(0x45564157); // "WAVE"
    setUint32(0x20746d66); // "fmt "
    setUint32(16); 
    setUint16(1); 
    setUint16(numOfChan);
    setUint32(buffer.sampleRate);
    setUint32(buffer.sampleRate * 2 * numOfChan); 
    setUint16(numOfChan * 2); 
    setUint16(16); 
    setUint32(0x61746164); // "data"
    setUint32(length - pos - 4); 

    for(i = 0; i < buffer.numberOfChannels; i++)
        channels.push(buffer.getChannelData(i));

    while(pos < buffer.length) {
        for(i = 0; i < numOfChan; i++) {
            sample = Math.max(-1, Math.min(1, channels[i][pos])); 
            sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767)|0; 
            view.setInt16(44 + offset, sample, true); 
            offset += 2;
        }
        pos++;
    }
    return new Blob([bufferArray], { type: 'audio/wav' });
};
