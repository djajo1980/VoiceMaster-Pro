
import { User, RecordingSession, AnalysisResult, Achievement, DailyHealthStats } from '../types';
import { achievements } from '../data/gamificationData';

const USER_KEY = 'voicemaster_user';

export const getCurrentUser = (): User | null => {
  const stored = localStorage.getItem(USER_KEY);
  if (!stored) return null;
  
  const user = JSON.parse(stored) as User;
  
  // Check daily health stats reset
  const today = new Date().toDateString();
  if (user.healthStats && new Date(user.healthStats.date).toDateString() !== today) {
      user.healthStats = {
          date: new Date().toISOString(),
          waterIntake: 0,
          fatigueLevel: 0
      };
      localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
  
  return user;
};

export const updateHealthStats = (stats: Partial<DailyHealthStats>): User | null => {
    const user = getCurrentUser();
    if (!user) return null;

    const today = new Date().toISOString();
    
    if (!user.healthStats) {
        user.healthStats = { date: today, waterIntake: 0, fatigueLevel: 0 };
    }

    user.healthStats = { ...user.healthStats, ...stats, date: today };
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    return user;
};

export const loginUser = (username: string, email: string): User => {
  const existing = getCurrentUser();
  
  // Logic to handle user switching or simplistic login
  if (existing && existing.email === email) {
      // Update streak
      const today = new Date().toDateString();
      const lastLogin = new Date(existing.lastLoginDate).toDateString();
      
      if (today !== lastLogin) {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          
          if (yesterday.toDateString() === lastLogin) {
              existing.loginStreak += 1;
          } else {
              existing.loginStreak = 1;
          }
          existing.lastLoginDate = new Date().toISOString();
          
          // Reset daily health on new login day if needed (handled in getCurrentUser but good safety)
          existing.healthStats = {
              date: new Date().toISOString(),
              waterIntake: 0,
              fatigueLevel: 0
          };

          localStorage.setItem(USER_KEY, JSON.stringify(existing));
      }
      return existing;
  }
  
  const newUser: User = {
    username,
    email,
    joinDate: new Date().toISOString(),
    level: 1,
    currentXp: 0,
    nextLevelXp: 500,
    history: [],
    achievements: [],
    loginStreak: 1,
    lastLoginDate: new Date().toISOString(),
    healthStats: {
        date: new Date().toISOString(),
        waterIntake: 0,
        fatigueLevel: 0
    }
  };
  
  localStorage.setItem(USER_KEY, JSON.stringify(newUser));
  return newUser;
};

export const logoutUser = () => {
  localStorage.removeItem(USER_KEY);
};

// --- DATA PERSISTENCE (IMPORT/EXPORT) ---

export const exportUserData = (): string | null => {
    const user = getCurrentUser();
    if (!user) return null;
    return JSON.stringify(user);
};

export const importUserData = (jsonData: string): boolean => {
    try {
        const parsed = JSON.parse(jsonData);
        // Basic validation
        if (parsed.username && parsed.email && Array.isArray(parsed.history)) {
            localStorage.setItem(USER_KEY, jsonData);
            return true;
        }
        return false;
    } catch (e) {
        console.error("Invalid JSON data", e);
        return false;
    }
};

// ---------------------------------------

export const checkAchievements = (user: User, currentSession?: RecordingSession): Achievement[] => {
    const newUnlocked: Achievement[] = [];
    const currentIds = new Set(user.achievements);

    achievements.forEach(ach => {
        if (currentIds.has(ach.id)) return;

        let unlocked = false;
        
        switch (ach.id) {
            case 'FIRST_STEP':
                if (user.history.length >= 1) unlocked = true;
                break;
            case 'DEDICATED':
                if (user.history.length >= 10) unlocked = true;
                break;
            case 'VIRTUOSO':
                if (currentSession && currentSession.analysis.technicalScore >= 90) unlocked = true;
                break;
            case 'MARATHON':
                if (currentSession && currentSession.durationSeconds >= 60) unlocked = true;
                break;
            case 'WEEK_STREAK':
                if (user.loginStreak >= 3) unlocked = true;
                break;
            // ENGINEER is handled manually in Studio
        }

        if (unlocked) {
            newUnlocked.push(ach);
            user.achievements.push(ach.id);
        }
    });

    return newUnlocked;
}

export const unlockAchievementManually = (achievementId: string): Achievement | null => {
    const user = getCurrentUser();
    if (!user) return null;
    
    if (user.achievements.includes(achievementId)) return null;

    const achievement = achievements.find(a => a.id === achievementId);
    if (achievement) {
        user.achievements.push(achievementId);
        localStorage.setItem(USER_KEY, JSON.stringify(user));
        return achievement;
    }
    return null;
}

export const saveRecordingSession = (
  styleName: string,
  topic: string,
  durationSeconds: number,
  analysis: AnalysisResult
): { user: User, newAchievements: Achievement[] } | null => {
  const user = getCurrentUser();
  if (!user) return null;

  // Calculate XP
  const baseXp = 10;
  const scoreBonus = Math.floor((analysis.technicalScore + analysis.emotionalScore) / 20);
  const durationBonus = Math.floor(durationSeconds / 5);
  const totalXp = baseXp + scoreBonus + durationBonus;

  const newSession: RecordingSession = {
    id: Date.now().toString(),
    date: new Date().toISOString(),
    styleName,
    topic,
    durationSeconds,
    analysis,
    xpEarned: totalXp
  };

  user.history.unshift(newSession);
  user.currentXp += totalXp;

  if (user.currentXp >= user.nextLevelXp) {
    user.level += 1;
    user.nextLevelXp = Math.floor(user.nextLevelXp * 1.5);
  }
  
  // Check Achievements
  const newAchievements = checkAchievements(user, newSession);

  localStorage.setItem(USER_KEY, JSON.stringify(user));
  return { user, newAchievements };
};

export const getUserStats = () => {
  const user = getCurrentUser();
  if (!user) return null;

  const totalSessions = user.history.length;
  const totalMinutes = Math.floor(user.history.reduce((acc, curr) => acc + curr.durationSeconds, 0) / 60);
  
  const avgTechnical = user.history.length > 0 
    ? Math.floor(user.history.reduce((acc, curr) => acc + curr.analysis.technicalScore, 0) / user.history.length) 
    : 0;
    
  const avgEmotional = user.history.length > 0 
    ? Math.floor(user.history.reduce((acc, curr) => acc + curr.analysis.emotionalScore, 0) / user.history.length) 
    : 0;
    
  const avgBreathing = user.history.length > 0 
    ? Math.floor(user.history.reduce((acc, curr) => acc + curr.analysis.breathingEfficiency, 0) / user.history.length) 
    : 0;

  return {
    totalSessions,
    totalMinutes,
    avgTechnical,
    avgEmotional,
    avgBreathing,
    streak: user.loginStreak,
    lastActivity: user.history.length > 0 ? user.history[0].date : user.joinDate
  };
};
