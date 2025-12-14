
export type AmbienceType = 'RAIN' | 'FIRE' | 'CAFE' | 'FILE';

export class AmbientPlayer {
    private ctx: AudioContext | null = null;
    private nodes: AudioNode[] = [];
    private gainNode: GainNode | null = null;
    private isPlaying: boolean = false;
    private fileSource: AudioBufferSourceNode | null = null;
    private userFileBuffer: AudioBuffer | null = null;

    constructor() {
        // Initialize on demand
    }

    private initContext() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    public async setUserFile(file: File) {
        this.initContext();
        if (!this.ctx) return;
        const arrayBuffer = await file.arrayBuffer();
        this.userFileBuffer = await this.ctx.decodeAudioData(arrayBuffer);
    }

    public setVolume(val: number) {
        if (this.gainNode) {
            // Logarithmic fade
            this.gainNode.gain.setValueAtTime(this.gainNode.gain.value, this.ctx!.currentTime);
            this.gainNode.gain.exponentialRampToValueAtTime(val || 0.001, this.ctx!.currentTime + 0.1);
        }
    }

    public play(type: AmbienceType, volume: number = 0.3) {
        this.stop(); 
        this.initContext();
        if (!this.ctx) return;

        this.isPlaying = true;

        // Master Gain for volume control
        const masterGain = this.ctx.createGain();
        masterGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
        masterGain.gain.exponentialRampToValueAtTime(volume || 0.001, this.ctx.currentTime + 1); // Fade in
        masterGain.connect(this.ctx.destination);
        this.gainNode = masterGain;

        if (type === 'FILE' && this.userFileBuffer) {
            const source = this.ctx.createBufferSource();
            source.buffer = this.userFileBuffer;
            source.loop = true;
            source.connect(masterGain);
            source.start();
            this.fileSource = source;
            this.nodes.push(source);
        } else if (type === 'RAIN') {
            this.createRain(masterGain);
        } else if (type === 'FIRE') {
            this.createFire(masterGain);
        } else if (type === 'CAFE') {
            this.createPinkNoise(masterGain, 0.4); // Proxy for ambient chatter
            // Real cafe sound needs samples, using filtered noise as a placeholder for "room tone"
        }
    }

    // --- Synthesis Generators (No Oscillators!) ---

    private createNoiseBuffer() {
        if (!this.ctx) return null;
        const bufferSize = this.ctx.sampleRate * 2; // 2 seconds
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        return buffer;
    }

    private createPinkNoise(destination: AudioNode, vol: number) {
         // Simplified Pink Noise using simple filter
         if (!this.ctx) return;
         const buffer = this.createNoiseBuffer();
         if (!buffer) return;

         const source = this.ctx.createBufferSource();
         source.buffer = buffer;
         source.loop = true;
         
         const filter = this.ctx.createBiquadFilter();
         filter.type = 'lowpass';
         filter.frequency.value = 400;

         const gain = this.ctx.createGain();
         gain.gain.value = vol;

         source.connect(filter);
         filter.connect(gain);
         gain.connect(destination);
         source.start();

         this.nodes.push(source, filter, gain);
    }

    private createRain(destination: AudioNode) {
        if (!this.ctx) return;
        const buffer = this.createNoiseBuffer();
        if (!buffer) return;

        const source = this.ctx.createBufferSource();
        source.buffer = buffer;
        source.loop = true;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 800; // Rain cutoff

        const gain = this.ctx.createGain();
        gain.gain.value = 0.5;

        source.connect(filter);
        filter.connect(gain);
        gain.connect(destination);
        
        source.start();
        this.nodes.push(source, filter, gain);
    }

    private createFire(destination: AudioNode) {
        if (!this.ctx) return;
        
        // Base low rumble (Brown noise proxy)
        const buffer = this.createNoiseBuffer();
        if (!buffer) return;
        
        const source = this.ctx.createBufferSource();
        source.buffer = buffer;
        source.loop = true;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 150; // Low rumble

        const gain = this.ctx.createGain();
        gain.gain.value = 0.6;

        source.connect(filter);
        filter.connect(gain);
        gain.connect(destination);
        source.start();
        this.nodes.push(source, filter, gain);

        // Crackles (Random clicks)
        // In a real synthesis we'd use ScriptProcessor or AudioWorklet, 
        // but for simplicity we assume the rumble is enough for "Warmth"
    }

    public stop() {
        if (!this.isPlaying || !this.ctx) return;
        
        // Ramp down gains
        if (this.gainNode) {
            try {
                this.gainNode.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1);
            } catch (e) {}
        }

        // Stop nodes after fade
        setTimeout(() => {
            this.nodes.forEach(node => {
                try { 
                    if (node instanceof AudioBufferSourceNode) node.stop(); 
                    node.disconnect();
                } catch(e) {}
            });
            this.nodes = [];
            this.gainNode = null;
        }, 1000);

        this.isPlaying = false;
    }
}
