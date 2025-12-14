
import { GoogleGenAI } from "@google/genai";
import { DeepAnalysisResult, SmartScriptItem, VoiceTwinProfile, WaveformProfile } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper to convert Blob to Base64
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64data = reader.result as string;
      // Remove data URL prefix (e.g., "data:audio/wav;base64,")
      const base64Content = base64data.split(',')[1];
      resolve(base64Content);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export const generatePracticeScript = async (
  style: string,
  topic: string,
  difficulty: string
): Promise<string> => {
  try {
    const prompt = `
      تصرف ككاتب نصوص إعلانية ووثائقية محترف.
      قم بكتابة نص تدريبي للأداء الصوتي باللغة العربية.
      
      النمط: ${style}
      الموضوع: ${topic}
      مستوى الصعوبة: ${difficulty}
      المدة التقريبية: 30 ثانية
      
      يجب أن يكون النص مشكولاً تشكيلاً كاملاً.
      لا تضف أي مقدمات أو خاتمة، فقط النص التدريبي.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    return response.text || "عذراً، لم أتمكن من توليد النص.";
  } catch (error) {
    return "نص احتياطي: في عالم مليء بالضجيج، ابحث عن لحظة سكون.";
  }
};

export const generateSmartTeleprompter = async (script: string): Promise<SmartScriptItem[]> => {
    try {
        const prompt = `
            Act as a Voice-Over Director. Analyze this Arabic script for a Teleprompter.
            
            Task:
            1. Split into logical sentences/phrases.
            2. Estimate timing in seconds for reading.
            3. Determine difficulty (Easy, Medium, Hard).
            4. Assign a highlight color (Hex) based on emotion/emphasis.
            5. Add performance tags in Arabic (e.g., [وقفة], [بطء], [حماس], [همس]).

            Script: "${script}"

            Output JSON Format:
            [
              {
                "sentence": "string",
                "timing_seconds": "string",
                "difficulty": "Easy" | "Medium" | "Hard",
                "highlight_color": "hex string",
                "performance_tags": ["tag1", "tag2"]
              }
            ]
        `;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: { responseMimeType: "application/json" }
        });

        if (response.text) {
            return JSON.parse(response.text);
        }
        throw new Error("No data");
    } catch (e) {
        console.error("Smart Teleprompter Error", e);
        // Fallback
        return [{
            sentence: script,
            timing_seconds: "30",
            difficulty: "Medium",
            highlight_color: "#FFFFFF",
            performance_tags: ["قراءة"]
        }];
    }
};

export const generateRemedialScript = async (weakness: string): Promise<string> => {
    try {
        const prompt = `Write a 40-word Arabic practice script specifically designed to improve: ${weakness}. Keep it challenging.`;
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });
        return response.text || "نص تدريبي عام.";
    } catch (error) {
        return "نص تدريبي عام.";
    }
};

export const generateCreativeScenario = async (): Promise<{title: string, script: string, character: string}> => {
    try {
        const prompt = `
            قم بإنشاء سيناريو تمثيلي إبداعي قصير للتدريب الصوتي باللغة العربية.
            يجب أن يكون الموقف غير تقليدي وممتع.
            Output JSON: { "title": "عنوان السيناريو", "character": "اسم الشخصية وصفتها", "script": "النص" }
        `;
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: { responseMimeType: "application/json" }
        });
        return JSON.parse(response.text!);
    } catch (error) {
        return { title: "خطأ", character: "لا يوجد", script: "حدث خطأ في التوليد." };
    }
};

// --- VOICE TWIN ANALYSIS ---

export const generateVoiceTwinProfile = async (audioBlob: Blob): Promise<{voice_twin_profile: VoiceTwinProfile} | null> => {
    try {
        const base64Audio = await blobToBase64(audioBlob);
        
        const prompt = `
        Analyze the audio to extract the speaker's unique voice characteristics.
        Return the result as a JSON object strictly following this structure in Arabic:

        {
          "voice_twin_profile": {
            "tone_style": "Describe the tone (e.g., warm, metallic, raspy)",
            "pitch_profile": "Describe pitch range (e.g., deep bass, fluctuating high)",
            "speed_profile": "Describe speaking pace (e.g., rapid fire, deliberate slow)",
            "pauses_pattern": "Describe pausing habits (e.g., dramatic long pauses, breathy stops)",
            "articulation_style": "Describe pronunciation (e.g., crisp, slurred, emphatic consonants)",
            "replication_instructions": "Step-by-step guide for an actor to mimic this exact voice"
          }
        }
        `;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: {
                parts: [
                    { inlineData: { mimeType: "audio/wav", data: base64Audio } },
                    { text: prompt }
                ]
            },
            config: { responseMimeType: "application/json" }
        });

        if (response.text) {
            return JSON.parse(response.text);
        }
        return null;

    } catch (error) {
        console.error("Voice Twin Analysis Error:", error);
        return null;
    }
};

// --- WAVEFORM PROFILE GENERATION ---
export const generateWaveformProfile = async (audioBlob: Blob): Promise<{waveform_profile: WaveformProfile} | null> => {
    try {
        const base64Audio = await blobToBase64(audioBlob);
        
        const prompt = `
        Analyze the audio dynamics to generate a "Real Studio Waveform" visualization data.
        Return a JSON object that describes how to render a professional waveform (like Adobe Audition).
        
        Output JSON:
        {
          "waveform_profile": {
            "style": "studio",
            "amplitude_pattern": [Array of 50 numbers between 0-100 representing the loudness contour],
            "frequency_pattern": [Array of 50 numbers between 0-100 representing frequency density],
            "visual_instructions": "Instructions on color, contrast, and style for the renderer (in Arabic)"
          }
        }
        `;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: {
                parts: [
                    { inlineData: { mimeType: "audio/wav", data: base64Audio } },
                    { text: prompt }
                ]
            },
            config: { responseMimeType: "application/json" }
        });

        if (response.text) {
            return JSON.parse(response.text);
        }
        return null;
    } catch (error) {
        console.error("Waveform Generation Error:", error);
        return null;
    }
};


// --- DEEP AUDIO ANALYSIS ---

export const analyzeAudioDeeply = async (audioBlob: Blob, text: string): Promise<DeepAnalysisResult | null> => {
    try {
        const base64Audio = await blobToBase64(audioBlob);
        
        const prompt = `
        قم بتحليل هذا التسجيل الصوتي لتطبيق "VoiceMaster Pro" للتدريب الصوتي الاحترافي.
        المستخدم قام بقراءة هذا النص: "${text}".

        المطلوب: إرجاع تقرير JSON دقيق باللغة العربية حصراً للقيم النصية.
        
        Structure Requirements (JSON):
        {
            "microphone_quality": {
                "noise_level": "منخفض" | "متوسط" | "مرتفع",
                "clarity_score": "0-100",
                "echo_presence": "لا يوجد" | "خفيف" | "قوي",
                "optimal_distance": "مناسبة" | "قريبة جداً" | "بعيدة جداً",
                "environment_score": "0-100",
                "recommendations": ["نصيحة عملية بالعربية 1", "نصيحة عملية بالعربية 2"]
            },
            "suggestion_markers": [
                {
                    "timestamp_start": "mm:ss",
                    "timestamp_end": "mm:ss",
                    "issue": "السرعة" | "التنفس" | "النبرة" | "النطق" | "الوقفات",
                    "recommendation": "نصيحة دقيقة بالعربية"
                }
            ],
            "emotion_analysis": {
                "dominant_emotion": "فرح" | "حزن" | "حماس" | "حياد" | "غموض" | "غضب",
                "emotion_scores": {
                    "joy": 0, "sadness": 0, "excitement": 0, "neutral": 0, "mystery": 0, "anger": 0
                },
                "emotion_recommendation": "نصيحة فنية بالعربية حول الأداء العاطفي والتقمص"
            },
            "clean_audio_instructions": "خطوات عملية مختصرة بالعربية لتنظيف وتحسين هذا التسجيل تحديداً"
        }
        `;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: {
                parts: [
                    { inlineData: { mimeType: "audio/wav", data: base64Audio } },
                    { text: prompt }
                ]
            },
            config: { responseMimeType: "application/json" }
        });

        if (response.text) {
            return JSON.parse(response.text);
        }
        return null;
    } catch (error) {
        console.error("Deep Analysis Error:", error);
        return null;
    }
};

// Keep existing simulation for fallback
export const analyzePerformanceSimulation = async (textLength: number): Promise<any> => {
    // ... existing implementation logic
    return {
        technicalScore: 85,
        emotionalScore: 70,
        breathingEfficiency: 60,
        clarity: 90,
        feedback: ["صوت جيد", "تحتاج لضبط التنفس"]
    };
};