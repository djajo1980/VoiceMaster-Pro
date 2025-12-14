
import React, { useState, useEffect } from 'react';
import { ViewState, VoiceStyle, DailyChallenge, Difficulty, User, LessonContent, ExerciseType } from './types';
import Studio from './components/Studio';
import Dashboard from './components/Dashboard';
import Library from './components/Library';
import TrainingPlan from './components/TrainingPlan';
import Auth from './components/Auth';
import Profile from './components/Profile';
import BreathingExercise from './components/BreathingExercise';
import Warmup from './components/Warmup';
import PitchMatcher from './components/PitchMatcher';
import HealthCenter from './components/HealthCenter';
import AudioLab from './components/AudioLab';
import VoiceTwin from './components/VoiceTwin';
import { MicIcon, ChartIcon, BookIcon, AcademicIcon } from './components/Icons';
import { getCurrentUser } from './services/storageService';

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

const App = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<ViewState | 'PITCH' | 'HEALTH' | 'LAB' | 'VOICE_TWIN'>('DASHBOARD');
  const [selectedStyleForStudio, setSelectedStyleForStudio] = useState<VoiceStyle | null>(null);
  const [studioInitialTopic, setStudioInitialTopic] = useState<string | undefined>(undefined);
  const [studioInitialText, setStudioInitialText] = useState<string | undefined>(undefined);
  const [studioInitialCharacter, setStudioInitialCharacter] = useState<string | undefined>(undefined);
  const [libraryInitialTab, setLibraryInitialTab] = useState<'STYLES' | 'TWISTERS' | 'TIPS' | 'TOOLS' | 'SCENARIOS' | undefined>(undefined);

  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      setCurrentUser(user);
    }
  }, []);

  const refreshUserData = () => {
    const updatedUser = getCurrentUser();
    if (updatedUser) {
      setCurrentUser(updatedUser);
    }
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setCurrentView('DASHBOARD');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView('DASHBOARD');
  };

  const handleStyleSelect = (style: VoiceStyle) => {
    setSelectedStyleForStudio(style);
    setStudioInitialTopic(undefined);
    setStudioInitialText(undefined);
    setStudioInitialCharacter(undefined);
    refreshUserData();
    setCurrentView('STUDIO');
  };

  const handleStartChallenge = (challenge: DailyChallenge) => {
    const style = styles.find(s => s.id === challenge.styleId) || styles[0];
    setSelectedStyleForStudio(style);
    setStudioInitialTopic(challenge.topic);
    setStudioInitialText(challenge.predefinedText);
    setStudioInitialCharacter(undefined);
    refreshUserData();
    setCurrentView('STUDIO');
  }

  const handleStartRemedial = (script: string, focusArea: string) => {
      setSelectedStyleForStudio(styles[0]); // Documentary usually good for training
      setStudioInitialTopic(focusArea);
      setStudioInitialText(script);
      setStudioInitialCharacter(undefined);
      refreshUserData();
      setCurrentView('STUDIO');
  };

  const handleStartScenario = (scenario: {title: string, script: string, character: string}) => {
      setSelectedStyleForStudio(styles[2]); // Storytelling style
      setStudioInitialTopic(scenario.title);
      setStudioInitialText(scenario.script);
      setStudioInitialCharacter(scenario.character);
      refreshUserData();
      setCurrentView('STUDIO');
  };

  const handleStartLesson = (lesson: LessonContent) => {
    refreshUserData();
    if (lesson.exerciseType === ExerciseType.Breathing) {
      setCurrentView('BREATHING');
    } else {
      // It's a reading/recording exercise
      // Default to Documentary style if not specified
      const style = styles[0]; 
      setSelectedStyleForStudio(style);
      setStudioInitialTopic(lesson.title);
      setStudioInitialText(lesson.practiceText);
      setStudioInitialCharacter(undefined);
      setCurrentView('STUDIO');
    }
  };

  const handleOpenTool = (tool: 'BREATHING' | 'TWISTERS' | 'WARMUP' | 'PITCH' | 'HEALTH' | 'LAB' | 'VOICE_TWIN') => {
      refreshUserData(); // Refresh stats in case tools updated them (e.g. Health)
      if (tool === 'BREATHING') {
          setCurrentView('BREATHING');
      } else if (tool === 'TWISTERS') {
          setLibraryInitialTab('TWISTERS');
          setCurrentView('LIBRARY');
      } else if (tool === 'WARMUP') {
          setCurrentView('WARMUP');
      } else if (tool === 'PITCH') {
          setCurrentView('PITCH');
      } else if (tool === 'HEALTH') {
          setCurrentView('HEALTH');
      } else if (tool === 'LAB') {
          setCurrentView('LAB');
      } else if (tool === 'VOICE_TWIN') {
          setCurrentView('VOICE_TWIN');
      }
  }

  const handleNavClick = (view: ViewState) => {
      refreshUserData();
      setCurrentView(view);
      if (view === 'LIBRARY') {
          setLibraryInitialTab('STYLES'); // Reset to default when clicking nav
      }
  }

  const handleProfileClick = () => {
      refreshUserData();
      setCurrentView('PROFILE');
  };

  if (!currentUser) {
    return <Auth onLogin={handleLogin} />;
  }

  const navItems = [
    { id: 'DASHBOARD', label: 'الرئيسية', icon: <ChartIcon className="w-5 h-5" /> },
    { id: 'TRAINING', label: 'الخطة', icon: <AcademicIcon className="w-5 h-5" /> },
    { id: 'STUDIO', label: 'الاستوديو', icon: <MicIcon className="w-5 h-5" /> },
    { id: 'LIBRARY', label: 'المكتبة', icon: <BookIcon className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-primary-black text-secondary-white font-sans overflow-hidden">
      
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-secondary-gray border-l border-gray-800 flex flex-col z-20">
        <div className="p-6 flex items-center gap-3 border-b border-gray-800">
           <div className="w-8 h-8 bg-gradient-to-tr from-primary-gold to-yellow-700 rounded-lg flex items-center justify-center">
             <MicIcon className="w-5 h-5 text-black" />
           </div>
           <h1 className="text-xl font-bold tracking-wide">Voice<span className="text-primary-gold">Master</span></h1>
        </div>
        
        <nav className="flex-1 py-6 px-4 space-y-2">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id as ViewState)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                currentView === item.id 
                ? 'bg-primary-gold text-black font-bold shadow-lg shadow-yellow-900/20' 
                : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-800">
          <div 
            onClick={handleProfileClick}
            className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${currentView === 'PROFILE' ? 'bg-primary-gold/20' : 'hover:bg-black/50'}`}
          >
            <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center border border-gray-600">
              <span className="text-xl font-bold">{currentUser.username.charAt(0).toUpperCase()}</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold truncate">{currentUser.username}</p>
              <p className="text-xs text-primary-gold">مستوى: {currentUser.level}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 h-screen overflow-y-auto bg-primary-black relative">
        {/* Background Ambient Elements */}
        <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
           <div className="absolute top-10 left-10 w-96 h-96 bg-primary-gold/5 rounded-full filter blur-[100px] opacity-20"></div>
           <div className="absolute bottom-10 right-10 w-80 h-80 bg-primary-ice/5 rounded-full filter blur-[80px] opacity-20"></div>
        </div>

        <div className="relative z-10">
          {currentView === 'DASHBOARD' && (
              <Dashboard 
                  onStartChallenge={handleStartChallenge} 
                  onOpenTool={handleOpenTool} 
                  onStartRemedial={handleStartRemedial}
              />
          )}
          {currentView === 'STUDIO' && (
             <Studio 
               initialStyle={selectedStyleForStudio} 
               initialTopic={studioInitialTopic}
               initialText={studioInitialText}
               initialCharacter={studioInitialCharacter}
             />
          )}
          {currentView === 'LIBRARY' && (
              <Library 
                onSelectStyle={handleStyleSelect} 
                onOpenTool={(tool) => handleOpenTool(tool)} 
                onStartScenario={handleStartScenario}
                initialTab={libraryInitialTab} 
              />
          )}
          {currentView === 'TRAINING' && <TrainingPlan onStartLesson={handleStartLesson} />}
          {currentView === 'BREATHING' && <BreathingExercise onComplete={() => { refreshUserData(); setCurrentView('TRAINING'); }} />}
          {currentView === 'WARMUP' && <Warmup onComplete={() => { refreshUserData(); handleNavClick('STUDIO'); }} />}
          {currentView === 'PITCH' && <PitchMatcher onComplete={() => { refreshUserData(); setCurrentView('LIBRARY'); }} />}
          {currentView === 'HEALTH' && <HealthCenter onComplete={() => { refreshUserData(); setCurrentView('LIBRARY'); }} />}
          {currentView === 'LAB' && <AudioLab />}
          {currentView === 'VOICE_TWIN' && <VoiceTwin />}
          {currentView === 'PROFILE' && <Profile user={currentUser} onLogout={handleLogout} />}
        </div>
      </main>

    </div>
  );
};

export default App;