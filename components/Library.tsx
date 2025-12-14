
import React, { useState, useEffect } from 'react';
import { VoiceStyle, Difficulty, Tip, TongueTwister, TipCategory } from '../types';
import { libraryTips, libraryTwisters } from '../data/trainingData';
import { generateCreativeScenario } from '../services/geminiService';
import { MagicIcon, LabIcon, FingerPrintIcon } from './Icons';

// Reusing styles data locally or importing if centralized
const styles: VoiceStyle[] = [
  {
    id: '1',
    name: 'النمط الوثائقي',
    characteristics: ["هادئ", "مثير", "غامض", "متعمق"],
    examples: ["ناشيونال جيوغرافيك", "الجزيرة الوثائقية"],
    difficulty: Difficulty.Advanced,
    icon: '🌍'
  },
  {
    id: '2',
    name: 'النمط الإعلاني',
    characteristics: ["حيوي", "مقنع", "واضح", "جذاب"],
    examples: ["إعلانات تلفزيونية", "راديو"],
    difficulty: Difficulty.Medium,
    icon: '📢'
  },
  {
    id: '3',
    name: 'النمط القصصي',
    characteristics: ["حميمي", "دافئ", "معبر", "شاعري"],
    examples: ["كتب صوتية", "قصص الأطفال"],
    difficulty: Difficulty.Beginner,
    icon: '📚'
  },
  {
    id: '4',
    name: 'الرد الآلي (IVR)',
    characteristics: ["رسمي", "واضح", "بطيء", "مبتسم"],
    examples: ["البنوك", "الشركات"],
    difficulty: Difficulty.Beginner,
    icon: '☎️'
  }
];

interface LibraryProps {
  onSelectStyle: (style: VoiceStyle) => void;
  onOpenTool: (tool: 'BREATHING' | 'WARMUP' | 'PITCH' | 'HEALTH' | 'LAB' | 'VOICE_TWIN') => void;
  onStartScenario: (scenario: {title: string, script: string, character: string}) => void;
  initialTab?: 'STYLES' | 'TWISTERS' | 'TIPS' | 'TOOLS' | 'SCENARIOS';
}

const Library: React.FC<LibraryProps> = ({ onSelectStyle, onOpenTool, onStartScenario, initialTab }) => {
  const [activeTab, setActiveTab] = useState<'STYLES' | 'TWISTERS' | 'TIPS' | 'TOOLS' | 'SCENARIOS'>('STYLES');
  const [selectedCategory, setSelectedCategory] = useState<TipCategory | 'ALL'>('ALL');
  const [isGeneratingScenario, setIsGeneratingScenario] = useState(false);

  useEffect(() => {
    if (initialTab) {
        setActiveTab(initialTab);
    }
  }, [initialTab]);

  const handleGenerateScenario = async () => {
      setIsGeneratingScenario(true);
      const scenario = await generateCreativeScenario();
      setIsGeneratingScenario(false);
      onStartScenario(scenario);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto pb-20">
      {/* Header */}
      <div className="mb-8 border-r-4 border-primary-gold pr-4">
        <h2 className="text-3xl font-bold text-secondary-white">مركز المصادر والتدريب</h2>
        <p className="text-gray-400">كل ما تحتاجه لتطوير صوتك في مكان واحد</p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-4 mb-8 border-b border-gray-800 pb-4">
        {[
            { id: 'STYLES', label: 'الأنماط الصوتية' },
            { id: 'SCENARIOS', label: 'سيناريوهات ذكية' }, 
            { id: 'TWISTERS', label: 'مخارج الحروف' },
            { id: 'TIPS', label: 'مكتبة النصائح' },
            { id: 'TOOLS', label: 'الأدوات' }
        ].map(tab => (
            <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-6 py-2 rounded-full font-bold transition-all ${
                    activeTab === tab.id 
                    ? 'bg-primary-gold text-black' 
                    : 'bg-black/40 text-gray-400 hover:text-white'
                }`}
            >
                {tab.label}
            </button>
        ))}
      </div>

      {/* Content */}
      <div className="animate-fade-in">
        
        {/* 1. STYLES TAB */}
        {activeTab === 'STYLES' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {styles.map((style) => (
              <div 
                key={style.id} 
                className="group bg-secondary-gray p-6 rounded-2xl border border-gray-800 hover:border-primary-gold transition-all duration-300 cursor-pointer relative overflow-hidden"
                onClick={() => onSelectStyle(style)}
              >
                <div className="absolute top-0 left-0 w-2 h-full bg-primary-gold transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300"></div>
                <div className="flex justify-between items-start mb-4">
                  <span className="text-4xl">{style.icon}</span>
                  <span className={`text-xs px-3 py-1 rounded-full ${
                    style.difficulty === Difficulty.Advanced ? 'bg-secondary-red text-white' :
                    style.difficulty === Difficulty.Medium ? 'bg-primary-gold text-black' :
                    'bg-primary-green text-white'
                  }`}>
                    {style.difficulty}
                  </span>
                </div>
                <h3 className="text-xl font-bold mb-2 text-secondary-white group-hover:text-primary-gold transition-colors">{style.name}</h3>
                <div className="flex flex-wrap gap-2 mb-4">
                  {style.characteristics.map((char, idx) => (
                    <span key={idx} className="text-xs text-gray-400 bg-black/30 px-2 py-1 rounded">{char}</span>
                  ))}
                </div>
                <div className="mt-6 flex justify-end">
                   <span className="text-primary-ice text-sm group-hover:underline">ابدأ التدريب &larr;</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 2. SCENARIOS TAB */}
        {activeTab === 'SCENARIOS' && (
            <div className="flex flex-col items-center justify-center p-10 bg-gradient-to-br from-indigo-900/30 to-secondary-gray rounded-3xl border border-indigo-500/30">
                <MagicIcon className="w-16 h-16 text-indigo-400 mb-6" />
                <h2 className="text-3xl font-bold text-white mb-2">مولد السيناريوهات اللانهائي</h2>
                <p className="text-gray-400 text-center max-w-lg mb-8">
                    هل مللت من النصوص التقليدية؟ دع الذكاء الاصطناعي يضعك في مواقف تمثيلية غريبة وغير متوقعة لاختبار قدراتك التمثيلية.
                </p>
                <button 
                    onClick={handleGenerateScenario}
                    disabled={isGeneratingScenario}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-10 py-4 rounded-xl text-lg shadow-xl shadow-indigo-900/20 transition-all transform hover:-translate-y-1 flex items-center gap-3"
                >
                    {isGeneratingScenario ? 'جاري التأليف...' : '✨ فاجئني بسيناريو جديد'}
                </button>
            </div>
        )}

        {/* 3. TWISTERS TAB */}
        {activeTab === 'TWISTERS' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2 bg-primary-ice/10 p-6 rounded-2xl border border-primary-ice/30 mb-4">
                    <h3 className="font-bold text-primary-ice text-xl mb-2">🧠 تمارين اللسان (Tongue Twisters)</h3>
                    <p className="text-gray-300">كرر هذه الجمل بسرعة وتتابع لتحسين مرونة اللسان ووضوح مخارج الحروف الصعبة.</p>
                </div>
                {libraryTwisters.map((twister) => (
                    <div key={twister.id} className="bg-secondary-gray p-6 rounded-2xl border border-gray-800 hover:bg-white/5 transition-colors">
                        <div className="flex justify-between items-center mb-4">
                            <span className="w-10 h-10 rounded-full bg-black flex items-center justify-center font-bold text-primary-gold text-xl border border-gray-700">
                                {twister.letter}
                            </span>
                            <span className="text-xs text-gray-500">{twister.difficulty}</span>
                        </div>
                        <p className="text-lg font-bold text-white leading-relaxed text-center mb-4">"{twister.text}"</p>
                        <button className="w-full py-2 bg-black/30 text-gray-400 hover:text-white rounded-lg text-sm transition-colors">
                            نسخ النص
                        </button>
                    </div>
                ))}
            </div>
        )}

        {/* 4. TIPS TAB */}
        {activeTab === 'TIPS' && (
            <div>
                 <div className="flex gap-2 mb-6 overflow-x-auto pb-2 custom-scrollbar">
                    <button onClick={() => setSelectedCategory('ALL')} className={`px-4 py-1 rounded-full text-sm whitespace-nowrap ${selectedCategory === 'ALL' ? 'bg-white text-black' : 'bg-black/30 text-gray-400'}`}>الكل</button>
                    <button onClick={() => setSelectedCategory('HEALTH')} className={`px-4 py-1 rounded-full text-sm whitespace-nowrap ${selectedCategory === 'HEALTH' ? 'bg-primary-green text-white' : 'bg-black/30 text-gray-400'}`}>صحة الصوت</button>
                    <button onClick={() => setSelectedCategory('PERFORMANCE')} className={`px-4 py-1 rounded-full text-sm whitespace-nowrap ${selectedCategory === 'PERFORMANCE' ? 'bg-primary-gold text-black' : 'bg-black/30 text-gray-400'}`}>الأداء</button>
                    <button onClick={() => setSelectedCategory('TECHNIQUE')} className={`px-4 py-1 rounded-full text-sm whitespace-nowrap ${selectedCategory === 'TECHNIQUE' ? 'bg-primary-ice text-black' : 'bg-black/30 text-gray-400'}`}>التقنية</button>
                    <button onClick={() => setSelectedCategory('ENGINEERING')} className={`px-4 py-1 rounded-full text-sm whitespace-nowrap ${selectedCategory === 'ENGINEERING' ? 'bg-gray-500 text-white' : 'bg-black/30 text-gray-400'}`}>الهندسة</button>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {libraryTips
                        .filter(t => selectedCategory === 'ALL' || t.category === selectedCategory)
                        .map(tip => (
                        <div key={tip.id} className="bg-secondary-gray p-6 rounded-2xl border border-gray-800">
                             <div className="flex items-center justify-between mb-3">
                                 <h4 className="font-bold text-white text-lg">{tip.title}</h4>
                                 <span className={`w-3 h-3 rounded-full ${
                                     tip.category === 'HEALTH' ? 'bg-primary-green' :
                                     tip.category === 'PERFORMANCE' ? 'bg-primary-gold' :
                                     tip.category === 'TECHNIQUE' ? 'bg-primary-ice' : 'bg-gray-500'
                                 }`}></span>
                             </div>
                             <p className="text-gray-400 text-sm leading-relaxed">{tip.content}</p>
                        </div>
                    ))}
                 </div>
            </div>
        )}

        {/* 5. TOOLS TAB */}
        {activeTab === 'TOOLS' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {/* Voice Twin Card (NEW) */}
                 <div 
                    onClick={() => onOpenTool('VOICE_TWIN')}
                    className="md:col-span-2 bg-gradient-to-r from-purple-900/40 to-secondary-gray p-8 rounded-3xl border border-purple-500/40 cursor-pointer hover:scale-[1.01] transition-transform group relative overflow-hidden"
                >
                     <div className="absolute right-0 top-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl"></div>
                    <div className="flex items-center gap-4 mb-4 relative z-10">
                        <div className="bg-purple-600 p-2 rounded-xl"><FingerPrintIcon className="w-8 h-8 text-white"/></div>
                        <div>
                             <h3 className="text-2xl font-bold text-white">Voice Twin (استنساخ النمط)</h3>
                             <p className="text-gray-400 text-sm">ميزة ذكاء اصطناعي</p>
                        </div>
                    </div>
                    <p className="text-gray-300 mb-6 relative z-10">
                        قم برفع مقطع صوتي لمدرب أو معلق محترف، وسيقوم الذكاء الاصطناعي بتحليل بصمته الصوتية وإعطائك تعليمات دقيقة لتقليده.
                    </p>
                    <span className="bg-purple-600 text-white px-6 py-2 rounded-lg font-bold group-hover:bg-purple-500 transition-colors relative z-10">
                        تحليل الصوت
                    </span>
                </div>

                 {/* Audio Lab Card */}
                 <div 
                    onClick={() => onOpenTool('LAB')}
                    className="md:col-span-2 bg-gradient-to-r from-indigo-900/40 to-secondary-gray p-8 rounded-3xl border border-indigo-500/40 cursor-pointer hover:scale-[1.01] transition-transform group relative overflow-hidden"
                >
                     <div className="absolute right-0 top-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl"></div>
                    <div className="flex items-center gap-4 mb-4 relative z-10">
                        <div className="bg-indigo-600 p-2 rounded-xl"><LabIcon className="w-8 h-8 text-white"/></div>
                        <div>
                             <h3 className="text-2xl font-bold text-white">مختبر الجودة والمكساج</h3>
                             <p className="text-gray-400 text-sm">للأعمال المكتملة</p>
                        </div>
                    </div>
                    <p className="text-gray-300 mb-6 relative z-10">
                        ارفع أعمالك النهائية (صوت + موسيقى) لفحص الجودة (LUFS, Clipping) وضبط المكساج تلقائياً للمعايير العالمية.
                    </p>
                    <span className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold group-hover:bg-indigo-500 transition-colors relative z-10">
                        دخول المختبر
                    </span>
                </div>

                <div 
                    onClick={() => onOpenTool('BREATHING')}
                    className="bg-gradient-to-br from-primary-green/20 to-secondary-gray p-8 rounded-3xl border border-primary-green/30 cursor-pointer hover:scale-[1.02] transition-transform group"
                >
                    <div className="flex items-center gap-4 mb-4">
                        <span className="text-4xl">🫁</span>
                        <h3 className="text-2xl font-bold text-white">مدرب التنفس</h3>
                    </div>
                    <p className="text-gray-300 mb-6">أداة تفاعلية لتمارين التنفس (4-7-8) لزيادة سعة الرئة والتحكم في النفس.</p>
                    <span className="bg-primary-green text-black px-6 py-2 rounded-lg font-bold group-hover:bg-green-400 transition-colors">
                        افتح الأداة
                    </span>
                </div>

                <div 
                    onClick={() => onOpenTool('WARMUP')}
                    className="bg-gradient-to-br from-primary-gold/20 to-secondary-gray p-8 rounded-3xl border border-primary-gold/30 cursor-pointer hover:scale-[1.02] transition-transform group"
                >
                    <div className="flex items-center gap-4 mb-4">
                        <span className="text-4xl">🧘</span>
                        <h3 className="text-2xl font-bold text-white">الإحماء الصوتي</h3>
                    </div>
                    <p className="text-gray-300 mb-6">روتين إحماء مدته 3 دقائق لتجهيز الحبال الصوتية قبل التسجيل.</p>
                    <span className="bg-primary-gold text-black px-6 py-2 rounded-lg font-bold group-hover:bg-yellow-500 transition-colors">
                        ادخل الغرفة
                    </span>
                </div>

                <div 
                    onClick={() => onOpenTool('PITCH')}
                    className="bg-gradient-to-br from-purple-500/20 to-secondary-gray p-8 rounded-3xl border border-purple-500/30 cursor-pointer hover:scale-[1.02] transition-transform group"
                >
                    <div className="flex items-center gap-4 mb-4">
                        <span className="text-4xl">👂</span>
                        <h3 className="text-2xl font-bold text-white">الأذن الموسيقية</h3>
                    </div>
                    <p className="text-gray-300 mb-6">لعبة تدريبية لمطابقة النغمات وتحسين دقة طبقة الصوت لديك.</p>
                    <span className="bg-purple-500 text-white px-6 py-2 rounded-lg font-bold group-hover:bg-purple-600 transition-colors">
                        ابدأ اللعب
                    </span>
                </div>

                <div 
                    onClick={() => onOpenTool('HEALTH')}
                    className="bg-gradient-to-br from-blue-500/20 to-secondary-gray p-8 rounded-3xl border border-blue-500/30 cursor-pointer hover:scale-[1.02] transition-transform group"
                >
                    <div className="flex items-center gap-4 mb-4">
                        <span className="text-4xl">🩺</span>
                        <h3 className="text-2xl font-bold text-white">صحة الصوت</h3>
                    </div>
                    <p className="text-gray-300 mb-6">تتبع شرب الماء ومراقبة إجهاد الأحبال الصوتية يومياً.</p>
                    <span className="bg-blue-500 text-white px-6 py-2 rounded-lg font-bold group-hover:bg-blue-600 transition-colors">
                        الفحص اليومي
                    </span>
                </div>
            </div>
        )}

      </div>
    </div>
  );
};

export default Library;