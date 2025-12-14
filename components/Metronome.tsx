
import React, { useState, useEffect, useRef } from 'react';
import { PlayIcon, StopIcon } from './Icons';

const Metronome: React.FC = () => {
    const [bpm, setBpm] = useState(100);
    const [isPlaying, setIsPlaying] = useState(false);
    const [visualTick, setVisualTick] = useState(false);
    
    // We use a ref for the audio context to reuse it
    const audioCtxRef = useRef<AudioContext | null>(null);
    const nextNoteTimeRef = useRef(0);
    const timerIDRef = useRef<number | null>(null);
    const lookahead = 25.0; // How frequently to call scheduling function (in milliseconds)
    const scheduleAheadTime = 0.1; // How far ahead to schedule audio (sec)

    useEffect(() => {
        return () => {
            if (timerIDRef.current) window.clearTimeout(timerIDRef.current);
            if (audioCtxRef.current) audioCtxRef.current.close().catch(() => {});
        };
    }, []);

    const nextNote = () => {
        const secondsPerBeat = 60.0 / bpm;
        nextNoteTimeRef.current += secondsPerBeat;
    }

    const playClick = (time: number) => {
        if (!audioCtxRef.current) return;
        
        const osc = audioCtxRef.current.createOscillator();
        const gainNode = audioCtxRef.current.createGain();

        osc.connect(gainNode);
        gainNode.connect(audioCtxRef.current.destination);

        // Simple high pitch click
        osc.frequency.value = 1000;
        
        // Envelope
        gainNode.gain.setValueAtTime(1, time);
        gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.1);

        osc.start(time);
        osc.stop(time + 0.1);

        // Visual feedback sync (using setTimeout approximate)
        const diff = (time - audioCtxRef.current.currentTime) * 1000;
        setTimeout(() => {
            setVisualTick(true);
            setTimeout(() => setVisualTick(false), 100);
        }, diff);
    };

    const scheduler = () => {
        // While there are notes that will need to play before the next interval, 
        // schedule them and advance the pointer.
        if (!audioCtxRef.current) return;

        while (nextNoteTimeRef.current < audioCtxRef.current.currentTime + scheduleAheadTime) {
            playClick(nextNoteTimeRef.current);
            nextNote();
        }
        timerIDRef.current = window.setTimeout(scheduler, lookahead);
    };

    const toggleMetronome = () => {
        if (isPlaying) {
            if (timerIDRef.current) window.clearTimeout(timerIDRef.current);
            setIsPlaying(false);
        } else {
            if (!audioCtxRef.current) {
                audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            }
            if (audioCtxRef.current.state === 'suspended') {
                audioCtxRef.current.resume();
            }
            
            nextNoteTimeRef.current = audioCtxRef.current.currentTime + 0.05;
            scheduler();
            setIsPlaying(true);
        }
    };

    return (
        <div className="bg-black/80 backdrop-blur-md border border-gray-700 rounded-xl p-4 flex flex-col items-center gap-3 w-48 shadow-xl">
            <div className="flex items-center justify-between w-full">
                <span className="text-xs font-bold text-gray-400">METRONOME</span>
                <div className={`w-3 h-3 rounded-full ${visualTick ? 'bg-secondary-red shadow-[0_0_10px_red]' : 'bg-gray-800'}`}></div>
            </div>
            
            <div className="flex items-center gap-2 w-full">
                <button 
                    onClick={toggleMetronome}
                    className={`p-2 rounded-full ${isPlaying ? 'bg-secondary-red text-white' : 'bg-primary-green text-black'}`}
                >
                    {isPlaying ? <StopIcon className="w-4 h-4"/> : <PlayIcon className="w-4 h-4"/>}
                </button>
                <div className="flex-1 text-center bg-gray-900 rounded-lg py-1 border border-gray-700">
                    <span className="text-xl font-bold font-mono text-primary-gold">{bpm}</span>
                    <span className="text-[10px] text-gray-500 block -mt-1">BPM</span>
                </div>
            </div>

            <input 
                type="range" 
                min="40" 
                max="200" 
                value={bpm}
                onChange={(e) => setBpm(Number(e.target.value))}
                className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-gold"
            />
        </div>
    );
};

export default Metronome;
