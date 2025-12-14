
import React, { useState, useEffect } from 'react';
import { PlayIcon, StopIcon } from './Icons';

interface WarmupProps {
  onComplete: () => void;
}

type Stage = 'INTRO' | 'RELAX' | 'HUMMING' | 'TRILLS' | 'DONE';

const stages = {
    INTRO: { duration: 0, title: "غرفة الإحماء الصوتي", desc: "قبل الدخول للاستوديو، يجب تجهيز الأداة (صوتك)." },
    RELAX: { duration: 30, title: "1. الاسترخاء الجسدي", desc: "حرك رقبتك بلطف بشكل دائري، وهز أكتافك لإزالة التوتر." },
    HUMMING: { duration: 60, title: "2. الهمهمة (Humming)", desc: "أصدر صوتاً خفيفاً (Mmmmm) من الأنف لتسخين الحبال الصوتية." },
    TRILLS: { duration: 60, title: "3. تمارين الشفاه (Lip Trills)", desc: "انفخ الهواء عبر شفتيك المغلقتين لإصداث اهتزاز (Brrrr)." },
    DONE: { duration: 0, title: "أنت جاهز!", desc: "صوتك الآن دافئ وجاهز للتسجيل الاحترافي." }
};

const Warmup: React.FC<WarmupProps> = ({ onComplete }) => {
  const [currentStage, setCurrentStage] = useState<Stage>('INTRO');
  const [timer, setTimer] = useState(0);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    let interval: number;
    if (isActive && timer > 0) {
      interval = window.setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (isActive && timer === 0) {
        // Next Stage logic
        switch(currentStage) {
            case 'RELAX': startStage('HUMMING'); break;
            case 'HUMMING': startStage('TRILLS'); break;
            case 'TRILLS': setCurrentStage('DONE'); setIsActive(false); break;
        }
    }
    return () => clearInterval(interval);
  }, [isActive, timer, currentStage]);

  const startStage = (stage: Stage) => {
      setCurrentStage(stage);
      setTimer(stages[stage].duration);
      setIsActive(true);
  };

  const skipTimer = () => setTimer(0);

  return (
    <div className="flex flex-col items-center justify-center h-full p-6 animate-fade-in bg-gradient-to-b from-primary-black to-gray-900">
        
        {/* Stage Progress Dots */}
        <div className="flex gap-4 mb-10">
            {['RELAX', 'HUMMING', 'TRILLS'].map((s, idx) => (
                <div key={s} className={`w-3 h-3 rounded-full transition-all ${
                    currentStage === s ? 'bg-primary-gold scale-125' : 
                    (Object.keys(stages).indexOf(currentStage) > idx + 1) ? 'bg-primary-green' : 'bg-gray-700'
                }`}></div>
            ))}
        </div>

        <div className="bg-secondary-gray p-10 rounded-3xl border border-gray-800 shadow-2xl max-w-lg w-full text-center relative overflow-hidden">
             
             {/* Dynamic Background Circle */}
             <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary-gold/5 rounded-full blur-3xl transition-all duration-1000 ${isActive ? 'scale-150 opacity-20' : 'scale-100 opacity-0'}`}></div>

             <div className="relative z-10">
                <span className="text-6xl mb-6 block animate-bounce-slow">
                    {currentStage === 'INTRO' && '🧘'}
                    {currentStage === 'RELAX' && '💆'}
                    {currentStage === 'HUMMING' && '🐝'}
                    {currentStage === 'TRILLS' && '🎺'}
                    {currentStage === 'DONE' && '🔥'}
                </span>

                <h2 className="text-3xl font-bold text-white mb-4">{stages[currentStage].title}</h2>
                <p className="text-gray-400 mb-8 leading-relaxed">{stages[currentStage].desc}</p>

                {currentStage === 'INTRO' && (
                    <button 
                        onClick={() => startStage('RELAX')}
                        className="bg-primary-gold hover:bg-yellow-500 text-black font-bold px-8 py-3 rounded-xl transition-all shadow-lg hover:shadow-primary-gold/20 flex items-center justify-center gap-2 mx-auto"
                    >
                        <PlayIcon className="w-5 h-5" /> ابدأ الإحماء
                    </button>
                )}

                {(currentStage === 'RELAX' || currentStage === 'HUMMING' || currentStage === 'TRILLS') && (
                    <div className="flex flex-col items-center gap-4">
                        <div className="text-5xl font-mono font-bold text-primary-ice tabular-nums">
                            {timer} <span className="text-sm text-gray-500">ثانية</span>
                        </div>
                        <div className="flex gap-4">
                            <button 
                                onClick={() => setIsActive(!isActive)}
                                className="bg-gray-700 hover:bg-gray-600 text-white p-3 rounded-full transition-colors"
                            >
                                {isActive ? <StopIcon className="w-6 h-6"/> : <PlayIcon className="w-6 h-6"/>}
                            </button>
                            <button 
                                onClick={skipTimer}
                                className="text-gray-500 hover:text-white text-sm underline"
                            >
                                تخطي
                            </button>
                        </div>
                    </div>
                )}

                {currentStage === 'DONE' && (
                    <div className="animate-fade-in">
                        <p className="text-primary-green font-bold mb-6">أحسنت! أنت الآن في قمة جاهزيتك.</p>
                        <button 
                            onClick={onComplete}
                            className="bg-primary-green hover:bg-green-600 text-white font-bold px-8 py-3 rounded-xl transition-all shadow-lg hover:shadow-primary-green/20"
                        >
                            انتقل للاستوديو
                        </button>
                    </div>
                )}
             </div>
        </div>
    </div>
  );
};

export default Warmup;
