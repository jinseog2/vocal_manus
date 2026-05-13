import { useLocation } from 'wouter';
import { useApp } from '@/contexts/AppContext';
import { ChevronRight, Flame, Star, Clock, Music, Trophy, Camera } from 'lucide-react';

export default function MyPage() {
  const [, navigate] = useLocation();
  const { user, vocalStatus, badges, recordings } = useApp();
  const xpPercent = Math.round((user.xp / user.xpToNext) * 100);
  const earnedBadges = badges.filter(b => b.earned);

  return (
    <div className="min-h-full pb-4">
      <div className="px-4 pt-12 pb-4">
        <h1 className="text-2xl font-black text-white" style={{ fontFamily: 'Nunito, sans-serif' }}>MY</h1>
      </div>

      <div className="px-4 space-y-4">
        {/* Profile Card */}
        <div className="bg-card-gradient rounded-3xl p-5">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
              style={{ background: 'oklch(0.60 0.22 280 / 20%)', border: '2px solid oklch(0.60 0.22 280 / 40%)' }}>
              {user.avatar}
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-black text-white">{user.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: 'oklch(0.60 0.22 280 / 30%)', color: 'oklch(0.80 0.15 280)' }}>
                  Lv.{user.level}
                </span>
                <div className="flex items-center gap-1">
                  <Flame size={11} style={{ color: '#FF6B6B' }} />
                  <span className="text-xs text-white/70">{user.streak}일 연속</span>
                </div>
              </div>
              <div className="mt-2">
                <div className="flex justify-between text-[10px] mb-1" style={{ color: 'oklch(0.55 0.05 255)' }}>
                  <span>XP {user.xp}</span><span>{user.xpToNext}</span>
                </div>
                <div className="h-1.5 rounded-full" style={{ background: 'oklch(1 0 0 / 10%)' }}>
                  <div className="h-full progress-bar" style={{ width: `${xpPercent}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 mt-4">
            {[
              { icon: Flame, label: '연속', value: `${user.streak}일`, color: '#FF6B6B' },
              { icon: Clock, label: '총 연습', value: `${user.totalPracticeMinutes}분`, color: '#74B9FF' },
              { icon: Star, label: '배지', value: `${earnedBadges.length}개`, color: '#FDCB6E' },
            ].map(s => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="rounded-2xl p-3 text-center" style={{ background: 'oklch(1 0 0 / 5%)' }}>
                  <Icon size={16} style={{ color: s.color, margin: '0 auto 4px' }} />
                  <p className="text-base font-black text-white">{s.value}</p>
                  <p className="text-[10px]" style={{ color: 'oklch(0.50 0.05 255)' }}>{s.label}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Vocal Status */}
        <div className="bg-card-gradient rounded-3xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-white">보컬 상태</h3>
            <button onClick={() => navigate('/practice/pitch')} className="text-xs" style={{ color: 'oklch(0.65 0.18 280)' }}>재측정</button>
          </div>
          <div className="space-y-3">
            {[
              { label: '음역대', value: `${vocalStatus.range.min} ~ ${vocalStatus.range.max}`, score: vocalStatus.range.score, color: '#A29BFE' },
              { label: '폐활량', value: `${vocalStatus.breath}점`, score: vocalStatus.breath, color: '#74B9FF' },
              { label: '발음', value: `${vocalStatus.diction}점`, score: vocalStatus.diction, color: '#00CEC9' },
              { label: '음색', value: `${vocalStatus.tone}점`, score: vocalStatus.tone, color: '#FDCB6E' },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-3">
                <span className="text-xs w-14 text-right" style={{ color: 'oklch(0.55 0.05 255)' }}>{item.label}</span>
                <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'oklch(1 0 0 / 10%)' }}>
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${item.score}%`, background: item.color }} />
                </div>
                <span className="text-xs font-bold text-white w-16">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* My Albums */}
        <button onClick={() => navigate('/mypage/albums')} className="w-full bg-card-gradient rounded-3xl p-4 flex items-center justify-between card-hover">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'oklch(0.60 0.22 280 / 20%)' }}>
              <Camera size={18} style={{ color: 'oklch(0.75 0.18 280)' }} />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-white">My Albums</p>
              <p className="text-xs" style={{ color: 'oklch(0.55 0.05 255)' }}>녹음/녹화 저장소 · {recordings.length}개</p>
            </div>
          </div>
          <ChevronRight size={16} style={{ color: 'oklch(0.45 0.05 255)' }} />
        </button>

        {/* Badges */}
        <div className="bg-card-gradient rounded-3xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Trophy size={16} style={{ color: '#FDCB6E' }} />
              <h3 className="text-sm font-bold text-white">배지</h3>
            </div>
            <span className="text-xs" style={{ color: 'oklch(0.55 0.05 255)' }}>{earnedBadges.length}/{badges.length}</span>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {badges.map(badge => (
              <div key={badge.id} className="flex flex-col items-center gap-1">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl transition-all"
                  style={{
                    background: badge.earned ? `${badge.color.replace('bg-', '')}22` : 'oklch(1 0 0 / 5%)',
                    border: badge.earned ? `1.5px solid oklch(0.60 0.18 280 / 40%)` : '1.5px solid oklch(1 0 0 / 8%)',
                    opacity: badge.earned ? 1 : 0.35,
                    filter: badge.earned ? 'none' : 'grayscale(1)',
                  }}
                >
                  {badge.icon}
                </div>
                <p className="text-[9px] text-center leading-tight" style={{ color: badge.earned ? 'oklch(0.75 0.05 255)' : 'oklch(0.40 0.05 255)' }}>
                  {badge.name}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Menu Items */}
        <div className="bg-card-gradient rounded-3xl overflow-hidden">
          {[
            { label: '커리큘럼', icon: Music, path: '/practice/curriculum' },
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <button key={i} onClick={() => navigate(item.path)}
                className="w-full flex items-center gap-3 px-4 py-3.5 transition-colors"
                style={{ borderBottom: i < 0 ? '1px solid oklch(1 0 0 / 6%)' : 'none' }}>
                <Icon size={16} style={{ color: 'oklch(0.60 0.18 280)' }} />
                <span className="flex-1 text-sm font-semibold text-white text-left">{item.label}</span>
                <ChevronRight size={14} style={{ color: 'oklch(0.45 0.05 255)' }} />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
