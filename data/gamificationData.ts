
import { Achievement } from '../types';

export const achievements: Achievement[] = [
  {
    id: 'FIRST_STEP',
    title: 'الخطوة الأولى',
    description: 'أكملت أول جلسة تسجيل لك بنجاح.',
    icon: '🏁',
    condition: 'Complete 1 session'
  },
  {
    id: 'DEDICATED',
    title: 'المثابر',
    description: 'أكملت 10 جلسات تدريبية.',
    icon: '🔥',
    condition: 'Complete 10 sessions'
  },
  {
    id: 'VIRTUOSO',
    title: 'النجم الساطع',
    description: 'حصلت على تقييم تقني أعلى من 90% في جلسة واحدة.',
    icon: '🌟',
    condition: 'Score > 90'
  },
  {
    id: 'ENGINEER',
    title: 'مهندس الصوت',
    description: 'قمت باستخدام أدوات المعالجة (الفلاتر) وتصدير ملف صوتي.',
    icon: '🎚️',
    condition: 'Use filters'
  },
  {
    id: 'MARATHON',
    title: 'نفس طويل',
    description: 'سجلت مقطعاً أطول من دقيقة واحدة.',
    icon: '⏱️',
    condition: 'Duration > 60s'
  },
  {
    id: 'WEEK_STREAK',
    title: 'التزام أسبوعي',
    description: 'تدربت لمدة 3 أيام متتالية.',
    icon: '📅',
    condition: '3 day streak'
  }
];
