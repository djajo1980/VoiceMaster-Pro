
import React, { useRef, useState } from 'react';
import { FingerPrintIcon, UploadFileIcon, MicIcon, StopIcon } from './Icons';
import { generateVoiceTwinProfile } from '../services/geminiService';
import { VoiceTwinProfile } from '../types';

const VoiceTwin: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [profile, setProfile] = useState<VoiceTwinProfile | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const uploaded = e.target.files?.[0];
        if (uploaded) {
            setFile(uploaded);
            setProfile(null);
        }
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            mediaRecorderRef.current = recorder;
            chunksRef.current = [];
            
            recorder.ondataavailable = (e) => { if(e.data.size > 0) chunksRef.current.push(e.data); };
            recorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/wav' });
                const audioFile = new File([blob], "recorded_ref.wav", { type: "audio/wav" });
                setFile(audioFile);
                setProfile(null);
                stream.getTracks().forEach(t => t.stop());
            };
            
            recorder.start();
            setIsRecording(true);
        } catch (e) {
            console.error(e);
            alert("لا يمكن الوصول للمايكروفون");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const analyze = async () => {
        if (!file) return;
        setIsAnalyzing(true);
        const result = await generateVoiceTwinProfile(file);
        if (result && result.voice_twin_profile) {
            setProfile(result.voice_twin_profile);
        }
        setIsAnalyzing(false);
    };

    return (
        <div className="flex flex-col h-full p-6 max-w-6xl mx-auto pb-20 animate-fade-in">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <div className="bg-purple-600 p-3 rounded-xl shadow-lg shadow-purple-500/20">
                    <FingerPrintIcon className="w-8 h-8 text-white" />
                </div>
                <div>
                    <h2 className="text-3xl font-bold text-white">Voice Twin (استنساخ النمط)</h2>
                    <p className="text-gray-400">حلل بصمة صوت المدرب واحصل على دليل استنساخ دقيق.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Input Section */}
                <div className="space-y-6">
                    <div className="bg-secondary-gray p-8 rounded-3xl border border-gray-800 shadow-xl">
                        <h3 className="text-xl font-bold text-white mb-6">1. المصدر الصوتي (المدرب)</h3>
                        
                        <div className="flex flex-col gap-4">
                            {/* Upload */}
                            <div 
                                onClick={() => fileInputRef.current?.click()}
                                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                                    file && !isRecording ? 'border-primary-green bg-green-900/10' : 'border-gray-700 hover:border-purple-500 bg-black/20'
                                }`}
                            >
                                <input type="file" ref={fileInputRef} onChange={handleUpload} accept="audio/*" className="hidden" />
                                <UploadFileIcon className="w-8 h-8 mx-auto mb-2 text-gray-500" />
                                <span className="text-sm font-bold block">{file && !isRecording ? file.name : "رفع ملف صوتي (MP3/WAV)"}</span>
                            </div>

                            <div className="flex items-center justify-center gap-2 text-gray-500 text-xs">- أو -</div>

                            {/* Record */}
                            <button 
                                onClick={isRecording ? stopRecording : startRecording}
                                className={`w-full py-6 rounded-2xl font-bold flex flex-col items-center justify-center gap-2 transition-all ${
                                    isRecording 
                                    ? 'bg-red-500/20 border-2 border-red-500 text-red-500 animate-pulse' 
                                    : 'bg-black/40 border border-gray-700 hover:bg-gray-800 text-gray-300'
                                }`}
                            >
                                {isRecording ? <StopIcon className="w-8 h-8"/> : <MicIcon className="w-8 h-8"/>}
                                {isRecording ? "إيقاف التسجيل" : "تسجيل المرجع مباشرة"}
                            </button>
                        </div>
                    </div>

                    {file && !isAnalyzing && !profile && (
                        <button 
                            onClick={analyze}
                            className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-4 rounded-xl shadow-lg transition-all transform hover:-translate-y-1"
                        >
                            🔍 تحليل البصمة الصوتية
                        </button>
                    )}

                    {isAnalyzing && (
                        <div className="bg-black/30 p-6 rounded-2xl text-center border border-purple-500/30">
                            <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-purple-400">جاري استخراج الخصائص الصوتية...</p>
                        </div>
                    )}
                </div>

                {/* Result Section */}
                <div className="relative">
                    {!profile ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-600 border border-gray-800 rounded-3xl bg-black/20 p-10 text-center">
                            <FingerPrintIcon className="w-20 h-20 mb-4 opacity-20" />
                            <p>النتيجة ستظهر هنا بعد التحليل</p>
                        </div>
                    ) : (
                        <div className="space-y-4 animate-fade-in h-full overflow-y-auto custom-scrollbar">
                            <div className="bg-gradient-to-br from-purple-900/40 to-secondary-gray p-6 rounded-3xl border border-purple-500/50">
                                <h3 className="font-bold text-white mb-6 border-b border-gray-700 pb-4">🧬 ملف التوأم الصوتي</h3>
                                
                                <div className="space-y-4">
                                    <div className="bg-black/40 p-4 rounded-xl">
                                        <span className="text-xs text-purple-400 uppercase font-bold block mb-1">أسلوب النبرة (Tone)</span>
                                        <p className="text-white font-serif">{profile.tone_style}</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-black/40 p-4 rounded-xl">
                                            <span className="text-xs text-purple-400 uppercase font-bold block mb-1">الطبقة (Pitch)</span>
                                            <p className="text-white text-sm">{profile.pitch_profile}</p>
                                        </div>
                                        <div className="bg-black/40 p-4 rounded-xl">
                                            <span className="text-xs text-purple-400 uppercase font-bold block mb-1">السرعة</span>
                                            <p className="text-white text-sm">{profile.speed_profile}</p>
                                        </div>
                                    </div>
                                    <div className="bg-black/40 p-4 rounded-xl">
                                        <span className="text-xs text-purple-400 uppercase font-bold block mb-1">نمط الوقفات</span>
                                        <p className="text-white text-sm">{profile.pauses_pattern}</p>
                                    </div>
                                    <div className="bg-black/40 p-4 rounded-xl">
                                        <span className="text-xs text-purple-400 uppercase font-bold block mb-1">أسلوب المخارج</span>
                                        <p className="text-white text-sm">{profile.articulation_style}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-purple-600/10 p-6 rounded-3xl border border-purple-500">
                                <h3 className="font-bold text-purple-400 mb-4">📝 تعليمات الاستنساخ (Replication)</h3>
                                <div className="text-gray-300 leading-relaxed text-sm whitespace-pre-line">
                                    {profile.replication_instructions}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VoiceTwin;