
import React, { useEffect, useState } from 'react';
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip
} from 'recharts';
import { User, DailyChallenge, VoiceStyle } from '../types';
import { getCurrentUser, getUserStats } from '../services/storageService';
import { tipsDatabase } from '../data/trainingData';
import { generateRemedialScript } from '../services/geminiService';
import { MagicIcon } from './Icons';

interface DashboardProps {
  onStartChallenge: (challenge: DailyChallenge) => void;
  onOpenTool: (tool: 'BREATHING' | 'TWISTERS') => void;
  onStartRemedial: (script: string, focusArea: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onStartChallenge, onOpenTool, onStartRemedial }) => {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [dailyTip, setDailyTip] = useState('');
  const [weakness, setWeakness] = useState<{area: string, score: number} | null>(null);
  const [isGeneratingRemedial, setIsGeneratingRemedial] = useState(false);

  useEffect(() => {
    const currentUser = getCurrentUser();
    const currentStats = getUserStats();
    setUser(currentUser);
    setStats(currentStats);
    
    // Random tip
    const randomTip = tipsDatabase[Math.floor(Math.random() * tipsDatabase.length)];
    setDailyTip(randomTip);

    // Calculate Weakness
    if (currentStats) {
        const scores = [
            { area: 'Breathing', score: currentStats.avgBreathing },
            { area: 'Technical', score: currentStats.avgTechnical },
            { area: 'Emotional', score: currentStats.avgEmotional }
        ];
        // Find lowest score
        const lowest = scores.reduce((prev, curr) => prev.score < curr.score ? prev : curr);
        if (lowest.score < 70) { // Only suggest if score is somewhat low
            setWeakness(lowest);
        }
    }
  }, []);

  const handleSmartCoach = async () => {
      if (!weakness) return;
      setIsGeneratingRemedial(true);
      const script = await generateRemedialScript(weakness.area);
      setIsGeneratingRemedial(false);
      
      const areaName = weakness.area === 'Breathing' ? 'التنفس' : weakness.area === 'Emotional' ? 'المشاعر' : 'التقنية';
      onStartRemedial(script, `تدريب مكثف: ${areaName}`);
  };

  if (!user || !stats) return <div className="p-10 text-center">جاري تحميل البيانات...</div>;

  const skillsData = [
    { subject: 'التنفس', A: stats.avgBreathing || 60, fullMark: 100 },
    { subject: 'التقنية', A: stats.avgTechnical || 60, fullMark: 100 },
    { subject: 'المشاعر', A: stats.avgEmotional || 60, fullMark: 100 },
    { subject: 'السرعة', A: 75, fullMark: 100 },
    { subject: 'الثقة', A: 80, fullMark: 100 },
    { subject: 'اللغة', A: 85, fullMark: 100 },
  ];

  const progressData = user.history.slice(0, 7).reverse().map((session, index) => ({
    day: new Date(session.date).toLocaleDateString('ar-EG', { weekday: 'short' }),
    score: session.analysis.technicalScore
  }));

  const chartData = progressData.length > 0 ? progressData : [
    { day: 'السبت', score: 50 }, { day: 'الأحد', score: 50 }
  ];

  const challenge: DailyChallenge = {
    title: "تحدي الوثائقي",
    description: "سجل مقطعاً وثائقياً عن الفضاء لمدة 30 ثانية بدون أخطاء تنفس.",
    xpReward: 150,
    isCompleted: false,
    styleId: '1',
    topic: 'اكتشاف الفضاء',
    predefinedText: "في رحلتنا نحو النجوم، حيث يلتقي المجهول بالمعرفة... نقف أمام عظمة الكون بصمت وخشوع. [وقفة] هل نحن وحدنا في هذا الفراغ السرمدي؟"
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 pb-20 animate-fade-in">
      {/* Welcome & XP Bar */}
      <div className="bg-gradient-to-r from-primary-black to-secondary-gray p-8 rounded-3xl border border-gray-800 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-gold/10 rounded-full filter blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">أهلاً بك، {user.username}! 👋</h1>
            <p className="text-gray-400">أنت في المستوى <span className="text-primary-gold font-bold">{user.level}</span></p>
          </div>
          
          <div className="w-full md:w-1/2">
             <div className="flex justify-between text-sm mb-2 text-gray-400">
               <span>{user.currentXp} XP</span>
               <span>{user.nextLevelXp} XP</span>
             </div>
             <div className="h-4 bg-gray-700 rounded-full overflow-hidden">
               <div 
                  className="h-full bg-gradient-to-l from-primary-gold to-yellow-600 transition-all duration-500"
                  style={{ width: `${(user.currentXp / user.nextLevelXp) * 100}%` }}
               ></div>
             </div>
          </div>
        </div>
      </div>

      {/* AI Smart Coach (Only shows if weakness detected) */}
      {weakness && (
          <div className="bg-gradient-to-r from-purple-900/30 to-secondary-gray border border-purple-500/30 p-6 rounded-2xl relative overflow-hidden">
              <div className="relative z-10 flex justify-between items-center">
                  <div>
                      <h3 className="text-xl font-bold text-white flex items-center gap-2">
                          <MagicIcon className="w-6 h-6 text-purple-400" />
                          المدرب الذكي (AI Coach)
                      </h3>
                      <p className="text-gray-300 mt-1 max-w-lg">
                          لاحظت أن معدل 
                          <span className="text-purple-400 font-bold mx-1">
                              {weakness.area === 'Breathing' ? 'التنفس' : weakness.area === 'Emotional' ? 'المشاعر' : 'التقنية'}
                          </span> 
                          لديك منخفض قليلاً ({weakness.score}%). هل تريد مني توليد تدريب خاص لإصلاح ذلك؟
                      </p>
                  </div>
                  <button 
                    onClick={handleSmartCoach}
                    disabled={isGeneratingRemedial}
                    className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-6 py-3 rounded-xl shadow-lg transition-all transform hover:-translate-y-1"
                  >
                      {isGeneratingRemedial ? 'جاري التفكير...' : 'نعم، دربني الآن!'}
                  </button>
              </div>
          </div>
      )}

      {/* Quick Training Tools Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div 
            onClick={() => onOpenTool('BREATHING')}
            className="group bg-gradient-to-br from-primary-green/20 to-secondary-gray p-5 rounded-2xl border border-primary-green/30 cursor-pointer hover:border-primary-green transition-all relative overflow-hidden"
        >
            <div className="absolute right-0 top-0 w-20 h-20 bg-primary-green/10 rounded-full blur-2xl transform translate-x-1/2 -translate-y-1/2"></div>
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary-green/20 rounded-full flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                    🫁
                </div>
                <div>
                    <h3 className="font-bold text-white text-lg">مدرب التنفس</h3>
                    <p className="text-xs text-gray-400">تمرين 4-7-8 لزيادة سعة الرئة</p>
                </div>
                <div className="mr-auto">
                    <span className="text-primary-green text-sm font-bold group-hover:translate-x-[-5px] transition-transform inline-block">&larr; ابدأ</span>
                </div>
            </div>
        </div>

        <div 
            onClick={() => onOpenTool('TWISTERS')}
            className="group bg-gradient-to-br from-primary-ice/20 to-secondary-gray p-5 rounded-2xl border border-primary-ice/30 cursor-pointer hover:border-primary-ice transition-all relative overflow-hidden"
        >
            <div className="absolute right-0 top-0 w-20 h-20 bg-primary-ice/10 rounded-full blur-2xl transform translate-x-1/2 -translate-y-1/2"></div>
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary-ice/20 rounded-full flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                    🗣️
                </div>
                <div>
                    <h3 className="font-bold text-white text-lg">مخارج الحروف</h3>
                    <p className="text-xs text-gray-400">تمارين اللسان والجمل الصعبة</p>
                </div>
                <div className="mr-auto">
                    <span className="text-primary-ice text-sm font-bold group-hover:translate-x-[-5px] transition-transform inline-block">&larr; تدرب</span>
                </div>
            </div>
        </div>
      </div>

      {/* Daily Tip Section */}
      <div className="bg-primary-gold/10 border-r-4 border-primary-gold p-4 rounded-r-xl flex items-start gap-4">
         <span className="text-2xl">💡</span>
         <div>
            <h4 className="font-bold text-primary-gold mb-1">نصيحة اليوم الاحترافية:</h4>
            <p className="text-gray-300 text-sm">{dailyTip}</p>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Challenge */}
        <div className="bg-secondary-gray p-6 rounded-2xl border border-gray-800 lg:col-span-1 shadow-lg">
          <div className="flex justify-between items-center mb-4">
             <h3 className="font-bold text-xl text-primary-ice">التحدي اليومي 🎯</h3>
             <span className="bg-primary-gold text-black text-xs font-bold px-2 py-1 rounded">+{challenge.xpReward} XP</span>
          </div>
          <div className="bg-black/30 p-4 rounded-xl border border-gray-700">
             <h4 className="font-bold mb-2">{challenge.title}</h4>
             <p className="text-sm text-gray-400 mb-4">{challenge.description}</p>
             <button 
                onClick={() => onStartChallenge(challenge)}
                className="w-full bg-primary-gold hover:bg-yellow-500 text-black font-bold py-2 rounded-lg transition-colors shadow-lg hover:shadow-primary-gold/20"
             >
               ابدأ التحدي
             </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-secondary-gray p-4 rounded-2xl border border-gray-800 flex flex-col items-center justify-center shadow-lg hover:bg-white/5 transition-colors">
               <span className="text-3xl mb-2">⏱️</span>
               <span className="text-2xl font-bold text-white">{stats.totalMinutes}</span>
               <span className="text-xs text-gray-500">دقيقة مسجلة</span>
            </div>
            <div className="bg-secondary-gray p-4 rounded-2xl border border-gray-800 flex flex-col items-center justify-center shadow-lg hover:bg-white/5 transition-colors">
               <span className="text-3xl mb-2">✅</span>
               <span className="text-2xl font-bold text-white">{stats.totalSessions}</span>
               <span className="text-xs text-gray-500">تمرين مكتمل</span>
            </div>
            <div className="bg-secondary-gray p-4 rounded-2xl border border-gray-800 flex flex-col items-center justify-center shadow-lg hover:bg-white/5 transition-colors">
               <span className="text-3xl mb-2">🔥</span>
               <span className="text-2xl font-bold text-white">نشط</span>
               <span className="text-xs text-gray-500">الحالة</span>
            </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-64 lg:h-80">
        <div className="h-full bg-secondary-gray p-6 rounded-2xl border border-gray-800 shadow-lg flex flex-col">
          <h3 className="font-bold text-white mb-4">تحليل مهاراتك</h3>
          <div className="flex-1 w-full bg-black/20 rounded-xl overflow-hidden relative">
            <div className="absolute inset-0">
                <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={skillsData}>
                    <PolarGrid stroke="#444" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#F8F8F8', fontSize: 12 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar
                    name="Performance"
                    dataKey="A"
                    stroke="#D4AF37"
                    strokeWidth={2}
                    fill="#D4AF37"
                    fillOpacity={0.3}
                    />
                </RadarChart>
                </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="h-full bg-secondary-gray p-6 rounded-2xl border border-gray-800 shadow-lg flex flex-col">
          <h3 className="font-bold text-white mb-4">تطور الأداء</h3>
          <div className="flex-1 w-full bg-black/20 rounded-xl overflow-hidden relative">
            {user.history.length > 0 ? (
               <div className="absolute inset-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                    <XAxis dataKey="day" tick={{ fill: '#888' }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fill: '#888' }} axisLine={false} tickLine={false} />
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid #333' }}
                        itemStyle={{ color: '#D4AF37' }}
                    />
                    <Line type="monotone" dataKey="score" stroke="#006B54" strokeWidth={3} dot={{ r: 4, fill: '#006B54' }} activeDot={{ r: 6, fill: '#D4AF37' }} />
                    </LineChart>
                </ResponsiveContainer>
               </div>
            ) : (
               <div className="h-full flex items-center justify-center text-gray-500">
                  قم بأول تمرين لرؤية الرسم البياني
               </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
