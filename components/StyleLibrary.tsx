import React from 'react';
import { VoiceStyle, Difficulty } from '../types';

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

interface StyleLibraryProps {
  onSelectStyle: (style: VoiceStyle) => void;
}

const StyleLibrary: React.FC<StyleLibraryProps> = ({ onSelectStyle }) => {
  return (
    <div className="p-6">
      <h2 className="text-3xl font-bold mb-8 text-secondary-white border-r-4 border-primary-gold pr-4">مكتبة الأنماط الصوتية</h2>
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
                <span key={idx} className="text-xs text-gray-400 bg-black/30 px-2 py-1 rounded">
                  {char}
                </span>
              ))}
            </div>

            <div className="text-sm text-gray-500 mt-4">
              <p className="mb-1">أمثلة:</p>
              <ul className="list-disc list-inside">
                {style.examples.map((ex, idx) => (
                  <li key={idx}>{ex}</li>
                ))}
              </ul>
            </div>
            
            <div className="mt-6 flex justify-end">
               <span className="text-primary-ice text-sm group-hover:underline">ابدأ التدريب &larr;</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StyleLibrary;