import { useState } from 'react';
import { useLocation } from 'wouter';
import { ArrowLeft, Lock, CheckCircle2, Play, ChevronDown, ChevronUp } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { toast } from 'sonner';

const curriculum = [
  {
    id: 'ch1', title: '챕터 1: 보컬 기초', subtitle: '발성의 원리와 기본기', color: '#74B9FF', unlocked: true,
    lessons: [
      { id: 'l1_1', title: '호흡과 지지 (Breath Support)', duration: '5분', done: true, youtubeId: 'ZuZNNMpEFcM' },
      { id: 'l1_2', title: '성대의 구조와 기능', duration: '4분', done: true, youtubeId: 'ZuZNNMpEFcM' },
      { id: 'l1_3', title: '공명 찾기 (Resonance)', duration: '6분', done: false, youtubeId: 'ZuZNNMpEFcM' },
      { id: 'l1_4', title: '기본 워밍업 루틴', duration: '8분', done: false, youtubeId: 'ZuZNNMpEFcM' },
    ],
  },
  {
    id: 'ch2', title: '챕터 2: 음정과 피치', subtitle: '정확한 음정 훈련', color: '#A29BFE', unlocked: true,
    lessons: [
      { id: 'l2_1', title: '피치 인식 훈련', duration: '5분', done: false, youtubeId: 'ZuZNNMpEFcM' },
      { id: 'l2_2', title: '장조 스케일 마스터', duration: '7분', done: false, youtubeId: 'ZuZNNMpEFcM' },
      { id: 'l2_3', title: '단조 스케일 마스터', duration: '7분', done: false, youtubeId: 'ZuZNNMpEFcM' },
      { id: 'l2_4', title: '반음계 훈련', duration: '6분', done: false, youtubeId: 'ZuZNNMpEFcM' },
      { id: 'l2_5', title: '도약 음정 훈련', duration: '8분', done: false, youtubeId: 'ZuZNNMpEFcM' },
    ],
  },
  {
    id: 'ch3', title: '챕터 3: 음역 확장', subtitle: '고음과 저음 개발', color: '#00CEC9', unlocked: false,
    lessons: [
      { id: 'l3_1', title: '두성 (Head Voice) 개발', duration: '8분', done: false, youtubeId: 'ZuZNNMpEFcM' },
      { id: 'l3_2', title: '흉성 (Chest Voice) 강화', duration: '7분', done: false, youtubeId: 'ZuZNNMpEFcM' },
      { id: 'l3_3', title: '믹스 보이스 (Mix Voice)', duration: '10분', done: false, youtubeId: 'ZuZNNMpEFcM' },
      { id: 'l3_4', title: '패시지오 (Passaggio) 극복', duration: '9분', done: false, youtubeId: 'ZuZNNMpEFcM' },
    ],
  },
  {
    id: 'ch4', title: '챕터 4: 발음과 딕션', subtitle: '명확한 발음 훈련', color: '#FDCB6E', unlocked: false,
    lessons: [
      { id: 'l4_1', title: '모음 성형 (Vowel Shaping)', duration: '6분', done: false, youtubeId: 'ZuZNNMpEFcM' },
      { id: 'l4_2', title: '자음 명확성', duration: '5분', done: false, youtubeId: 'ZuZNNMpEFcM' },
      { id: 'l4_3', title: '한국어 발성 특성', duration: '7분', done: false, youtubeId: 'ZuZNNMpEFcM' },
    ],
  },
  {
    id: 'ch5', title: '챕터 5: 감정 표현', subtitle: '음악적 표현력 개발', color: '#FF6B6B', unlocked: false,
    lessons: [
      { id: 'l5_1', title: '다이나믹 조절', duration: '6분', done: false, youtubeId: 'ZuZNNMpEFcM' },
      { id: 'l5_2', title: '비브라토 (Vibrato)', duration: '8분', done: false, youtubeId: 'ZuZNNMpEFcM' },
      { id: 'l5_3', title: '멜리스마 (Melisma)', duration: '9분', done: false, youtubeId: 'ZuZNNMpEFcM' },
      { id: 'l5_4', title: '감정 연결과 스토리텔링', duration: '7분', done: false, youtubeId: 'ZuZNNMpEFcM' },
    ],
  },
];

interface LessonPlayerProps {
  lesson: { id: string; title: string; duration: string; done: boolean; youtubeId: string };
  chapterColor: string;
  onClose: () => void;
}

function LessonPlayer({ lesson, chapterColor, onClose }: LessonPlayerProps) {
  const { addXp, markCompleted } = useApp();
  const [watched, setWatched] = useState(false);

  const handleComplete = () => {
    setWatched(true);
    addXp(30);
    markCompleted(lesson.id);
    toast.success(`레슨 완료! +30 XP`);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: 'oklch(0.10 0.03 255)', maxWidth: 390, margin: '0 auto' }}>
      <div className="flex items-center justify-between px-4 pt-12 pb-4">
        <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'oklch(1 0 0 / 10%)' }}>
          <ArrowLeft size={18} className="text-white" />
        </button>
        <h2 className="text-sm font-bold text-white text-center flex-1 px-2">{lesson.title}</h2>
        <div className="w-9" />
      </div>

      <div className="flex-1 px-4 flex flex-col gap-4">
        {/* YouTube Video */}
        <div className="rounded-2xl overflow-hidden aspect-video bg-black">
          <iframe
            src={`https://www.youtube.com/embed/${lesson.youtubeId}?rel=0&modestbranding=1`}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={lesson.title}
          />
        </div>

        <div className="bg-card-gradient rounded-2xl p-4">
          <h3 className="text-base font-bold text-white mb-1">{lesson.title}</h3>
          <p className="text-xs" style={{ color: 'oklch(0.55 0.05 255)' }}>영상 길이: {lesson.duration}</p>
          <p className="text-sm mt-3 leading-relaxed" style={{ color: 'oklch(0.70 0.05 255)' }}>
            이 레슨에서는 보컬 트레이닝의 핵심 기술을 배웁니다. 영상을 끝까지 시청한 후 완료 버튼을 눌러 XP를 획득하세요.
          </p>
        </div>
      </div>

      <div className="px-4 pb-8 pt-4">
        <button
          onClick={handleComplete}
          disabled={watched}
          className="w-full h-14 rounded-2xl flex items-center justify-center gap-3 text-white font-bold text-base transition-all"
          style={{ background: watched ? 'oklch(0.45 0.10 150)' : chapterColor, opacity: watched ? 0.7 : 1 }}
        >
          {watched ? <><CheckCircle2 size={20} /> 완료됨</> : <><Play size={20} /> 레슨 완료 (+30 XP)</>}
        </button>
      </div>
    </div>
  );
}

export default function CurriculumPage() {
  const [, navigate] = useLocation();
  const [expanded, setExpanded] = useState<string | null>('ch1');
  const [selectedLesson, setSelectedLesson] = useState<{ lesson: typeof curriculum[0]['lessons'][0]; color: string } | null>(null);
  const { todayCompleted } = useApp();

  if (selectedLesson) {
    return <LessonPlayer lesson={selectedLesson.lesson} chapterColor={selectedLesson.color} onClose={() => setSelectedLesson(null)} />;
  }

  return (
    <div className="min-h-full pb-4">
      <div className="px-4 pt-12 pb-4 flex items-center gap-3">
        <button onClick={() => navigate('/practice')} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'oklch(1 0 0 / 10%)' }}>
          <ArrowLeft size={18} className="text-white" />
        </button>
        <div>
          <h1 className="text-xl font-black text-white" style={{ fontFamily: 'Nunito, sans-serif' }}>커리큘럼</h1>
          <p className="text-xs" style={{ color: 'oklch(0.55 0.05 255)' }}>체계적인 보컬 트레이닝 과정</p>
        </div>
      </div>

      <div className="px-4 space-y-3">
        {curriculum.map(chapter => {
          const isExpanded = expanded === chapter.id;
          const completedLessons = chapter.lessons.filter(l => todayCompleted.includes(l.id) || l.done).length;
          const progress = Math.round((completedLessons / chapter.lessons.length) * 100);

          return (
            <div key={chapter.id} className="bg-card-gradient rounded-2xl overflow-hidden">
              <button
                onClick={() => {
                  if (!chapter.unlocked) { toast.info('이전 챕터를 완료하면 잠금이 해제됩니다'); return; }
                  setExpanded(isExpanded ? null : chapter.id);
                }}
                className="w-full p-4 flex items-center gap-3 text-left"
              >
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ background: chapter.unlocked ? `${chapter.color}22` : 'oklch(1 0 0 / 5%)', border: `1px solid ${chapter.unlocked ? chapter.color + '44' : 'oklch(1 0 0 / 8%)'}` }}>
                  {chapter.unlocked ? (
                    <span className="text-xl">📚</span>
                  ) : (
                    <Lock size={18} style={{ color: 'oklch(0.45 0.05 255)' }} />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold" style={{ color: chapter.unlocked ? 'white' : 'oklch(0.50 0.05 255)' }}>{chapter.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'oklch(0.50 0.05 255)' }}>{chapter.subtitle}</p>
                  {chapter.unlocked && (
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: 'oklch(1 0 0 / 10%)' }}>
                        <div className="h-full rounded-full" style={{ width: `${progress}%`, background: chapter.color }} />
                      </div>
                      <span className="text-[10px]" style={{ color: 'oklch(0.50 0.05 255)' }}>{completedLessons}/{chapter.lessons.length}</span>
                    </div>
                  )}
                </div>
                {chapter.unlocked && (
                  isExpanded ? <ChevronUp size={16} style={{ color: 'oklch(0.50 0.05 255)' }} /> : <ChevronDown size={16} style={{ color: 'oklch(0.50 0.05 255)' }} />
                )}
              </button>

              {isExpanded && chapter.unlocked && (
                <div className="px-4 pb-4 space-y-2">
                  {chapter.lessons.map((lesson, i) => {
                    const done = todayCompleted.includes(lesson.id) || lesson.done;
                    return (
                      <button
                        key={lesson.id}
                        onClick={() => setSelectedLesson({ lesson, color: chapter.color })}
                        className="w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left"
                        style={{ background: done ? `${chapter.color}15` : 'oklch(1 0 0 / 5%)' }}
                      >
                        <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ background: done ? chapter.color : 'oklch(1 0 0 / 10%)' }}>
                          {done ? <CheckCircle2 size={14} className="text-white" /> : <span className="text-xs font-bold text-white/50">{i + 1}</span>}
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-white">{lesson.title}</p>
                          <p className="text-[10px] mt-0.5" style={{ color: 'oklch(0.50 0.05 255)' }}>{lesson.duration}</p>
                        </div>
                        <Play size={12} style={{ color: chapter.color }} />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
