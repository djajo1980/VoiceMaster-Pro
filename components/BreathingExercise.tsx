
import React, { useState, useEffect } from 'react';
import { StopIcon, PlayIcon } from './Icons';

interface BreathingExerciseProps {
  onComplete: () => void;
}

const BreathingExercise: React.FC<BreathingExerciseProps> = ({ onComplete }) => {
  const [isActive, setIsActive] = useState(false);
  const [phase, setPhase] = useState<'IDLE' | 'INHALE' | 'HOLD' | 'EXHALE'>('IDLE');
  const [counter, setCounter] = useState(0);
  const [cycles, setCycles] = useState(0);
  const targetCycles = 4; // Number of rounds

  useEffect(() => {
    let interval: number;

    if (isActive) {
      if (phase === 'IDLE') {
        setPhase('INHALE');
        setCounter(4);
      }

      interval = window.setInterval(() => {
        setCounter((prev) => {
          if (prev > 1) return prev - 1;
          
          // Phase transition logic
          switch (phase) {
            case 'INHALE':
              setPhase('HOLD');
              return 7;
            case 'HOLD':
              setPhase('EXHALE');
              return 8;
            case 'EXHALE':
              if (cycles + 1 >= targetCycles) {
                setIsActive(false);
                setPhase('IDLE');
                onComplete();
                return 0;
              }
              setCycles(c => c + 1);
              setPhase('INHALE');
              return 4;
            default:
              return 0;
          }
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isActive, phase, cycles, onComplete]);

  const toggleExercise = () => {
    setIsActive(!isActive);
    if (!isActive) {
      setCycles(0);
      setPhase('IDLE');
    }
  };

  const getInstructions = () => {
    switch (phase) {
      case 'INHALE': return "استنشق بعمق من الأنف... 😤";
      case 'HOLD': return "احبس الهواء... 😶";
      case 'EXHALE': return "ازفر ببطء من الفم... 🌬️";
      default: return "اضغط ابدأ لتمرين 4-7-8";
    }
  };

  const getCircleStyle = () => {
    const base = "w-64 h-64 rounded-full flex items-center justify-center transition-all duration-[1000ms] border-4 shadow-[0_0_50px_rgba(0,0,0,0.5)]";
    switch (phase) {
      case 'INHALE': return `${base} bg-primary-green/20 border-primary-green scale-110 shadow-primary-green/30`;
      case 'HOLD': return `${base} bg-primary-gold/20 border-primary-gold scale-110 shadow-primary-gold/30`;
      case 'EXHALE': return `${base} bg-primary-ice/20 border-primary-ice scale-75 shadow-primary-ice/30`;
      default: return `${base} bg-gray-800 border-gray-600 scale-90`;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full p-6 animate-fade-in">
      <h2 className="text-3xl font-bold text-white mb-2">مدرب التنفس (4-7-8)</h2>
      <p className="text-gray-400 mb-10 text-center max-w-md">
        تقنية فعالة لزيادة سعة الرئة والتحكم في النفس الطويل.
        <br/> الدورة الحالية: {cycles} / {targetCycles}
      </p>

      <div className="relative mb-12">
        <div className={getCircleStyle()}>
          <div className="text-center">
            <span className="text-6xl font-bold text-white block mb-2">
              {isActive ? counter : "4-7-8"}
            </span>
            <span className="text-sm font-bold uppercase tracking-widest text-gray-300">
              {phase === 'IDLE' ? 'جاهز' : phase}
            </span>
          </div>
        </div>
      </div>

      <div className="text-2xl font-bold text-primary-gold mb-10 h-10">
        {getInstructions()}
      </div>

      <button
        onClick={toggleExercise}
        className={`px-10 py-4 rounded-full font-bold text-xl flex items-center gap-3 transition-all transform hover:scale-105 ${
          isActive 
          ? 'bg-red-500/20 text-red-500 border border-red-500' 
          : 'bg-primary-green text-black hover:bg-green-400'
        }`}
      >
        {isActive ? (
          <>
            <StopIcon className="w-6 h-6" /> إيقاف التمرين
          </>
        ) : (
          <>
            <PlayIcon className="w-6 h-6" /> ابدأ الآن
          </>
        )}
      </button>
    </div>
  );
};

export default BreathingExercise;
