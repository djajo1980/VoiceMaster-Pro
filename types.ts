
export type ViewState = 'STUDIO' | 'DASHBOARD' | 'LIBRARY' | 'TRAINING' | 'PROFILE' | 'BREATHING' | 'WARMUP' | 'PITCH' | 'HEALTH' | 'LAB' | 'VOICE_TWIN';

export enum Difficulty {
  Beginner = 'مبتدئ',
  Medium = 'متوسط',
  Advanced = 'متقدم',
}

export enum ExerciseType {
  Reading = 'READING',
  Breathing = 'BREATHING',
  Listening = 'LISTENING',
  Quiz = 'QUIZ'
}

export interface VoiceStyle {
  id: string;
  name: string;
  characteristics: string[];
  examples: string[];
  difficulty: Difficulty;
  icon: string;
}

// --- NEW AI TYPES ---

export interface MicrophoneQuality {
  noise_level: string;
  clarity_score: string;
  echo_presence: string;
  optimal_distance: string;
  environment_score: string;
  recommendations: string[];
}

export interface SuggestionMarker {
  timestamp_start: string;
  timestamp_end: string;
  issue: string;
  recommendation: string;
}

export interface EmotionAnalysis {
  dominant_emotion: string;
  emotion_scores: {
    joy: number;
    sadness: number;
    excitement: number;
    neutral: number;
    mystery: number;
    anger: number;
  };
  emotion_recommendation: string;
}

export interface SmartScriptItem {
  sentence: string;
  timing_seconds: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  highlight_color: string;
  performance_tags: string[];
}

export interface VoiceTwinProfile {
  tone_style: string;
  pitch_profile: string;
  speed_profile: string;
  pauses_pattern: string;
  articulation_style: string;
  replication_instructions: string;
}

export interface WaveformProfile {
  style: string;
  amplitude_pattern: number[];
  frequency_pattern: number[];
  visual_instructions: string;
}

export interface DeepAnalysisResult {
  microphone_quality: MicrophoneQuality;
  suggestion_markers: SuggestionMarker[];
  emotion_analysis: EmotionAnalysis;
  clean_audio_instructions?: string;
  waveform_profile?: WaveformProfile;
}

// -------------------

export interface AnalysisResult {
  technicalScore: number;
  emotionalScore: number;
  breathingEfficiency: number;
  clarity: number;
  wpm: number;
  pauseCount: number;
  feedback: string[];
  deepAnalysis?: DeepAnalysisResult; // Optional deep AI analysis
}

export interface RealTimeMetrics {
  volume: number;
  pitch: number; 
  pitchLabel: string;
  tone: number;
}

export interface RecordingSession {
  id: string;
  date: string;
  styleName: string;
  durationSeconds: number;
  topic: string;
  analysis: AnalysisResult;
  xpEarned: number;
  audioUrl?: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  condition: string;
}

export interface DailyHealthStats {
    date: string;
    waterIntake: number;
    fatigueLevel: number;
}

export interface User {
  username: string;
  email: string;
  joinDate: string;
  level: number;
  currentXp: number;
  nextLevelXp: number;
  history: RecordingSession[];
  achievements: string[];
  loginStreak: number;
  lastLoginDate: string;
  healthStats?: DailyHealthStats;
}

export interface DailyChallenge {
  title: string;
  description: string;
  xpReward: number;
  isCompleted: boolean;
  styleId: string;
  predefinedText?: string;
  topic?: string;
}

export interface LessonContent {
  id: string;
  title: string;
  theory: string;
  tips: string[];
  exerciseType: ExerciseType;
  practiceText?: string;
  actionLabel: string;
}

export interface TrainingDay {
  day: number;
  id: string;
  title: string;
  isCompleted: boolean;
  isLocked: boolean;
}

export interface TrainingWeek {
  week: number;
  title: string;
  days: TrainingDay[];
}

export interface TrainingPhase {
  id: number;
  title: string;
  duration: string;
  description: string;
  weeks: TrainingWeek[];
}

export type TipCategory = 'HEALTH' | 'PERFORMANCE' | 'TECHNIQUE' | 'ENGINEERING';

export interface Tip {
  id: string;
  category: TipCategory;
  title: string;
  content: string;
}

export interface TongueTwister {
  id: string;
  letter: string;
  text: string;
  difficulty: Difficulty;
}