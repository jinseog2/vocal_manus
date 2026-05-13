import { useLocation } from 'wouter';
import { Activity, Waves, Flame, Wind, MessageSquare, BookOpen, ChevronRight, Video, Mic, Speaker } from 'lucide-react';

const practiceCategories = [
  {
    id: 'warmup', title: '워밍업', subtitle: '립 트릴, 허밍, 모음 연습', icon: Flame,
    color: '#FF6B6B', path: '/practice/warmup', items: 8,
  },
  {
    id: 'scale', title: '스케일', subtitle: '장조/단조 스케일 훈련', icon: Waves,
    color: '#74B9FF', path: '/practice/scale', items: 12,
  },
  {
    id: 'pitch', title: '피치 모드', subtitle: '실시간 음정 시각화', icon: Activity,
    color: '#A29BFE', path: '/practice/pitch', items: 3,
  },
  {
    id: 'breath', title: '호흡 훈련', subtitle: '아포지오, 복식호흡', icon: Wind,
    color: '#00CEC9', path: '/practice/warmup', items: 5,
  },
  {
    id: 'diction', title: '발음 훈련', subtitle: '모음/자음 명확성', icon: MessageSquare,
    color: '#FDCB6E', path: '/practice/warmup', items: 6,
  },
  {
    id: 'curriculum', title: '커리큘럼', subtitle: '체계적 보컬 과정', icon: BookOpen,
    color: '#6C5CE7', path: '/practice/curriculum', items: 20,
  },
];

const modes = [
  { id: 'video', label: '영상 모드', icon: Video, desc: '전면 카메라 녹화', color: '#74B9FF' },
  { id: 'pitch', label: '피치 모드', icon: Mic, desc: '음정 그래프 표시', color: '#A29BFE' },
  { id: 'speaker', label: '스피커 모드', icon: Speaker, desc: '실시간 모니터링', color: '#00CEC9' },
];

export default function PracticePage() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-full pb-4">
      {/* Header */}
      <div className="px-4 pt-12 pb-4">
        <h1 className="text-2xl font-black text-white" style={{ fontFamily: 'Nunito, sans-serif' }}>연습</h1>
        <p className="text-xs mt-1" style={{ color: 'oklch(0.55 0.05 255)' }}>원하는 연습 항목을 선택하세요</p>
      </div>

      <div className="px-4 space-y-5">
        {/* Practice Mode Selection */}
        <section>
          <h2 className="text-sm font-bold text-white mb-3">연습 모드</h2>
          <div className="grid grid-cols-3 gap-2">
            {modes.map(m => {
              const Icon = m.icon;
              return (
                <button
                  key={m.id}
                  onClick={() => navigate('/practice/pitch')}
                  className="bg-card-gradient rounded-2xl p-3 flex flex-col items-center gap-2 card-hover"
                >
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                    style={{ background: `${m.color}22`, border: `1px solid ${m.color}44` }}>
                    <Icon size={22} style={{ color: m.color }} />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-bold text-white">{m.label}</p>
                    <p className="text-[9px] mt-0.5" style={{ color: 'oklch(0.50 0.05 255)' }}>{m.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Practice Categories */}
        <section>
          <h2 className="text-sm font-bold text-white mb-3">연습 항목</h2>
          <div className="space-y-2.5">
            {practiceCategories.map(cat => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  onClick={() => navigate(cat.path)}
                  className="w-full bg-card-gradient rounded-2xl p-4 flex items-center gap-4 card-hover text-left"
                >
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${cat.color}22`, border: `1px solid ${cat.color}44` }}>
                    <Icon size={22} style={{ color: cat.color }} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-white">{cat.title}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'oklch(0.55 0.05 255)' }}>{cat.subtitle}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${cat.color}22`, color: cat.color }}>
                      {cat.items}개
                    </span>
                    <ChevronRight size={14} style={{ color: 'oklch(0.45 0.05 255)' }} />
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
