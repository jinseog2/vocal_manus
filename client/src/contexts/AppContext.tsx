import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface Recording {
  id: string;
  title: string;
  artist: string;
  date: string;
  duration: number;
  audioBlob?: Blob;
  audioUrl?: string;
  videoBlob?: Blob;
  videoUrl?: string;
  type: 'audio' | 'video';
  thumbnail?: string;
  tag?: 'before' | 'after';
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earned: boolean;
  earnedDate?: string;
  color: string;
}

export interface VocalStatus {
  range: { min: string; max: string; score: number };
  breath: number;
  diction: number;
  tone: number;
  lastMeasured?: string;
}

export interface UserProfile {
  name: string;
  level: number;
  xp: number;
  xpToNext: number;
  streak: number;
  totalPracticeMinutes: number;
  joinDate: string;
  avatar: string;
}

interface AppContextType {
  user: UserProfile;
  vocalStatus: VocalStatus;
  recordings: Recording[];
  badges: Badge[];
  todayCompleted: string[];
  addRecording: (rec: Recording) => void;
  removeRecording: (id: string) => void;
  markCompleted: (exerciseId: string) => void;
  addXp: (amount: number) => void;
  updateVocalStatus: (status: Partial<VocalStatus>) => void;
  earnBadge: (badgeId: string) => void;
}

const defaultUser: UserProfile = {
  name: '보컬러',
  level: 1,
  xp: 120,
  xpToNext: 500,
  streak: 3,
  totalPracticeMinutes: 45,
  joinDate: new Date().toISOString(),
  avatar: '🎤',
};

const defaultVocalStatus: VocalStatus = {
  range: { min: 'C3', max: 'A4', score: 62 },
  breath: 74,
  diction: 58,
  tone: 81,
  lastMeasured: new Date().toISOString(),
};

const defaultBadges: Badge[] = [
  { id: 'first_practice', name: '첫 연습', description: '첫 번째 보컬 연습 완료', icon: '🌟', earned: true, earnedDate: new Date().toISOString(), color: 'bg-yellow-500' },
  { id: 'streak_3', name: '3일 연속', description: '3일 연속 연습 달성', icon: '🔥', earned: true, earnedDate: new Date().toISOString(), color: 'bg-orange-500' },
  { id: 'pitch_master', name: '피치 마스터', description: '피치 모드 10회 완료', icon: '🎯', earned: false, color: 'bg-violet-500' },
  { id: 'game_player', name: '게임 플레이어', description: '보컬 게임 5회 플레이', icon: '🎮', earned: false, color: 'bg-blue-500' },
  { id: 'recorder', name: '녹음가', description: '첫 번째 녹음 저장', icon: '🎙️', earned: false, color: 'bg-green-500' },
  { id: 'scale_king', name: '스케일 킹', description: '모든 스케일 연습 완료', icon: '👑', earned: false, color: 'bg-yellow-600' },
  { id: 'streak_7', name: '7일 연속', description: '7일 연속 연습 달성', icon: '💎', earned: false, color: 'bg-cyan-500' },
  { id: 'vocal_range', name: '음역 확장', description: '음역대 측정 완료', icon: '📊', earned: false, color: 'bg-pink-500' },
];

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('vocalup_user');
    return saved ? JSON.parse(saved) : defaultUser;
  });
  const [vocalStatus, setVocalStatus] = useState<VocalStatus>(() => {
    const saved = localStorage.getItem('vocalup_vocal_status');
    return saved ? JSON.parse(saved) : defaultVocalStatus;
  });
  const [recordings, setRecordings] = useState<Recording[]>(() => {
    const saved = localStorage.getItem('vocalup_recordings');
    if (!saved) return [];
    const parsed = JSON.parse(saved);
    // Blob URLs are not persistent across sessions, clear them
    return parsed.map((r: Recording) => ({ ...r, audioUrl: undefined, videoUrl: undefined, audioBlob: undefined, videoBlob: undefined }));
  });
  const [badges, setBadges] = useState<Badge[]>(() => {
    const saved = localStorage.getItem('vocalup_badges');
    return saved ? JSON.parse(saved) : defaultBadges;
  });
  const [todayCompleted, setTodayCompleted] = useState<string[]>(() => {
    const saved = localStorage.getItem('vocalup_today_' + new Date().toDateString());
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => { localStorage.setItem('vocalup_user', JSON.stringify(user)); }, [user]);
  useEffect(() => { localStorage.setItem('vocalup_vocal_status', JSON.stringify(vocalStatus)); }, [vocalStatus]);
  useEffect(() => {
    const meta = recordings.map(r => ({ ...r, audioBlob: undefined, videoBlob: undefined, audioUrl: undefined, videoUrl: undefined }));
    localStorage.setItem('vocalup_recordings', JSON.stringify(meta));
  }, [recordings]);
  useEffect(() => { localStorage.setItem('vocalup_badges', JSON.stringify(badges)); }, [badges]);
  useEffect(() => { localStorage.setItem('vocalup_today_' + new Date().toDateString(), JSON.stringify(todayCompleted)); }, [todayCompleted]);

  const addRecording = useCallback((rec: Recording) => {
    setRecordings(prev => [rec, ...prev]);
  }, []);

  const removeRecording = useCallback((id: string) => {
    setRecordings(prev => prev.filter(r => r.id !== id));
  }, []);

  const markCompleted = useCallback((exerciseId: string) => {
    setTodayCompleted(prev => prev.includes(exerciseId) ? prev : [...prev, exerciseId]);
  }, []);

  const addXp = useCallback((amount: number) => {
    setUser(prev => {
      const newXp = prev.xp + amount;
      if (newXp >= prev.xpToNext) {
        return { ...prev, xp: newXp - prev.xpToNext, level: prev.level + 1, xpToNext: Math.floor(prev.xpToNext * 1.5) };
      }
      return { ...prev, xp: newXp };
    });
  }, []);

  const updateVocalStatus = useCallback((status: Partial<VocalStatus>) => {
    setVocalStatus(prev => ({ ...prev, ...status, lastMeasured: new Date().toISOString() }));
  }, []);

  const earnBadge = useCallback((badgeId: string) => {
    setBadges(prev => prev.map(b => b.id === badgeId ? { ...b, earned: true, earnedDate: new Date().toISOString() } : b));
  }, []);

  return (
    <AppContext.Provider value={{ user, vocalStatus, recordings, badges, todayCompleted, addRecording, removeRecording, markCompleted, addXp, updateVocalStatus, earnBadge }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
