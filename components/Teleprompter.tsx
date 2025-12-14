
import React from 'react';
import { SmartScriptItem } from '../types';

interface TeleprompterProps {
    scriptData?: SmartScriptItem[] | null;
    simpleHtml?: string | null;
}

const Teleprompter: React.FC<TeleprompterProps> = ({ scriptData, simpleHtml }) => {
    
    if (scriptData) {
        return (
            <div className="teleprompter-content w-full h-full overflow-y-auto custom-scrollbar p-6">
                <div className="space-y-6 max-w-3xl mx-auto">
                    {scriptData.map((item, idx) => (
                        <div key={idx} className="relative group transition-all duration-300 hover:bg-white/5 p-4 rounded-xl border border-transparent hover:border-gray-700">
                            {/* Meta Tags */}
                            <div className="flex gap-2 mb-2 opacity-50 group-hover:opacity-100 transition-opacity">
                                <span className={`text-[10px] px-2 py-0.5 rounded border ${
                                    item.difficulty === 'Hard' ? 'border-red-500 text-red-500' : 
                                    item.difficulty === 'Medium' ? 'border-yellow-500 text-yellow-500' : 
                                    'border-green-500 text-green-500'
                                }`}>
                                    {item.difficulty === 'Hard' ? 'صعب' : item.difficulty === 'Medium' ? 'متوسط' : 'سهل'}
                                </span>
                                <span className="text-[10px] px-2 py-0.5 rounded border border-gray-600 text-gray-400">
                                    ⏱️ {item.timing_seconds}ث
                                </span>
                                {item.performance_tags.map(tag => (
                                    <span key={tag} className="text-[10px] px-2 py-0.5 rounded bg-primary-gold/20 text-primary-gold">
                                        {tag}
                                    </span>
                                ))}
                            </div>

                            {/* Sentence */}
                            <p 
                                className="text-2xl md:text-3xl font-serif leading-relaxed"
                                style={{ color: item.highlight_color || '#E0E0E0' }}
                            >
                                {item.sentence}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // Fallback for simple HTML script
    return (
        <div className="teleprompter-content w-full h-full overflow-y-auto custom-scrollbar p-6 text-center">
             <div 
                className="text-2xl md:text-3xl leading-relaxed font-serif text-gray-200"
                dangerouslySetInnerHTML={{ 
                    __html: (simpleHtml || "")
                        .replace(/<b>/g, '<b class="text-primary-gold font-extrabold mx-1">')
                        .replace(/\//g, '<span class="text-gray-500 mx-1 font-mono">/</span>')
                        .replace(/\[(.*?)\]/g, '<span class="text-primary-ice text-sm align-super mx-1">[$1]</span>')
                }}
             />
        </div>
    );
};

export default Teleprompter;
