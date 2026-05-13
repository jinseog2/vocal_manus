import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

export interface Recording {
  id: string;
  title: string;
  artist: string;
  date: string;
  duration: number;
  // ✅ P0 수정: Blob 대신 base64 문자열로 저장 (localStorage 영구 보존)
  audioData?: string;   // base64 encoded audio
  videoData?: string;   // base64 encoded video
  mimeType?: string;
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
  // ✅ P1 수정: color를 hex 값으로 통일 (CSS 클래스명 대신)
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

export interface GameHighScores {
  seal: number;
  penguin: number;
}

interface AppContextType {
  user: UserProfile;
  vocalStatus: VocalStatus;
  recordings: Recording[];
  badges: Badge[];
  todayCompleted: string[];
  gameHighScores: GameHighScores;
  favorites: string[];
  addRecording: (rec: Recording) => void;
  removeRecording: (id: string) => void;
  markCompleted: (exerciseId: string) => void;
  addXp: (amount: number) => void;
  updateVocalStatus: (status: Partial<VocalStatus>) => void;
  earnBadge: (badgeId: string) => void;
  updateGameHighScore: (game: 'seal' | 'penguin', score: number) => void;
  toggleFavorite: (songId: string) => void;
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

// ✅ P1 수정: color를 hex 값으로 통일
const defaultBadges: Badge[] = [
  { id: 'first_practice', name: '첫 연습', description: '첫 번째 보컬 연습 완료', icon: '🌟', earned: true, earnedDate: new Date().toISOString(), color: '#F59E0B' },
  { id: 'streak_3', name: '3일 연속', description: '3일 연속 연습 달성', icon: '🔥', earned: true, earnedDate: new Date().toISOString(), color: '#F97316' },
  { id: 'pitch_master', name: '피치 마스터', description: '피치 모드 10회 완료', icon: '🎯', earned: false, color: '#8B5CF6' },
  { id: 'game_player', name: '게임 플레이어', description: '보컬 게임 5회 플레이', icon: '🎮', earned: false, color: '#3B82F6' },
  { id: 'recorder', name: '녹음가', description: '첫 번째 녹음 저장', icon: '🎙️', earned: false, color: '#10B981' },
  { id: 'scale_king', name: '스케일 킹', description: '모든 스케일 연습 완료', icon: '👑', earned: false, color: '#D97706' },
  { id: 'streak_7', name: '7일 연속', description: '7일 연속 연습 달성', icon: '💎', earned: false, color: '#06B6D4' },
  { id: 'vocal_range', name: '음역 확장', description: '음역대 측정 완료', icon: '📊', earned: false, color: '#EC4899' },
];

const AppContext = createContext<AppContextType | null>(null);

// ✅ P0 수정: Blob → base64 변환 유틸
export async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export function base64ToUrl(base64: string): string {
  return base64; // data URL은 그대로 src에 사용 가능
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem('vocalup_user');
      return saved ? JSON.parse(saved) : defaultUser;
    } catch { return defaultUser; }
  });

  const [vocalStatus, setVocalStatus] = useState<VocalStatus>(() => {
    try {
      const saved = localStorage.getItem('vocalup_vocal_status');
      return saved ? JSON.parse(saved) : defaultVocalStatus;
    } catch { return defaultVocalStatus; }
  });

  // ✅ P0 수정: 녹음 데이터를 base64로 localStorage에 영구 저장
  const [recordings, setRecordings] = useState<Recording[]>(() => {
    try {
      const saved = localStorage.getItem('vocalup_recordings_v2');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  // ✅ P1 수정: 배지 색상이 hex인지 확인하고 마이그레이션
  const [badges, setBadges] = useState<Badge[]>(() => {
    try {
      const saved = localStorage.getItem('vocalup_badges');
      if (saved) {
        const parsed: Badge[] = JSON.parse(saved);
        // 기존 bg-* 클래스명을 hex로 마이그레이션
        return parsed.map(b => {
          if (b.color.startsWith('bg-')) {
            const match = defaultBadges.find(d => d.id === b.id);
            return { ...b, color: match?.color ?? '#8B5CF6' };
          }
          return b;
        });
      }
      return defaultBadges;
    } catch { return defaultBadges; }
  });

  const [todayCompleted, setTodayCompleted] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('vocalup_today_' + new Date().toDateString());
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  // ✅ P1 수정: 게임 최고 기록을 Context에서 통합 관리
  const [gameHighScores, setGameHighScores] = useState<GameHighScores>(() => {
    try {
      const seal = parseInt(localStorage.getItem('seal_highscore') ?? '0', 10);
      const penguin = parseInt(localStorage.getItem('penguin_highscore') ?? '0', 10);
      return { seal, penguin };
    } catch { return { seal: 0, penguin: 0 }; }
  });

  // ✅ P1 수정: 즐겨찾기 영구 저장
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('vocalup_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  // Persist effects
  useEffect(() => { localStorage.setItem('vocalup_user', JSON.stringify(user)); }, [user]);
  useEffect(() => { localStorage.setItem('vocalup_vocal_status', JSON.stringify(vocalStatus)); }, [vocalStatus]);
  useEffect(() => { localStorage.setItem('vocalup_recordings_v2', JSON.stringify(recordings)); }, [recordings]);
  useEffect(() => { localStorage.setItem('vocalup_badges', JSON.stringify(badges)); }, [badges]);
  useEffect(() => { localStorage.setItem('vocalup_today_' + new Date().toDateString(), JSON.stringify(todayCompleted)); }, [todayCompleted]);
  useEffect(() => { localStorage.setItem('vocalup_favorites', JSON.stringify(favorites)); }, [favorites]);
  useEffect(() => {
    localStorage.setItem('seal_highscore', String(gameHighScores.seal));
    localStorage.setItem('penguin_highscore', String(gameHighScores.penguin));
  }, [gameHighScores]);

  const addRecording = useCallback((rec: Recording) => {
    setRecordings(prev => [rec, ...prev].slice(0, 50)); // 최대 50개 보관
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

  // ✅ P1 수정: 게임 최고 기록 업데이트
  const updateGameHighScore = useCallback((game: 'seal' | 'penguin', score: number) => {
    setGameHighScores(prev => {
      if (score > prev[game]) {
        return { ...prev, [game]: score };
      }
      return prev;
    });
  }, []);

  // ✅ P1 수정: 즐겨찾기 토글
  const toggleFavorite = useCallback((songId: string) => {
    setFavorites(prev =>
      prev.includes(songId) ? prev.filter(id => id !== songId) : [...prev, songId]
    );
  }, []);

  return (
    <AppContext.Provider value={{
      user, vocalStatus, recordings, badges, todayCompleted, gameHighScores, favorites,
      addRecording, removeRecording, markCompleted, addXp, updateVocalStatus, earnBadge,
      updateGameHighScore, toggleFavorite,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
