
import React, { useState, useEffect, useRef } from 'react';
import { autoCorrelate } from '../utils/audioAnalyzer';
import { PlayIcon, MicIcon } from './Icons';

// Simple notes in C major scale
const NOTES = [
    { name: 'C3', freq: 130.81 },
    { name: 'D3', freq: 146.83 },
    { name: 'E3', freq: 164.81 },
    { name: 'F3', freq: 174.61 },
    { name: 'G3', freq: 196.00 },
    { name: 'A3', freq: 220.00 },
    { name: 'B3', freq: 246.94 },
    { name: 'C4', freq: 261.63 },
];

const PitchMatcher: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
    const [gameState, setGameState] = useState<'START' | 'LISTEN' | 'SING' | 'RESULT'>('START');
    const [targetNote, setTargetNote] = useState(NOTES[0]);
    const [userPitch, setUserPitch] = useState(0);
    const [score, setScore] = useState(0); // Difference in Hz (lower is better)
    const [feedback, setFeedback] = useState("");
    const [micError, setMicError] = useState(false);
    
    const audioCtxRef = useRef<AudioContext | null>(null);
    const animationRef = useRef<number>(0);
    const streamRef = useRef<MediaStream | null>(null);

    useEffect(() => {
        return () => {
            if (audioCtxRef.current) audioCtxRef.current.close();
            if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
            cancelAnimationFrame(animationRef.current);
        };
    }, []);

    const playTone = () => {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioCtxRef.current = ctx;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        // Pick random note
        const note = NOTES[Math.floor(Math.random() * NOTES.length)];
        setTargetNote(note);

        osc.frequency.value = note.freq;
        osc.type = 'sine';
        
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2);

        osc.start();
        osc.stop(ctx.currentTime + 2);

        setGameState('LISTEN');
        setTimeout(() => setGameState('SING'), 2000);
    };

    const startListening = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;
            
            if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
            const source = audioCtxRef.current.createMediaStreamSource(stream);
            const analyser = audioCtxRef.current.createAnalyser();
            analyser.fftSize = 2048;
            source.connect(analyser);

            const buffer = new Float32Array(analyser.fftSize);

            const detect = () => {
                analyser.getFloatTimeDomainData(buffer);
                const pitch = autoCorrelate(buffer, audioCtxRef.current!.sampleRate);
                
                if (pitch > 0) {
                    setUserPitch(pitch);
                    
                    // Check if steady match for a few frames? simplified for now
                    const diff = Math.abs(pitch - targetNote.freq);
                    
                    if (diff < 5) {
                        setScore(100);
                        setFeedback("ممتاز! تطابق تام 🎯");
                        setGameState('RESULT');
                        return;
                    }
                }
                
                // Timeout after 5 seconds if no match
                // We'll just let the user stop manually or improve visually for now
                animationRef.current = requestAnimationFrame(detect);
            };
            
            detect();

        } catch (e) {
            setMicError(true);
            console.error(e);
        }
    };

    useEffect(() => {
        if (gameState === 'SING') {
            startListening();
        } else {
            cancelAnimationFrame(animationRef.current);
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(t => t.stop());
                streamRef.current = null;
            }
        }
    }, [gameState]);

    // Gauge calculation
    const diff = userPitch > 0 ? userPitch - targetNote.freq : 0;
    // Map diff -50Hz to +50Hz to percentage 0-100
    const needlePos = Math.min(100, Math.max(0, 50 + diff)); 

    return (
        <div className="flex flex-col items-center justify-center h-full p-6 animate-fade-in bg-gradient-to-br from-gray-900 to-black">
             <div className="bg-secondary-gray p-8 rounded-3xl border border-gray-800 shadow-2xl max-w-lg w-full text-center relative">
                <div className="mb-6">
                    <span className="text-6xl">👂</span>
                    <h2 className="text-3xl font-bold text-white mt-4">مدرب الأذن الموسيقية</h2>
                    <p className="text-gray-400">استمع للنغمة وحاول محاكاتها بصوتك</p>
                </div>

                {gameState === 'START' && (
                    <button 
                        onClick={playTone}
                        className="bg-primary-gold hover:bg-yellow-500 text-black font-bold px-8 py-4 rounded-xl text-lg flex items-center justify-center gap-2 mx-auto"
                    >
                        <PlayIcon className="w-6 h-6"/> استمع للنغمة
                    </button>
                )}

                {gameState === 'LISTEN' && (
                    <div className="text-primary-ice text-2xl animate-pulse font-bold">
                        استمع جيداً... 🔊
                    </div>
                )}

                {gameState === 'SING' && (
                    <div className="flex flex-col items-center gap-6">
                        <div className="text-2xl font-bold text-primary-gold flex items-center gap-2">
                             <MicIcon className="w-6 h-6 animate-pulse"/> غنِّ الآن!
                        </div>
                        
                        {/* Tuner Gauge */}
                        <div className="w-full h-8 bg-gray-800 rounded-full relative overflow-hidden border border-gray-600">
                            {/* Center Marker */}
                            <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-primary-green z-10 transform -translate-x-1/2"></div>
                            
                            {/* Needle */}
                            <div 
                                className="absolute top-0 bottom-0 w-2 bg-white rounded-full transition-all duration-100 shadow-[0_0_10px_white]"
                                style={{ left: `${needlePos}%`, opacity: userPitch > 0 ? 1 : 0 }}
                            ></div>
                        </div>

                        <div className="flex justify-between w-full text-xs text-gray-500 px-2">
                             <span>Flat (منخفض)</span>
                             <span>Perfect</span>
                             <span>Sharp (حاد)</span>
                        </div>

                        <div className="text-4xl font-mono font-bold text-white">
                            {userPitch > 0 ? Math.round(userPitch) : '--'} <span className="text-sm">Hz</span>
                        </div>
                        
                        <div className="text-sm text-gray-400">
                            الهدف: <span className="text-primary-gold font-bold">{targetNote.name} ({targetNote.freq} Hz)</span>
                        </div>

                        {micError && <p className="text-red-500 text-sm">تعذر الوصول للمايكروفون</p>}

                        <button 
                            onClick={() => setGameState('RESULT')}
                            className="text-gray-400 hover:text-white mt-4"
                        >
                            تخطي / إنهاء
                        </button>
                    </div>
                )}

                {gameState === 'RESULT' && (
                    <div>
                        <div className="text-4xl mb-4">{score === 100 ? '🎉' : '😐'}</div>
                        <h3 className="text-2xl font-bold text-white mb-2">
                            {score === 100 ? 'نغمة مثالية!' : 'حاول مرة أخرى'}
                        </h3>
                        <p className="text-primary-gold mb-8">{feedback || "استمر في التدريب لتحسين أذنك الموسيقية"}</p>
                        <div className="flex gap-4 justify-center">
                            <button 
                                onClick={playTone}
                                className="bg-primary-gold text-black px-6 py-2 rounded-lg font-bold"
                            >
                                نغمة جديدة
                            </button>
                            <button 
                                onClick={onComplete}
                                className="bg-gray-700 text-white px-6 py-2 rounded-lg"
                            >
                                خروج
                            </button>
                        </div>
                    </div>
                )}
             </div>
        </div>
    );
};

export default PitchMatcher;
