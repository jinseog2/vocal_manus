import { useLocation } from 'wouter';
import { useApp } from '@/contexts/AppContext';
import { Flame, Star, ChevronRight, Mic, Music, Gamepad2, BookOpen, Activity, Wind, MessageSquare, Waves } from 'lucide-react';

const HERO_BG = 'https://d2xsxph8kpxj0f.cloudfront.net/310419663032506040/2qUj9V5qzb6JP2x9TbX7ue/hero_bg-PddEEabaKBtuixZ6xT9NKh.webp';
const SEAL_IMG = 'https://d2xsxph8kpxj0f.cloudfront.net/310419663032506040/2qUj9V5qzb6JP2x9TbX7ue/seal_mascot-MkdCY6MumAwwjKixF4c4mN.webp';

const quickPracticeItems = [
  { id: 'warmup', label: '워밍업', icon: Flame, color: '#FF6B6B', path: '/practice/warmup' },
  { id: 'scale', label: '스케일', icon: Waves, color: '#74B9FF', path: '/practice/scale' },
  { id: 'pitch', label: '피치', icon: Activity, color: '#A29BFE', path: '/practice/pitch' },
  { id: 'breath', label: '호흡', icon: Wind, color: '#00CEC9', path: '/practice/warmup' },
  { id: 'diction', label: '발음', icon: MessageSquare, color: '#FDCB6E', path: '/practice/warmup' },
  { id: 'curriculum', label: '커리큘럼', icon: BookOpen, color: '#6C5CE7', path: '/practice/curriculum' },
];

const todayPlan = [
  { id: 'tp1', title: '립 트릴 워밍업', duration: '3분', category: '워밍업', path: '/practice/warmup' },
  { id: 'tp2', title: 'C장조 스케일', duration: '5분', category: '스케일', path: '/practice/scale' },
  { id: 'tp3', title: '피치 모니터링', duration: '5분', category: '피치', path: '/practice/pitch' },
];

export default function HomePage() {
  const [, navigate] = useLocation();
  const { user, vocalStatus, todayCompleted } = useApp();

  const xpPercent = Math.round((user.xp / user.xpToNext) * 100);
  const completedCount = todayPlan.filter(p => todayCompleted.includes(p.id)).length;

  return (
    <div className="min-h-full pb-4">
      {/* Hero Header */}
      <div
        className="relative px-4 pt-12 pb-6 overflow-hidden"
        style={{
          backgroundImage: `url(${HERO_BG})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
          minHeight: 220,
        }}
      >
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, oklch(0.13 0.025 255 / 60%) 0%, oklch(0.13 0.025 255) 100%)' }} />

        {/* Stars decoration */}
        {[...Array(6)].map((_, i) => (
          <span key={i} className="absolute text-yellow-300 star-twinkle" style={{ top: `${10 + i * 12}%`, left: `${5 + i * 15}%`, fontSize: 10 + (i % 3) * 4, animationDelay: `${i * 0.4}s` }}>★</span>
        ))}

        <div className="relative z-10 flex items-end justify-between">
          <div>
            <p className="text-xs font-semibold mb-1" style={{ color: 'oklch(0.65 0.18 280)' }}>안녕하세요 👋</p>
            <h1 className="text-2xl font-black text-white mb-1" style={{ fontFamily: 'Nunito, sans-serif' }}>{user.name}</h1>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: 'oklch(0.60 0.22 280 / 30%)', color: 'oklch(0.80 0.15 280)', border: '1px solid oklch(0.60 0.22 280 / 40%)' }}>
                Lv.{user.level}
              </span>
              <div className="flex items-center gap-1">
                <Flame size={12} style={{ color: '#FF6B6B' }} />
                <span className="text-xs font-bold text-white">{user.streak}일 연속</span>
              </div>
            </div>
            {/* XP Bar */}
            <div className="mt-2 w-36">
              <div className="flex justify-between text-[10px] mb-1" style={{ color: 'oklch(0.65 0.05 255)' }}>
                <span>XP {user.xp}</span><span>{user.xpToNext}</span>
              </div>
              <div className="h-1.5 rounded-full" style={{ background: 'oklch(1 0 0 / 15%)' }}>
                <div className="h-full progress-bar" style={{ width: `${xpPercent}%` }} />
              </div>
            </div>
          </div>
          <img src={SEAL_IMG} alt="seal" className="w-24 h-24 object-contain drop-shadow-xl" style={{ filter: 'drop-shadow(0 4px 12px oklch(0.60 0.22 280 / 40%))' }} />
        </div>
      </div>

      <div className="px-4 space-y-5 mt-4">
        {/* Vocal Status Cards */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-white">나의 보컬 상태</h2>
            <button onClick={() => navigate('/practice/pitch')} className="text-xs flex items-center gap-0.5" style={{ color: 'oklch(0.65 0.18 280)' }}>
              측정하기 <ChevronRight size={12} />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { label: '음역대', value: `${vocalStatus.range.min} ~ ${vocalStatus.range.max}`, score: vocalStatus.range.score, cls: 'status-range', icon: '🎵' },
              { label: '폐활량', value: `${vocalStatus.breath}점`, score: vocalStatus.breath, cls: 'status-breath', icon: '💨' },
              { label: '발음', value: `${vocalStatus.diction}점`, score: vocalStatus.diction, cls: 'status-diction', icon: '💬' },
              { label: '음색', value: `${vocalStatus.tone}점`, score: vocalStatus.tone, cls: 'status-tone', icon: '🎶' },
            ].map(item => (
              <div key={item.label} className={`${item.cls} rounded-2xl p-3 card-hover`}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[10px] font-semibold text-white/80">{item.label}</p>
                    <p className="text-base font-black text-white mt-0.5">{item.value}</p>
                  </div>
                  <span className="text-lg">{item.icon}</span>
                </div>
                <div className="mt-2 h-1 rounded-full bg-white/20">
                  <div className="h-full rounded-full bg-white/70" style={{ width: `${item.score}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Today's Plan */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-white">오늘의 플랜</h2>
            <span className="text-xs font-bold" style={{ color: 'oklch(0.65 0.18 280)' }}>{completedCount}/{todayPlan.length} 완료</span>
          </div>
          <div className="bg-card-gradient rounded-2xl p-3 space-y-2">
            {/* Progress */}
            <div className="h-1.5 rounded-full mb-3" style={{ background: 'oklch(1 0 0 / 10%)' }}>
              <div className="h-full progress-bar" style={{ width: `${(completedCount / todayPlan.length) * 100}%` }} />
            </div>
            {todayPlan.map(item => {
              const done = todayCompleted.includes(item.id);
              return (
                <button
                  key={item.id}
                  onClick={() => navigate(item.path)}
                  className="w-full flex items-center gap-3 p-2.5 rounded-xl transition-all duration-200"
                  style={{ background: done ? 'oklch(0.60 0.22 280 / 15%)' : 'oklch(1 0 0 / 5%)' }}
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: done ? 'oklch(0.60 0.22 280)' : 'oklch(1 0 0 / 10%)' }}>
                    {done ? <Star size={14} className="text-white" /> : <Mic size={14} style={{ color: 'oklch(0.65 0.05 255)' }} />}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-semibold text-white">{item.title}</p>
                    <p className="text-[10px]" style={{ color: 'oklch(0.55 0.05 255)' }}>{item.category} · {item.duration}</p>
                  </div>
                  <ChevronRight size={14} style={{ color: 'oklch(0.45 0.05 255)' }} />
                </button>
              );
            })}
          </div>
        </section>

        {/* Quick Practice */}
        <section>
          <h2 className="text-sm font-bold text-white mb-3">빠른 연습</h2>
          <div className="grid grid-cols-3 gap-2.5">
            {quickPracticeItems.map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => navigate(item.path)}
                  className="bg-card-gradient rounded-2xl p-3 flex flex-col items-center gap-2 card-hover"
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: `${item.color}22`, border: `1px solid ${item.color}44` }}>
                    <Icon size={18} style={{ color: item.color }} />
                  </div>
                  <span className="text-xs font-semibold text-white">{item.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Shortcut Banners */}
        <section className="grid grid-cols-2 gap-2.5">
          <button onClick={() => navigate('/songs')} className="bg-blue-gradient rounded-2xl p-4 flex flex-col gap-1 card-hover text-left">
            <Music size={20} className="text-white" />
            <p className="text-sm font-black text-white">노래 연습</p>
            <p className="text-[10px] text-white/70">YouTube 연동</p>
          </button>
          <button onClick={() => navigate('/game')} className="bg-violet-gradient rounded-2xl p-4 flex flex-col gap-1 card-hover text-left">
            <Gamepad2 size={20} className="text-white" />
            <p className="text-sm font-black text-white">보컬 게임</p>
            <p className="text-[10px] text-white/70">물개 · 펭귄</p>
          </button>
        </section>
      </div>
    </div>
  );
}
