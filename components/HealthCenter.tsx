
import React, { useState, useEffect } from 'react';
import { getCurrentUser, updateHealthStats } from '../services/storageService';
import { WaterIcon, HeartIcon } from './Icons';

const HealthCenter: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
    const [waterCount, setWaterCount] = useState(0);
    const [fatigueLevel, setFatigueLevel] = useState(0); // 0 (Unset) to 10
    const [advice, setAdvice] = useState<string>('');

    useEffect(() => {
        const user = getCurrentUser();
        if (user && user.healthStats) {
            setWaterCount(user.healthStats.waterIntake);
            setFatigueLevel(user.healthStats.fatigueLevel);
        }
    }, []);

    const addWater = () => {
        const newCount = waterCount + 1;
        setWaterCount(newCount);
        updateHealthStats({ waterIntake: newCount });
    };

    const handleFatigueChange = (level: number) => {
        setFatigueLevel(level);
        updateHealthStats({ fatigueLevel: level });
        
        // Generate immediate advice
        if (level <= 3) setAdvice("صوتك في حالة ممتازة! يمكنك ممارسة تمارين شاقة.");
        else if (level <= 6) setAdvice("إجهاد متوسط. ينصح بتمارين الإحماء الهادئة وتجنب الصراخ.");
        else setAdvice("تحذير: إجهاد عالي. يفضل الراحة الصوتية التامة (Vocal Rest) اليوم.");
    };

    const targetWater = 10; // 2.5 Liters approx

    return (
        <div className="flex flex-col items-center justify-center h-full p-6 animate-fade-in bg-gradient-to-br from-blue-900/20 to-primary-black">
            <div className="bg-secondary-gray p-8 rounded-3xl border border-gray-800 shadow-2xl max-w-2xl w-full text-center">
                <h2 className="text-3xl font-bold text-white mb-2 flex items-center justify-center gap-3">
                    <HeartIcon className="w-8 h-8 text-secondary-red" />
                    مركز صحة الصوت
                </h2>
                <p className="text-gray-400 mb-10">صوتك هو أثمن ما تملك. حافظ عليه.</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    {/* Hydration Section */}
                    <div className="bg-black/30 p-6 rounded-2xl border border-blue-900/50">
                        <h3 className="text-blue-400 font-bold text-xl mb-4 flex items-center justify-center gap-2">
                             <WaterIcon className="w-6 h-6" /> تتبع الترطيب
                        </h3>
                        
                        <div className="flex flex-wrap justify-center gap-2 mb-6">
                            {Array.from({ length: targetWater }).map((_, idx) => (
                                <div 
                                    key={idx}
                                    className={`w-8 h-10 rounded-b-lg border-2 transition-all duration-500 ${
                                        idx < waterCount 
                                        ? 'bg-blue-500 border-blue-400 shadow-[0_0_10px_blue]' 
                                        : 'bg-transparent border-gray-700 opacity-30'
                                    }`}
                                ></div>
                            ))}
                        </div>

                        <div className="text-4xl font-bold text-white mb-2">{waterCount} <span className="text-sm text-gray-500">/ {targetWater} كوب</span></div>
                        <p className="text-xs text-gray-400 mb-4">كوب واحد = 250 مل</p>

                        <button 
                            onClick={addWater}
                            className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-2 rounded-full transition-colors flex items-center gap-2 mx-auto"
                        >
                            <span className="text-xl">+</span> شربت كوباً
                        </button>
                    </div>

                    {/* Fatigue Section */}
                    <div className="bg-black/30 p-6 rounded-2xl border border-red-900/50">
                        <h3 className="text-secondary-red font-bold text-xl mb-4 flex items-center justify-center gap-2">
                             🩺 فحص الإجهاد
                        </h3>
                        <p className="text-sm text-gray-400 mb-4">كيف يشعر صوتك الآن؟ (1: مرتاح، 10: مجهد جداً)</p>
                        
                        <input 
                            type="range" 
                            min="1" 
                            max="10" 
                            value={fatigueLevel || 1}
                            onChange={(e) => handleFatigueChange(Number(e.target.value))}
                            className="w-full h-2 bg-gradient-to-r from-green-500 via-yellow-500 to-red-600 rounded-lg appearance-none cursor-pointer mb-4"
                        />
                        
                        <div className="flex justify-between text-xs text-gray-500 mb-6">
                            <span>ممتاز</span>
                            <span>متوسط</span>
                            <span>خطر</span>
                        </div>

                        {fatigueLevel > 0 && (
                            <div className={`p-3 rounded-xl border ${
                                fatigueLevel <= 3 ? 'bg-green-900/20 border-green-500 text-green-400' :
                                fatigueLevel <= 6 ? 'bg-yellow-900/20 border-yellow-500 text-yellow-500' :
                                'bg-red-900/20 border-red-500 text-red-500'
                            }`}>
                                {advice}
                            </div>
                        )}
                         
                         {fatigueLevel === 0 && <p className="text-gray-500 italic">حرك المؤشر للتقييم</p>}
                    </div>
                </div>

                <button 
                    onClick={onComplete}
                    className="mt-10 text-gray-400 hover:text-white underline"
                >
                    عودة للمكتبة
                </button>
            </div>
        </div>
    );
};

export default HealthCenter;
