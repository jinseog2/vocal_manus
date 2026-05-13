import { useState, useCallback } from 'react';
import { useLocation } from 'wouter';
import { ArrowLeft, Play, Pause, ChevronRight, CheckCircle2 } from 'lucide-react';
import { useAudioGuide } from '@/hooks/useAudioGuide';
import { usePitchDetection } from '@/hooks/usePitchDetection';
import { useApp } from '@/contexts/AppContext';
import { toast } from 'sonner';

const warmupExercises = [
  {
    id: 'lip_trill', title: '립 트릴 (Lip Trill)', subtitle: '입술을 떨며 "브르르" 소리 내기',
    duration: 60, icon: '💋', color: '#FF6B6B',
    description: '입술을 가볍게 붙이고 공기를 내보내며 입술을 진동시킵니다. 음정을 올리고 내리며 연습합니다.',
    guideNotes: [60, 62, 64, 65, 67, 65, 64, 62, 60], // C4 scale
  },
  {
    id: 'humming', title: '허밍 (Humming)', subtitle: '"음~" 소리로 공명 찾기',
    duration: 60, icon: '🎵', color: '#74B9FF',
    description: '입을 다물고 "음~" 소리를 내며 코와 머리 쪽의 공명을 느낍니다.',
    guideNotes: [62, 64, 65, 67, 69, 67, 65, 64, 62],
  },
  {
    id: 'vowel_ae', title: '모음 연습 - 아에이오우', subtitle: '5개 모음을 명확하게 발음',
    duration: 90, icon: '🗣️', color: '#A29BFE',
    description: '"아-에-이-오-우" 순서로 각 모음을 길게 발음하며 입 모양을 확인합니다.',
    guideNotes: [60, 64, 67, 64, 60],
  },
  {
    id: 'glottal', title: '글로탈 어택 (Glottal Attack)', subtitle: '성대 접촉 훈련',
    duration: 60, icon: '⚡', color: '#FDCB6E',
    description: '"아!" 하고 짧고 강하게 발음하며 성대를 확실히 닫는 연습입니다.',
    guideNotes: [60, 60, 62, 62, 64, 64, 65, 65, 67],
  },
  {
    id: 'breath_support', title: '호흡 지지 (Breath Support)', subtitle: '복식호흡으로 소리 지탱',
    duration: 120, icon: '💨', color: '#00CEC9',
    description: '배꼽 아래 복부에 힘을 주며 "스~" 소리를 최대한 길게 유지합니다.',
    guideNotes: [60, 67, 72, 67, 60],
  },
  {
    id: 'sirens', title: '사이렌 (Sirens)', subtitle: '전 음역대 글라이딩',
    duration: 90, icon: '🚨', color: '#FF6B6B',
    description: '"위~" 소리로 낮은 음에서 높은 음까지, 다시 낮은 음으로 미끄러지듯 연습합니다.',
    guideNotes: [48, 55, 60, 67, 72, 67, 60, 55, 48],
  },
  {
    id: 'tongue_trill', title: '텅 트릴 (Tongue Trill)', subtitle: '혀를 굴리며 "르르르" 발음',
    duration: 60, icon: '👅', color: '#6C5CE7',
    description: '혀끝을 윗니 뒤에 대고 공기를 내보내며 혀를 진동시킵니다.',
    guideNotes: [60, 62, 64, 67, 64, 62, 60],
  },
  {
    id: 'ng_sound', title: 'NG 사운드', subtitle: '"응~" 소리로 두성 찾기',
    duration: 60, icon: '🔔', color: '#00CEC9',
    description: '"응~" 소리를 내며 코 뒤쪽과 머리 위쪽에서 공명을 느낍니다.',
    guideNotes: [64, 65, 67, 69, 71, 69, 67, 65, 64],
  },
];

interface ExercisePlayerProps {
  exercise: typeof warmupExercises[0];
  onClose: () => void;
}

function ExercisePlayer({ exercise, onClose }: ExercisePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeLeft, setTimeLeft] = useState(exercise.duration);
  const [guideActive, setGuideActive] = useState(false);
  const timerRef = useState<ReturnType<typeof setInterval> | null>(null);
  const { playScale, playReferenceNote } = useAudioGuide();
  const { isListening, currentPitch, volume, startListening, stopListening } = usePitchDetection();
  const { addXp, markCompleted } = useApp();

  const handlePlay = useCallback(async () => {
    if (isPlaying) {
      setIsPlaying(false);
      stopListening();
      if (timerRef[0]) clearInterval(timerRef[0]);
    } else {
      setIsPlaying(true);
      await startListening();
      // Play guide audio
      setGuideActive(true);
      playScale(exercise.guideNotes[0], true, 0.35, 0.05);
      setTimeout(() => setGuideActive(false), exercise.guideNotes.length * 400 + 500);

      const interval = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            clearInterval(interval);
            setIsPlaying(false);
            stopListening();
            addXp(15);
            markCompleted(exercise.id);
            toast.success(`${exercise.title} 완료! +15 XP`);
            return exercise.duration;
          }
          return t - 1;
        });
      }, 1000);
      timerRef[1](interval);
    }
  }, [isPlaying, exercise, playScale, startListening, stopListening, addXp, markCompleted, timerRef]);

  const progress = ((exercise.duration - timeLeft) / exercise.duration) * 100;
  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: 'oklch(0.10 0.03 255)', maxWidth: 390, margin: '0 auto' }}>
      <div className="flex items-center justify-between px-4 pt-12 pb-4">
        <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'oklch(1 0 0 / 10%)' }}>
          <ArrowLeft size={18} className="text-white" />
        </button>
        <h2 className="text-base font-bold text-white">{exercise.title}</h2>
        <div className="w-9" />
      </div>

      <div className="flex-1 px-4 flex flex-col gap-4">
        {/* Exercise Icon & Info */}
        <div className="bg-card-gradient rounded-3xl p-6 flex flex-col items-center gap-3 text-center">
          <span className="text-6xl">{exercise.icon}</span>
          <div>
            <h3 className="text-lg font-black text-white">{exercise.title}</h3>
            <p className="text-sm mt-1" style={{ color: 'oklch(0.60 0.05 255)' }}>{exercise.description}</p>
          </div>
        </div>

        {/* Timer & Progress */}
        <div className="bg-card-gradient rounded-3xl p-5 flex flex-col items-center gap-3">
          <div className="text-4xl font-black text-white" style={{ fontFamily: 'Nunito, sans-serif' }}>
            {formatTime(timeLeft)}
          </div>
          <div className="w-full h-2 rounded-full" style={{ background: 'oklch(1 0 0 / 10%)' }}>
            <div className="h-full progress-bar transition-all duration-1000" style={{ width: `${progress}%` }} />
          </div>
          {guideActive && (
            <div className="flex items-center gap-2 text-xs" style={{ color: 'oklch(0.65 0.18 280)' }}>
              <span className="animate-pulse">♪</span>
              <span>가이드 음 재생 중...</span>
            </div>
          )}
        </div>

        {/* Pitch Display */}
        {isListening && (
          <div className="bg-card-gradient rounded-3xl p-4 flex items-center gap-4">
            <div className="flex-1">
              <p className="text-xs" style={{ color: 'oklch(0.55 0.05 255)' }}>현재 음정</p>
              <p className="text-2xl font-black text-white">
                {currentPitch ? `${currentPitch.note}${currentPitch.octave}` : '-'}
              </p>
              {currentPitch && <p className="text-xs" style={{ color: 'oklch(0.65 0.18 280)' }}>{Math.round(currentPitch.frequency)} Hz</p>}
            </div>
            <div className="w-2 h-20 rounded-full overflow-hidden" style={{ background: 'oklch(1 0 0 / 10%)' }}>
              <div className="w-full rounded-full transition-all duration-75"
                style={{ height: `${volume * 100}%`, marginTop: `${(1 - volume) * 100}%`, background: `linear-gradient(to top, ${exercise.color}, oklch(0.75 0.18 280))` }} />
            </div>
          </div>
        )}

        {/* Guide Notes */}
        <div className="bg-card-gradient rounded-3xl p-4">
          <p className="text-xs font-bold text-white mb-2">가이드 음 시퀀스</p>
          <div className="flex gap-1.5 flex-wrap">
            {exercise.guideNotes.map((midi, i) => {
              const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
              const note = noteNames[midi % 12];
              const oct = Math.floor(midi / 12) - 1;
              return (
                <button key={i} onClick={() => playReferenceNote(midi)}
                  className="px-2 py-1 rounded-lg text-xs font-bold transition-all"
                  style={{ background: `${exercise.color}22`, color: exercise.color, border: `1px solid ${exercise.color}44` }}>
                  {note}{oct}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Play Button */}
      <div className="px-4 pb-8 pt-4">
        <button
          onClick={handlePlay}
          className="w-full h-14 rounded-2xl flex items-center justify-center gap-3 text-white font-bold text-base transition-all"
          style={{ background: isPlaying ? 'oklch(0.50 0.20 25)' : `${exercise.color}`, boxShadow: `0 4px 20px ${exercise.color}44` }}
        >
          {isPlaying ? <><Pause size={20} /> 일시정지</> : <><Play size={20} /> 연습 시작</>}
        </button>
      </div>
    </div>
  );
}

export default function WarmupPage() {
  const [, navigate] = useLocation();
  const [selectedExercise, setSelectedExercise] = useState<typeof warmupExercises[0] | null>(null);
  const { todayCompleted } = useApp();

  if (selectedExercise) {
    return <ExercisePlayer exercise={selectedExercise} onClose={() => setSelectedExercise(null)} />;
  }

  return (
    <div className="min-h-full pb-4">
      <div className="px-4 pt-12 pb-4 flex items-center gap-3">
        <button onClick={() => navigate('/practice')} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'oklch(1 0 0 / 10%)' }}>
          <ArrowLeft size={18} className="text-white" />
        </button>
        <div>
          <h1 className="text-xl font-black text-white" style={{ fontFamily: 'Nunito, sans-serif' }}>워밍업</h1>
          <p className="text-xs" style={{ color: 'oklch(0.55 0.05 255)' }}>발성 전 준비 운동</p>
        </div>
      </div>

      <div className="px-4 space-y-2.5">
        {warmupExercises.map(ex => {
          const done = todayCompleted.includes(ex.id);
          return (
            <button
              key={ex.id}
              onClick={() => setSelectedExercise(ex)}
              className="w-full bg-card-gradient rounded-2xl p-4 flex items-center gap-4 card-hover text-left"
            >
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 text-2xl"
                style={{ background: `${ex.color}22`, border: `1px solid ${ex.color}44` }}>
                {ex.icon}
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-white">{ex.title}</p>
                <p className="text-xs mt-0.5" style={{ color: 'oklch(0.55 0.05 255)' }}>{ex.subtitle}</p>
                <p className="text-xs mt-1" style={{ color: 'oklch(0.45 0.05 255)' }}>{Math.floor(ex.duration / 60)}분 {ex.duration % 60 > 0 ? `${ex.duration % 60}초` : ''}</p>
              </div>
              <div className="flex items-center gap-2">
                {done && <CheckCircle2 size={16} style={{ color: '#00CEC9' }} />}
                <ChevronRight size={14} style={{ color: 'oklch(0.45 0.05 255)' }} />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
