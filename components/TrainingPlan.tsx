
import React, { useState } from 'react';
import { TrainingPhase, LessonContent, ExerciseType } from '../types';
import { lessonDatabase } from '../data/trainingData';
import { AcademicIcon } from './Icons';

interface TrainingPlanProps {
    onStartLesson: (content: LessonContent) => void;
}

const trainingPhases: TrainingPhase[] = [
  {
    id: 1,
    title: "المرحلة 1: الأساسيات",
    duration: "4 أسابيع",
    description: "بناء أساس قوي للصوت، التحكم في التنفس، ومخارج الحروف الصحيحة.",
    weeks: [
      {
        week: 1,
        title: "اكتشاف الصوت",
        days: [
          { day: 1, id: 'p1-w1-d1', title: "تحليل الصوت الأولي", isCompleted: true, isLocked: false },
          { day: 2, id: 'p1-w1-d2', title: "تمارين التنفس الأساسية", isCompleted: true, isLocked: false },
          { day: 3, id: 'p1-w1-d3', title: "مخارج الحروف العربية", isCompleted: false, isLocked: false },
          { day: 4, id: 'p1-w1-d4', title: "التحكم في السرعة", isCompleted: false, isLocked: false },
          { day: 5, id: 'p1-w1-d5', title: "تمارين الإحماء اليومية", isCompleted: false, isLocked: true },
          { day: 6, id: 'p1-w1-d6', title: "تقييم منتصف الأسبوع", isCompleted: false, isLocked: true },
          { day: 7, id: 'p1-w1-d7', title: "مراجعة وتمارين ترفيهية", isCompleted: false, isLocked: true },
        ]
      },
      {
        week: 2,
        title: "بناء التقنية",
        days: [
          { day: 1, id: 'p1-w2-d1', title: "تمارين تقوية الحجاب الحاجز", isCompleted: false, isLocked: true },
          { day: 2, id: 'p1-w2-d2', title: "تحسين وضوح النطق", isCompleted: false, isLocked: true },
          { day: 3, id: 'p1-w2-d3', title: "التعامل مع اللهجات", isCompleted: false, isLocked: true },
          { day: 4, id: 'p1-w2-d4', title: "تمارين الصوت الطويل", isCompleted: false, isLocked: true },
        ]
      }
    ]
  },
  {
    id: 2,
    title: "المرحلة 2: التقنيات",
    duration: "6 أسابيع",
    description: "تعلم فنون الإلقاء المتقدمة، الوقفات، والتلوين الصوتي.",
    weeks: [
      {
        week: 1,
        title: "فنون الأداء الدرامي",
        days: [
          { day: 1, id: 'p2-w1-d1', title: "فن الوقفات الدرامية", isCompleted: false, isLocked: true },
          { day: 2, id: 'p2-w1-d2', title: "بناء التشويق الصوتي", isCompleted: false, isLocked: true },
          { day: 3, id: 'p2-w1-d3', title: "التعبير عن المشاعر", isCompleted: false, isLocked: true },
        ]
      },
      // ... more weeks
    ]
  },
  // ... more phases
];

const TrainingPlan: React.FC<TrainingPlanProps> = ({ onStartLesson }) => {
  const [expandedPhase, setExpandedPhase] = useState<number>(1);
  const [selectedLesson, setSelectedLesson] = useState<LessonContent | null>(null);

  const handleDayClick = (dayId: string, isLocked: boolean) => {
    if (isLocked) return;
    const content = lessonDatabase[dayId] || lessonDatabase['default'];
    // Merge title just in case
    const fullContent = { ...content, title: content.title === 'تمرين عام' ? lessonDatabase[dayId]?.title || content.title : content.title };
    setSelectedLesson(fullContent);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto pb-20 relative">
      
      {/* Lesson Modal/Overlay */}
      {selectedLesson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-secondary-gray w-full max-w-2xl rounded-3xl border border-primary-gold shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-black/20">
              <h3 className="text-2xl font-bold text-white">{selectedLesson.title}</h3>
              <button onClick={() => setSelectedLesson(null)} className="text-gray-400 hover:text-white bg-white/10 p-2 rounded-full">
                ✕
              </button>
            </div>
            
            <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
               {/* Content */}
               <div 
                 className="prose prose-invert prose-lg max-w-none mb-8 text-gray-200"
                 dangerouslySetInnerHTML={{ __html: selectedLesson.theory }} 
               />

               {/* Tips Box */}
               {selectedLesson.tips.length > 0 && (
                 <div className="bg-primary-gold/10 border-r-4 border-primary-gold p-4 rounded-lg mb-8">
                   <h4 className="font-bold text-primary-gold mb-2">💡 نصائح ذهبية:</h4>
                   <ul className="list-disc list-inside space-y-1 text-sm text-gray-300">
                     {selectedLesson.tips.map((tip, idx) => <li key={idx}>{tip}</li>)}
                   </ul>
                 </div>
               )}

               {/* Action Area */}
               <div className="mt-6 flex flex-col items-center gap-4 bg-black/40 p-6 rounded-2xl border border-gray-800">
                 <p className="text-gray-400 text-sm mb-2">نوع التمرين: <span className="text-white font-bold">{
                   selectedLesson.exerciseType === ExerciseType.Breathing ? 'تنفس 🫁' : 'تسجيل 🎙️'
                 }</span></p>
                 
                 {selectedLesson.exerciseType === ExerciseType.Reading && selectedLesson.practiceText && (
                   <div className="w-full bg-black p-4 rounded-lg text-center text-lg font-serif mb-4 text-white border border-gray-700">
                     "{selectedLesson.practiceText}"
                   </div>
                 )}

                 <button 
                   onClick={() => onStartLesson(selectedLesson)}
                   className="w-full bg-primary-gold hover:bg-yellow-500 text-black font-bold py-4 rounded-xl text-lg shadow-lg hover:shadow-primary-gold/20 transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2"
                 >
                   {selectedLesson.exerciseType === ExerciseType.Breathing ? '🫁' : '🎙️'} {selectedLesson.actionLabel}
                 </button>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="bg-primary-gold p-3 rounded-xl">
          <AcademicIcon className="w-8 h-8 text-black" />
        </div>
        <div>
           <h2 className="text-3xl font-bold text-secondary-white">الأكاديمية الصوتية</h2>
           <p className="text-gray-400">دروس تفاعلية لتطوير أدائك خطوة بخطوة</p>
        </div>
      </div>

      <div className="space-y-6">
        {trainingPhases.map((phase) => (
          <div 
            key={phase.id} 
            className={`rounded-3xl border transition-all duration-300 overflow-hidden ${
              expandedPhase === phase.id 
                ? 'bg-secondary-gray border-primary-gold shadow-lg shadow-primary-gold/5' 
                : 'bg-black/40 border-gray-800 hover:border-gray-600'
            }`}
          >
            {/* Phase Header */}
            <div 
              className="p-6 cursor-pointer flex justify-between items-center"
              onClick={() => setExpandedPhase(phase.id === expandedPhase ? 0 : phase.id)}
            >
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-primary-gold font-bold text-lg">{phase.title}</span>
                  <span className="bg-black/50 px-3 py-1 rounded-full text-xs text-gray-300">{phase.duration}</span>
                </div>
                <p className="text-gray-400">{phase.description}</p>
              </div>
              <div className={`transform transition-transform duration-300 ${expandedPhase === phase.id ? 'rotate-180' : ''}`}>
                <svg className="w-6 h-6 text-primary-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Weeks and Days */}
            {expandedPhase === phase.id && (
              <div className="p-6 pt-0 border-t border-gray-800/50">
                {phase.weeks.map((week) => (
                  <div key={week.week} className="mt-8">
                    <h4 className="text-white font-bold mb-4 flex items-center gap-2">
                      <span className="w-2 h-6 bg-primary-green rounded-full"></span>
                      {week.title} 
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {week.days.map((day, idx) => (
                        <div 
                          key={idx}
                          onClick={() => handleDayClick(day.id, day.isLocked)}
                          className={`p-4 rounded-xl border flex items-center justify-between transition-all duration-200 ${
                            day.isLocked 
                              ? 'bg-black/20 border-gray-800 text-gray-600 cursor-not-allowed' 
                              : 'bg-gradient-to-br from-secondary-gray to-black border-gray-700 hover:border-primary-gold cursor-pointer hover:shadow-lg hover:-translate-y-1'
                          } ${day.isCompleted ? 'border-primary-green/30' : ''}`}
                        >
                          <div className="flex items-center gap-3">
                             <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-inner ${
                               day.isLocked ? 'bg-gray-800' : day.isCompleted ? 'bg-primary-green text-white' : 'bg-primary-gold text-black'
                             }`}>
                               {day.day}
                             </div>
                             <div>
                               <span className={`block font-bold text-sm ${day.isLocked ? '' : 'text-white'}`}>{day.title}</span>
                               {!day.isLocked && <span className="text-xs text-primary-ice mt-1 block">اضغط للبدء</span>}
                             </div>
                          </div>
                          
                          {day.isCompleted && (
                            <div className="bg-primary-green/10 p-1 rounded-full">
                                <svg className="w-5 h-5 text-primary-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                          )}
                          {day.isLocked && (
                            <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TrainingPlan;
