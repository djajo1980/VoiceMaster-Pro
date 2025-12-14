
import React, { useRef, useState, useEffect } from 'react';
import { UploadFileIcon, PlayIcon, StopIcon, DownloadIcon, LabIcon, CheckCircleIcon, WarningIcon, SlidersIcon, MagicIcon } from './Icons';
import { analyzeAudioQuality, AudioQualityReport, masterAudio } from '../utils/audioMastering';
import Visualizer from './Visualizer';

const AudioLab: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [report, setReport] = useState<AudioQualityReport | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isMastering, setIsMastering] = useState(false);
    const [masteredUrl, setMasteredUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const uploaded = e.target.files?.[0];
        if (uploaded) {
            setFile(uploaded);
            const url = URL.createObjectURL(uploaded);
            setAudioUrl(url);
            setReport(null);
            setMasteredUrl(null);
            // Auto analyze
            analyze(uploaded);
        }
    };

    const analyze = async (f: File) => {
        setIsAnalyzing(true);
        // Delay for visual effect
        setTimeout(async () => {
            const r = await analyzeAudioQuality(f);
            setReport(r);
            setIsAnalyzing(false);
        }, 1500);
    };

    const handleMastering = async () => {
        if (!file) return;
        setIsMastering(true);
        const masteredBlob = await masterAudio(file);
        const url = URL.createObjectURL(masteredBlob);
        setMasteredUrl(url);
        setIsMastering(false);
    };

    const togglePlay = (url: string) => {
        if (!audioRef.current) return;
        
        if (isPlaying && audioRef.current.src === url) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            audioRef.current.src = url;
            audioRef.current.play();
            setIsPlaying(true);
        }
    };

    return (
        <div className="flex flex-col h-full p-6 max-w-6xl mx-auto pb-20 animate-fade-in">
            <audio ref={audioRef} onEnded={() => setIsPlaying(false)} className="hidden" />

            <div className="flex items-center gap-4 mb-8">
                <div className="bg-indigo-600 p-3 rounded-xl shadow-lg shadow-indigo-500/20">
                    <LabIcon className="w-8 h-8 text-white" />
                </div>
                <div>
                    <h2 className="text-3xl font-bold text-white">مختبر الجودة (Audio Lab)</h2>
                    <p className="text-gray-400">فحص جودة الأعمال المنجزة ومكساج نهائي (Mastering)</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
                
                {/* Left: Upload & Report */}
                <div className="space-y-6">
                    {/* Upload Zone */}
                    <div 
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-3xl p-10 text-center cursor-pointer transition-all ${
                            file ? 'border-primary-green bg-green-900/10' : 'border-gray-700 hover:border-indigo-500 bg-black/30'
                        }`}
                    >
                        <input type="file" ref={fileInputRef} onChange={handleUpload} accept="audio/*" className="hidden" />
                        <UploadFileIcon className={`w-12 h-12 mx-auto mb-4 ${file ? 'text-primary-green' : 'text-gray-500'}`} />
                        <h3 className="text-xl font-bold text-white mb-2">{file ? file.name : "اضغط لرفع عملك الجاهز (MP3/WAV)"}</h3>
                        <p className="text-sm text-gray-500">{file ? "تم الرفع بنجاح" : "سيتم تحليل الجودة تلقائياً"}</p>
                    </div>

                    {/* Analysis Loading */}
                    {isAnalyzing && (
                        <div className="bg-secondary-gray p-8 rounded-2xl text-center border border-gray-800">
                             <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                             <p className="text-indigo-400 font-bold animate-pulse">جاري تحليل الموجات والترددات...</p>
                        </div>
                    )}

                    {/* Quality Report */}
                    {report && !isAnalyzing && (
                        <div className="bg-secondary-gray rounded-2xl border border-gray-800 overflow-hidden shadow-2xl">
                            <div className="bg-black/40 p-4 border-b border-gray-800 flex justify-between items-center">
                                <h3 className="font-bold text-white">تقرير الجودة الهندسي</h3>
                                <span className="text-xs text-gray-500">{report.duration.toFixed(1)}s</span>
                            </div>
                            
                            <div className="p-6 space-y-4">
                                {/* Loudness Metric */}
                                <div className="flex items-center justify-between p-3 bg-black/20 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-full ${report.estimatedLUFS > -16 && report.estimatedLUFS < -12 ? 'bg-green-500/20 text-green-500' : 'bg-yellow-500/20 text-yellow-500'}`}>
                                            <SlidersIcon className="w-5 h-5"/>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-400">مستوى الصوت (LUFS)</p>
                                            <p className="font-bold text-white">{report.estimatedLUFS} dB</p>
                                        </div>
                                    </div>
                                    <div className="text-xs text-right">
                                        {report.estimatedLUFS > -16 && report.estimatedLUFS < -12 
                                            ? <span className="text-green-500">مثالي لليوتيوب ✅</span> 
                                            : report.estimatedLUFS < -20 
                                            ? <span className="text-yellow-500">منخفض جداً ⚠️</span> 
                                            : <span className="text-red-500">مرتفع جداً 🚨</span>}
                                    </div>
                                </div>

                                {/* Clipping Metric */}
                                <div className="flex items-center justify-between p-3 bg-black/20 rounded-lg">
                                     <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-full ${!report.clippingDetected ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                                            {report.clippingDetected ? <WarningIcon className="w-5 h-5"/> : <CheckCircleIcon className="w-5 h-5"/>}
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-400">التشويش (Clipping)</p>
                                            <p className="font-bold text-white">{report.maxPeakDB} dB Peak</p>
                                        </div>
                                    </div>
                                    <div className="text-xs">
                                        {report.clippingDetected 
                                            ? <span className="text-red-500">يوجد تشويش ❌</span> 
                                            : <span className="text-green-500">نظيف ✅</span>}
                                    </div>
                                </div>

                                {/* Dynamic Range */}
                                <div className="flex items-center justify-between p-3 bg-black/20 rounded-lg">
                                     <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-full bg-blue-500/20 text-blue-500">
                                            <span className="font-bold text-lg">DR</span>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-400">المجال الديناميكي</p>
                                            <p className="font-bold text-white">{report.dynamicRange.toFixed(1)} dB</p>
                                        </div>
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        كلما زاد الرقم زادت حيوية الصوت
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right: Actions & Visuals */}
                <div className="flex flex-col gap-6">
                    {/* Visualizer Placeholder */}
                    <div className="bg-black rounded-3xl border border-gray-800 p-6 h-48 relative overflow-hidden flex items-center justify-center">
                        {file ? (
                             <div className="w-full h-full flex items-center justify-center text-gray-600">
                                 {/* Since we don't have a Stream, Visualizer won't work easily here without refactoring. 
                                     Using a CSS animation placeholder for "Lab" vibe */}
                                 <div className="flex items-end gap-1 h-20">
                                     {[...Array(20)].map((_, i) => (
                                         <div 
                                            key={i} 
                                            className="w-2 bg-indigo-500 animate-wave" 
                                            style={{ 
                                                height: `${Math.random() * 100}%`,
                                                animationDuration: `${Math.random() * 0.5 + 0.5}s`
                                            }} 
                                         ></div>
                                     ))}
                                 </div>
                             </div>
                        ) : (
                            <p className="text-gray-600">منطقة الموجات الصوتية</p>
                        )}
                    </div>

                    {/* Actions */}
                    {report && (
                        <div className="bg-gradient-to-br from-indigo-900/30 to-secondary-gray p-6 rounded-2xl border border-indigo-500/30 flex-1 flex flex-col justify-center">
                            <h3 className="text-xl font-bold text-white mb-4">أدوات المعالجة (Mastering)</h3>
                            
                            <div className="space-y-4">
                                {/* Listen Original */}
                                <div className="flex items-center justify-between bg-black/40 p-3 rounded-lg border border-gray-700">
                                    <div className="text-sm text-gray-300">الملف الأصلي</div>
                                    <button 
                                        onClick={() => togglePlay(audioUrl!)}
                                        className="bg-gray-700 hover:bg-white text-white hover:text-black p-2 rounded-full transition-colors"
                                    >
                                        {isPlaying && audioRef.current?.src === audioUrl ? <StopIcon className="w-5 h-5"/> : <PlayIcon className="w-5 h-5"/>}
                                    </button>
                                </div>

                                {/* Fix Button */}
                                {!masteredUrl ? (
                                    <button 
                                        onClick={handleMastering}
                                        disabled={isMastering}
                                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-900/50 transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2"
                                    >
                                        {isMastering ? (
                                            <>جاري المعالجة...</>
                                        ) : (
                                            <>
                                                <MagicIcon className="w-5 h-5" /> إصلاح ومكساج تلقائي
                                            </>
                                        )}
                                    </button>
                                ) : (
                                    <div className="animate-fade-in space-y-4">
                                        <div className="flex items-center justify-between bg-green-900/20 p-3 rounded-lg border border-green-500/50">
                                            <div className="text-sm text-green-400 font-bold">تم المكساج (-14 LUFS) ✅</div>
                                            <button 
                                                onClick={() => togglePlay(masteredUrl)}
                                                className="bg-green-600 hover:bg-white text-white hover:text-black p-2 rounded-full transition-colors"
                                            >
                                                {isPlaying && audioRef.current?.src === masteredUrl ? <StopIcon className="w-5 h-5"/> : <PlayIcon className="w-5 h-5"/>}
                                            </button>
                                        </div>
                                        
                                        <a 
                                            href={masteredUrl} 
                                            download={`mastered_${file?.name}`}
                                            className="block w-full bg-primary-gold hover:bg-yellow-500 text-black font-bold py-4 rounded-xl text-center shadow-lg transition-colors flex items-center justify-center gap-2"
                                        >
                                            <DownloadIcon className="w-5 h-5" /> تحميل النسخة النهائية
                                        </a>
                                        
                                        <button 
                                            onClick={() => { setMasteredUrl(null); }}
                                            className="w-full text-gray-500 text-sm hover:text-white"
                                        >
                                            إعادة المعالجة
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AudioLab;
