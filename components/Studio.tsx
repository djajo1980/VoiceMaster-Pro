
import React, { useState, useRef, useEffect } from 'react';
import { VoiceStyle, AnalysisResult, RealTimeMetrics, Achievement, DeepAnalysisResult, SmartScriptItem, WaveformProfile } from '../types';
import { generatePracticeScript, analyzePerformanceSimulation, generateSmartTeleprompter, analyzeAudioDeeply, generateWaveformProfile } from '../services/geminiService';
import { saveRecordingSession, unlockAchievementManually } from '../services/storageService';
import { calculateWPM, analyzeAudioBuffer, generateRealFeedback } from '../utils/audioAnalyzer';
import { applyAudioFilter, AudioFilterType } from '../utils/audioProcessor';
import { AmbientPlayer, AmbienceType } from '../utils/audioSynthesizer';
import { 
    MicIcon, StopIcon, ChartIcon, PlayIcon, DownloadIcon, MagicIcon, 
    FilterIcon, MetronomeIcon, WandIcon, MusicIcon, UploadFileIcon, 
    RainIcon, FireIcon, CafeIcon, VolumeIcon, LabIcon, SparklesIcon, WaveIcon
} from './Icons';
import Visualizer from './Visualizer';
import Metronome from './Metronome';
import Teleprompter from './Teleprompter';

interface StudioProps {
  initialStyle?: VoiceStyle | null;
  initialTopic?: string;
  initialText?: string;
  initialCharacter?: string;
}

const Studio: React.FC<StudioProps> = ({ initialStyle, initialTopic, initialText, initialCharacter }) => {
  const [selectedStyle, setSelectedStyle] = useState<VoiceStyle | null>(initialStyle || null);
  const [topic, setTopic] = useState(initialTopic || "الطبيعة");
  const [script, setScript] = useState(initialText || "");
  
  // New Smart Script State
  const [smartScript, setSmartScript] = useState<SmartScriptItem[] | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Audio State
  const [isRecording, setIsRecording] = useState(false);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [originalBlob, setOriginalBlob] = useState<Blob | null>(null);
  const [processedBlob, setProcessedBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Simulation Mode State
  const [simulationMode, setSimulationMode] = useState(false);

  // UI States
  const [showMetronome, setShowMetronome] = useState(false);
  const [showMixer, setShowMixer] = useState(false);
  const [ambience, setAmbience] = useState<AmbienceType | 'OFF'>('OFF');
  const [bgVolume, setBgVolume] = useState(0.3);
  const [hasUserFile, setHasUserFile] = useState(false);

  // Real Time Metrics State
  const [realTimeMetrics, setRealTimeMetrics] = useState<RealTimeMetrics>({
      volume: 0, pitch: 0, pitchLabel: '--', tone: 0
  });

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  
  // Deep Analysis State
  const [isDeepAnalyzing, setIsDeepAnalyzing] = useState(false);
  const [deepAnalysis, setDeepAnalysis] = useState<DeepAnalysisResult | null>(null);
  const [isCleaning, setIsCleaning] = useState(false);

  // Waveform Profile State
  const [isGeneratingWave, setIsGeneratingWave] = useState(false);
  const [waveformProfile, setWaveformProfile] = useState<WaveformProfile | null>(null);

  const [recordingTime, setRecordingTime] = useState(0);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [newAchievements, setNewAchievements] = useState<Achievement[]>([]);
  
  const timerRef = useRef<number | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const ambientPlayerRef = useRef<AmbientPlayer>(new AmbientPlayer());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const waveformCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (initialStyle) setSelectedStyle(initialStyle);
  }, [initialStyle]);

  useEffect(() => {
    if (initialTopic) setTopic(initialTopic);
  }, [initialTopic]);

  useEffect(() => {
    if (initialText) {
        setScript(initialText);
        setSmartScript(null);
    }
  }, [initialText]);

  useEffect(() => {
      return () => { ambientPlayerRef.current.stop(); }
  }, []);

  // Effect to draw Waveform Profile when available
  useEffect(() => {
    if (waveformProfile && waveformCanvasRef.current) {
        const canvas = waveformCanvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const w = canvas.width;
        const h = canvas.height;
        ctx.clearRect(0, 0, w, h);

        // Draw background grid (Studio Style)
        ctx.fillStyle = "#111";
        ctx.fillRect(0, 0, w, h);
        ctx.strokeStyle = "#333";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, h/2); ctx.lineTo(w, h/2);
        ctx.stroke();

        const data = waveformProfile.amplitude_pattern;
        const len = data.length;
        const barWidth = w / len;

        // Draw waveform mirrored
        data.forEach((val, i) => {
            const height = (val / 100) * (h / 2) * 0.9;
            const x = i * barWidth;
            
            // Gradient style like Audition (Green/Blue)
            const gradient = ctx.createLinearGradient(0, h/2 - height, 0, h/2 + height);
            gradient.addColorStop(0, '#00ff88');
            gradient.addColorStop(0.5, '#0055ff');
            gradient.addColorStop(1, '#00ff88');

            ctx.fillStyle = gradient;
            ctx.fillRect(x, h/2 - height, barWidth - 1, height * 2);
        });
    }
  }, [waveformProfile]);

  useEffect(() => {
    let activeStream: MediaStream | null = null;
    const initMic = async () => {
        if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
             setSimulationMode(true);
             return;
        }
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            activeStream = stream;
            setMediaStream(stream);
            setSimulationMode(false);
        } catch (err) {
            setSimulationMode(true);
            setMediaStream(null); 
        }
    };
    initMic();
    return () => { if(activeStream) activeStream.getTracks().forEach(track => track.stop()); }
  }, []);

  const handleGenerateScript = async () => {
    if (!selectedStyle) return;
    setIsGenerating(true);
    setScript("");
    setSmartScript(null);
    const generated = await generatePracticeScript(selectedStyle.name, topic, selectedStyle.difficulty);
    setScript(generated);
    setIsGenerating(false);
  };

  const handleSmartDirector = async () => {
      if (!script) return;
      setIsGenerating(true);
      const smartData = await generateSmartTeleprompter(script);
      setSmartScript(smartData);
      setIsGenerating(false);
  };

  const handleDeepAnalysis = async () => {
      if (!originalBlob || simulationMode) return;
      setIsDeepAnalyzing(true);
      const result = await analyzeAudioDeeply(originalBlob, script);
      setDeepAnalysis(result);
      
      // Update main analysis with deep insights if available
      if (result && analysis) {
          // Merge feedbacks
          const newFeedback = [...analysis.feedback, ...result.microphone_quality.recommendations];
          setAnalysis({ ...analysis, feedback: newFeedback, deepAnalysis: result });
      }
      setIsDeepAnalyzing(false);
  };

  const handleGenerateWaveform = async () => {
      if (!originalBlob || simulationMode) return;
      setIsGeneratingWave(true);
      const result = await generateWaveformProfile(originalBlob);
      if (result && result.waveform_profile) {
          setWaveformProfile(result.waveform_profile);
      }
      setIsGeneratingWave(false);
  };

  const handleAIClean = async () => {
      if (!originalBlob) return;
      setIsCleaning(true);
      const cleanedBlob = await applyAudioFilter(originalBlob, 'CLEAN');
      setProcessedBlob(cleanedBlob);
      setAudioUrl(URL.createObjectURL(cleanedBlob));
      setIsCleaning(false);
      unlockAchievementManually('ENGINEER'); // Give badge
  };

  // --- Recording Logic ---
  const startRecording = () => {
    setAnalysis(null);
    setDeepAnalysis(null);
    setWaveformProfile(null);
    setSavedSuccess(false);
    setAudioUrl(null);
    setOriginalBlob(null);
    setProcessedBlob(null);
    audioChunksRef.current = [];
    setRecordingTime(0);

    if (simulationMode || !mediaStream) {
        setSimulationMode(true);
        setIsRecording(true);
        timerRef.current = window.setInterval(() => setRecordingTime(p => p + 1), 1000);
        return;
    }

    try {
        const recorder = new MediaRecorder(mediaStream);
        recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
        recorder.onstop = () => {
          const blob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
          setOriginalBlob(blob);
          setProcessedBlob(blob);
          setAudioUrl(URL.createObjectURL(blob));
          handleRealAnalysis(blob, recordingTime);
        };
        recorder.start();
        setMediaRecorder(recorder);
        setIsRecording(true);
        timerRef.current = window.setInterval(() => setRecordingTime(p => p + 1), 1000);
    } catch (e) {
        setSimulationMode(true);
        setIsRecording(true);
        timerRef.current = window.setInterval(() => setRecordingTime(p => p + 1), 1000);
    }
  };

  const stopRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRecording(false);
    if (simulationMode) handleSimulationAnalysis(recordingTime);
    else if (mediaRecorder && mediaRecorder.state !== 'inactive') mediaRecorder.stop();
  };

  const toggleRecording = () => isRecording ? stopRecording() : startRecording();

  // --- Analysis Logic ---
  const handleRealAnalysis = async (blob: Blob, duration: number) => {
    setIsAnalyzing(true);
    const wpm = calculateWPM(script, duration);
    const audioStats = await analyzeAudioBuffer(blob);
    const evaluation = generateRealFeedback(wpm, audioStats.pauseCount, selectedStyle?.name || "", script.length);
    const result: AnalysisResult = {
      technicalScore: evaluation.score,
      emotionalScore: Math.floor(Math.random() * 20 + 70), 
      breathingEfficiency: Math.max(50, 100 - (Math.abs(120 - wpm))),
      clarity: Math.floor(audioStats.averageVolume * 5 + 60), 
      wpm: wpm,
      pauseCount: audioStats.pauseCount,
      feedback: evaluation.feedback
    };
    setAnalysis(result);
    if (selectedStyle) saveRecordingSession(selectedStyle.name, topic, duration, result);
    setIsAnalyzing(false);
  };

  const handleSimulationAnalysis = async (duration: number) => {
      setIsAnalyzing(true);
      const simResult = await analyzePerformanceSimulation(script.length);
      const wpm = calculateWPM(script, duration);
      setAnalysis({ ...simResult, wpm: wpm > 0 ? wpm : 100, pauseCount: 5 });
      setIsAnalyzing(false);
  };

  // --- Mixer Logic ---
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) { await ambientPlayerRef.current.setUserFile(file); setHasUserFile(true); changeAmbience('FILE'); }
  };
  const changeAmbience = (type: AmbienceType | 'OFF') => {
      setAmbience(type);
      type === 'OFF' ? ambientPlayerRef.current.stop() : ambientPlayerRef.current.play(type, bgVolume);
  };
  const changeVolume = (val: number) => { setBgVolume(val); ambientPlayerRef.current.setVolume(val); };
  
  // --- Filter Logic ---
  const applyFilter = async (type: AudioFilterType) => {
    if (!originalBlob) return;
    const newBlob = await applyAudioFilter(originalBlob, type);
    setProcessedBlob(newBlob);
    setAudioUrl(URL.createObjectURL(newBlob));
    unlockAchievementManually('ENGINEER');
  };

  const handleDownload = () => {
    if (audioUrl) {
      const a = document.createElement('a');
      a.href = audioUrl;
      a.download = `voicemaster_${Date.now()}.wav`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  if (!selectedStyle) return <div className="p-10 text-center text-gray-500">اختر نمطاً للبدء</div>;

  return (
    <div className="flex flex-col h-full gap-6 p-4 lg:p-6 max-w-7xl mx-auto relative">
      
      {/* Controls Header */}
      <div className="bg-secondary-gray p-6 rounded-2xl border border-gray-800 flex flex-col md:flex-row gap-4 justify-between items-center shadow-lg relative z-20">
        <div>
          <h2 className="text-2xl font-bold text-primary-gold flex items-center gap-2"><span>{selectedStyle.icon}</span>{selectedStyle.name}</h2>
          <p className="text-sm text-gray-400">المايكروفون: {simulationMode ? 'محاكاة ⚠️' : 'متصل ✅'}</p>
        </div>
        
        <div className="flex gap-4 w-full md:w-auto items-center flex-wrap justify-end">
            <button onClick={() => setShowMixer(!showMixer)} className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${ambience !== 'OFF' ? 'bg-indigo-600 border-indigo-500' : 'bg-black/30 border-gray-700'}`}>
                <MusicIcon className="w-5 h-5" /> <span className="hidden md:inline">Mixer</span>
            </button>
            {showMixer && (
                <div className="absolute top-full right-0 mt-2 bg-black/90 backdrop-blur-xl border border-indigo-500/30 rounded-xl p-4 w-72 shadow-2xl z-50">
                    <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-800">
                        <h4 className="text-white font-bold text-sm">🎚️ غرفة التحكم</h4>
                        <button onClick={() => setShowMixer(false)}>✕</button>
                    </div>
                    <div className="flex gap-2 justify-between mb-4">
                        <button onClick={() => changeAmbience('RAIN')} className="p-2 rounded border border-gray-700 bg-gray-800"><RainIcon className="w-5 h-5 text-blue-200" /></button>
                        <button onClick={() => changeAmbience('FIRE')} className="p-2 rounded border border-gray-700 bg-gray-800"><FireIcon className="w-5 h-5 text-yellow-200" /></button>
                        <button onClick={() => changeAmbience('CAFE')} className="p-2 rounded border border-gray-700 bg-gray-800"><CafeIcon className="w-5 h-5 text-yellow-100" /></button>
                        <button onClick={() => changeAmbience('OFF')} className="p-2 rounded border border-red-500 bg-red-500/20 text-xs">OFF</button>
                    </div>
                    <div className="mb-4">
                        <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="audio/*" className="hidden" />
                        <button onClick={() => fileInputRef.current?.click()} className="w-full py-2 rounded border border-dashed text-xs border-gray-600 text-gray-400"><UploadFileIcon className="w-4 h-4 inline mr-2"/> {hasUserFile ? 'تغيير الملف' : 'رفع ملف MP3'}</button>
                    </div>
                    <input type="range" min="0" max="1" step="0.05" value={bgVolume} onChange={(e) => changeVolume(parseFloat(e.target.value))} className="w-full h-1 bg-gray-700 rounded-lg accent-indigo-500"/>
                </div>
            )}
            
            <button onClick={() => setShowMetronome(!showMetronome)} className={`p-2 rounded-lg border ${showMetronome ? 'bg-primary-gold text-black' : 'bg-black/30 border-gray-700'}`}><MetronomeIcon className="w-6 h-6" /></button>
            {showMetronome && <div className="absolute top-20 left-6 z-50"><Metronome /></div>}

            <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)} className="bg-black/40 border border-gray-700 rounded-lg px-4 py-2 text-white w-32 md:w-48" placeholder="موضوع النص" />
            <button onClick={handleGenerateScript} disabled={isGenerating} className="bg-primary-gold text-black font-bold px-4 py-2 rounded-lg hover:bg-yellow-500 disabled:opacity-50">{isGenerating ? "جاري..." : "توليد نص"}</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full pb-20">
        {/* Teleprompter */}
        <div className="lg:col-span-2 bg-black rounded-3xl border-2 border-gray-800 p-8 relative overflow-hidden shadow-2xl min-h-[500px] flex flex-col group">
          {script && !smartScript && (
              <button onClick={handleSmartDirector} className="absolute top-4 right-4 z-30 bg-purple-600/80 hover:bg-purple-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 backdrop-blur-sm">
                  <WandIcon className="w-3 h-3" /> المخرج الذكي
              </button>
          )}
          
          <div className="flex-1 overflow-hidden relative z-10 pt-10">
             {smartScript ? <Teleprompter scriptData={smartScript} /> : <Teleprompter simpleHtml={script} />}
          </div>

          <div className="mt-auto pt-6 flex flex-col items-center gap-4 relative z-20 bg-gradient-to-t from-black via-black to-transparent w-full">
             <div className="w-full h-24 bg-black/50 rounded-xl overflow-hidden mb-2 border border-gray-800 relative">
                <Visualizer stream={mediaStream} isRecording={isRecording || (!!audioUrl && !audioPlayerRef.current?.paused)} simulate={simulationMode} onMetricsUpdate={setRealTimeMetrics} />
             </div>

            {isRecording && (
                <div className="w-full grid grid-cols-3 gap-4 mb-2">
                    <div className="bg-gray-900/80 p-2 rounded border border-gray-800 text-center"><span className="text-primary-gold font-bold">{realTimeMetrics.pitch} Hz</span> <span className="text-[10px] block">{realTimeMetrics.pitchLabel}</span></div>
                    <div className="bg-gray-900/80 p-2 rounded border border-gray-800 text-center"><div className="w-full h-1 bg-gray-700 mt-2"><div className="h-full bg-primary-green" style={{width: `${realTimeMetrics.volume}%`}}></div></div></div>
                    <div className="bg-gray-900/80 p-2 rounded border border-gray-800 text-center text-xs text-gray-400">Tone: {realTimeMetrics.tone}</div>
                </div>
            )}

            {!isRecording && audioUrl && !simulationMode && (
                <div className="w-full animate-fade-in space-y-3">
                    {/* Main Actions */}
                    <div className="flex items-center gap-4 bg-black/40 p-3 rounded-lg border border-gray-800 w-full justify-between">
                        <div className="flex items-center gap-2">
                            <button onClick={() => { if(audioPlayerRef.current) { audioPlayerRef.current.currentTime = 0; audioPlayerRef.current.play(); } }} className="bg-primary-green text-white p-2 rounded-full"><PlayIcon className="w-4 h-4" /></button>
                            <audio ref={audioPlayerRef} src={audioUrl} className="hidden" />
                        </div>
                        <button onClick={handleDeepAnalysis} disabled={isDeepAnalyzing} className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2">
                            {isDeepAnalyzing ? "جاري التحليل..." : <><MagicIcon className="w-4 h-4" /> تحليل الذكاء الاصطناعي الشامل</>}
                        </button>
                    </div>

                    {/* Post Production & Download */}
                    <div className="flex items-center gap-2 justify-center flex-wrap">
                        <div className="flex bg-gray-900 rounded-lg p-1 border border-gray-700">
                             <button onClick={() => applyFilter('ORIGINAL')} className="px-3 py-1 rounded hover:bg-gray-700 text-xs text-gray-400">خام</button>
                             <button onClick={() => applyFilter('RADIO')} className="px-3 py-1 rounded hover:bg-gray-700 text-xs text-primary-gold">إذاعي</button>
                             <button onClick={() => applyFilter('AUDITORIUM')} className="px-3 py-1 rounded hover:bg-gray-700 text-xs text-blue-300">قاعة</button>
                             <button onClick={() => applyFilter('PHONE')} className="px-3 py-1 rounded hover:bg-gray-700 text-xs text-gray-400">هاتف</button>
                        </div>
                        <button onClick={handleDownload} className="bg-gray-700 hover:bg-white text-white hover:text-black px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1">
                            <DownloadIcon className="w-3 h-3"/> تحميل
                        </button>
                    </div>
                </div>
            )}

             <div className="flex items-center gap-8">
                <div className="text-gray-400 font-mono text-xl w-20 text-center">{(recordingTime / 60).toFixed(0).padStart(2,'0')}:{(recordingTime % 60).toFixed(0).padStart(2,'0')}</div>
                <button onClick={toggleRecording} className={`w-20 h-20 rounded-full flex items-center justify-center transition-all transform hover:scale-105 ${isRecording ? 'bg-secondary-red animate-pulse' : 'bg-primary-gold'}`}>
                  {isRecording ? <StopIcon className="w-10 h-10 text-white" /> : <MicIcon className="w-10 h-10 text-black" />}
                </button>
                <div className="w-20 flex justify-center text-xs">{isRecording ? <span className="text-red-500">تسجيل...</span> : "جاهز"}</div>
             </div>
          </div>
        </div>

        {/* Analysis Panel */}
        <div className="bg-secondary-gray rounded-2xl border border-gray-800 p-6 flex flex-col overflow-y-auto custom-scrollbar max-h-[calc(100vh-150px)]">
          <h3 className="text-xl font-bold mb-6 text-white border-b border-gray-700 pb-4">تقرير الأداء</h3>
          
          {isAnalyzing ? (
            <div className="text-center py-10"><div className="w-12 h-12 border-4 border-primary-gold border-t-transparent rounded-full animate-spin mx-auto"></div><p className="mt-4">جاري التحليل...</p></div>
          ) : analysis ? (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-black/40 p-3 rounded-xl text-center"><div className="text-xs text-gray-400">النتيجة</div><div className="text-2xl font-bold text-primary-gold">{analysis.technicalScore}%</div></div>
                <div className="bg-black/40 p-3 rounded-xl text-center"><div className="text-xs text-gray-400">WPM</div><div className="text-2xl font-bold text-primary-green">{analysis.wpm}</div></div>
              </div>

              {/* Deep Analysis Results */}
              {deepAnalysis && (
                  <div className="space-y-4 border-t border-gray-700 pt-4">
                      
                      {/* WAVEFORM PROFILE */}
                      {waveformProfile ? (
                          <div className="bg-black p-4 rounded-xl border border-blue-500/30">
                              <h4 className="font-bold text-blue-400 text-sm mb-2 flex items-center gap-2">
                                  <WaveIcon className="w-4 h-4"/> موجة احترافية (Studio Wave)
                              </h4>
                              <canvas ref={waveformCanvasRef} width={250} height={80} className="w-full h-20 bg-gray-900 rounded mb-2"></canvas>
                              <p className="text-[10px] text-gray-400 italic">{waveformProfile.visual_instructions}</p>
                          </div>
                      ) : (
                          <button 
                             onClick={handleGenerateWaveform}
                             disabled={isGeneratingWave}
                             className="w-full bg-blue-900/30 hover:bg-blue-900/50 text-blue-300 border border-blue-500/30 py-2 rounded-lg text-xs font-bold transition-all"
                          >
                              {isGeneratingWave ? "جاري رسم الموجة..." : "🌊 توليد موجة احترافية"}
                          </button>
                      )}

                      {/* AI CLEAN RECOMMENDATION CARD */}
                      <div className="bg-gradient-to-br from-indigo-900/40 to-black p-4 rounded-xl border border-indigo-500/50 shadow-lg">
                          <h4 className="font-bold text-indigo-200 text-sm mb-2 flex items-center gap-2">
                              <SparklesIcon className="w-4 h-4 text-indigo-400" /> تبييض الصوت (AI Voice Clean)
                          </h4>
                          <p className="text-xs text-gray-300 mb-3 leading-relaxed border-l-2 border-indigo-500 pl-2">
                              {deepAnalysis.clean_audio_instructions || "لا توجد تعليمات خاصة. الصوت جيد."}
                          </p>
                          <button 
                            onClick={handleAIClean}
                            disabled={isCleaning}
                            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded-lg text-xs transition-colors flex items-center justify-center gap-2"
                          >
                              {isCleaning ? "جاري المعالجة..." : "✨ تطبيق تنظيف AI الآن"}
                          </button>
                      </div>

                      {/* Mic Quality */}
                      <div className="bg-black/30 p-3 rounded-xl">
                          <h4 className="font-bold text-white text-sm mb-2 flex items-center gap-2"><MicIcon className="w-3 h-3" /> جودة المايكروفون</h4>
                          <div className="flex justify-between text-xs text-gray-400 mb-1"><span>النقاء</span><span>{deepAnalysis.microphone_quality.clarity_score}/100</span></div>
                          <div className="w-full bg-gray-700 h-1.5 rounded-full mb-2"><div className="bg-blue-500 h-1.5 rounded-full" style={{width: `${deepAnalysis.microphone_quality.clarity_score}%`}}></div></div>
                          <p className="text-[10px] text-gray-500">الضجيج: {deepAnalysis.microphone_quality.noise_level} | الصدى: {deepAnalysis.microphone_quality.echo_presence}</p>
                      </div>

                      {/* Emotion */}
                      <div className="bg-black/30 p-3 rounded-xl">
                          <h4 className="font-bold text-white text-sm mb-2">🎭 تحليل المشاعر</h4>
                          <div className="text-center mb-3">
                              <span className="text-2xl font-bold text-primary-gold">{deepAnalysis.emotion_analysis.dominant_emotion}</span>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-[10px] text-center text-gray-400">
                              <div className="bg-black/20 p-1 rounded">فرح: {deepAnalysis.emotion_analysis.emotion_scores.joy}</div>
                              <div className="bg-black/20 p-1 rounded">حزن: {deepAnalysis.emotion_analysis.emotion_scores.sadness}</div>
                              <div className="bg-black/20 p-1 rounded">حماس: {deepAnalysis.emotion_analysis.emotion_scores.excitement}</div>
                              <div className="bg-black/20 p-1 rounded">غضب: {deepAnalysis.emotion_analysis.emotion_scores.anger}</div>
                              <div className="bg-black/20 p-1 rounded">غموض: {deepAnalysis.emotion_analysis.emotion_scores.mystery}</div>
                              <div className="bg-black/20 p-1 rounded">حياد: {deepAnalysis.emotion_analysis.emotion_scores.neutral}</div>
                          </div>
                          <p className="text-xs text-gray-300 mt-2 italic border-t border-gray-700 pt-2">"{deepAnalysis.emotion_analysis.emotion_recommendation}"</p>
                      </div>

                      {/* Suggestions */}
                      <div className="bg-black/30 p-3 rounded-xl">
                          <h4 className="font-bold text-white text-sm mb-2">🚩 نقاط التحسين</h4>
                          {deepAnalysis.suggestion_markers.length > 0 ? (
                              <ul className="space-y-2">
                                  {deepAnalysis.suggestion_markers.map((m, i) => (
                                      <li key={i} className="text-xs bg-red-900/20 border border-red-900/50 p-2 rounded">
                                          <span className="text-red-400 font-bold">{m.timestamp_start}</span>: {m.issue}
                                          <br/><span className="text-gray-400">{m.recommendation}</span>
                                      </li>
                                  ))}
                              </ul>
                          ) : <p className="text-xs text-green-500">أداء خالي من الأخطاء الظاهرة!</p>}
                      </div>
                  </div>
              )}
              
              <div className="bg-black/20 p-4 rounded-xl">
                <h4 className="font-bold text-white mb-3 text-sm">الملاحظات العامة:</h4>
                <ul className="space-y-2">
                  {analysis.feedback.map((item, idx) => <li key={idx} className="text-sm text-gray-300 flex gap-2"><span className="text-primary-gold">•</span>{item}</li>)}
                </ul>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-500 opacity-50 py-10">
              <ChartIcon className="w-16 h-16 mb-4" /><p className="text-center text-sm">سجل واحصل على تحليل AI</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Studio;
