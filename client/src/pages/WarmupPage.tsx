/**
 * WarmupPage - VocalUp 원본 기준 재구현
 * Design: 다크 배경 + 대기화면(3초 카운트다운) → 비디오 플레이어(원형 호흡 카운트다운)
 * Flow: 목록 → 대기화면(설명+카운트다운) → 플레이어(텍스트+애니메이션 강사)
 */
import { useState, useCallback, useRef, useEffect } from 'react';
import { useLocation } from 'wouter';
import { ArrowLeft, Play, Pause, SkipBack, SkipForward, RotateCcw, CheckCircle2 } from 'lucide-react';
import { useAudioGuide } from '@/hooks/useAudioGuide';
import { usePitchDetection } from '@/hooks/usePitchDetection';
import { useApp } from '@/contexts/AppContext';
import { toast } from 'sonner';

// 워밍업 훈련 목록 (원본 앱 기준)
const warmupExercises = [
  {
    id: 'hissing_breath',
    title: '4-4-8 히싱 호흡',
    subtitle: '호흡 조절 & 폐활량 강화',
    duration: 48,
    icon: '💨',
    color: '#4A90D9',
    description: '4초 동안 들이쉬고, 4초 멈춘 후, 스~~~ 소리를 내며 8초 동안 천천히 내쉬세요.',
    breathPattern: { inhale: 4, hold: 4, exhale: 8 },
    guideNotes: [60, 67, 72, 67, 60],
    steps: [
      { phase: 'inhale', label: 'Breathe in', count: 4, color: '#4A90D9' },
      { phase: 'hold', label: 'Hold', count: 4, color: '#A29BFE' },
      { phase: 'exhale', label: 'Breathe out', count: 8, color: '#00CEC9' },
    ],
  },
  {
    id: 'lip_trill',
    title: '립 트릴',
    subtitle: '입술 진동으로 발성 준비',
    duration: 60,
    icon: '💋',
    color: '#FF6B6B',
    description: '입술을 가볍게 붙이고 공기를 내보내며 입술을 진동시킵니다. 음정을 올리고 내리며 연습합니다.',
    breathPattern: null,
    guideNotes: [60, 62, 64, 65, 67, 65, 64, 62, 60],
    steps: null,
  },
  {
    id: 'humming',
    title: '허밍',
    subtitle: '"음~" 소리로 공명 찾기',
    duration: 60,
    icon: '🎵',
    color: '#74B9FF',
    description: '입을 다물고 "음~" 소리를 내며 코와 머리 쪽의 공명을 느낍니다.',
    breathPattern: null,
    guideNotes: [62, 64, 65, 67, 69, 67, 65, 64, 62],
    steps: null,
  },
  {
    id: 'sirens',
    title: '사이렌',
    subtitle: '전 음역대 글라이딩',
    duration: 90,
    icon: '🚨',
    color: '#FDCB6E',
    description: '"위~" 소리로 낮은 음에서 높은 음까지, 다시 낮은 음으로 미끄러지듯 연습합니다.',
    breathPattern: null,
    guideNotes: [48, 55, 60, 67, 72, 67, 60, 55, 48],
    steps: null,
  },
  {
    id: 'ng_sound',
    title: 'NG 사운드',
    subtitle: '"응~" 소리로 두성 찾기',
    duration: 60,
    icon: '🔔',
    color: '#A29BFE',
    description: '"응~" 소리를 내며 코 뒤쪽과 머리 위쪽에서 공명을 느낍니다.',
    breathPattern: null,
    guideNotes: [64, 65, 67, 69, 71, 69, 67, 65, 64],
    steps: null,
  },
  {
    id: 'vowel_ae',
    title: '모음 연습',
    subtitle: '아에이오우 명확하게 발음',
    duration: 90,
    icon: '🗣️',
    color: '#00CEC9',
    description: '"아-에-이-오-우" 순서로 각 모음을 길게 발음하며 입 모양을 확인합니다.',
    breathPattern: null,
    guideNotes: [60, 64, 67, 64, 60],
    steps: null,
  },
  {
    id: 'tongue_trill',
    title: '텅 트릴',
    subtitle: '혀를 굴리며 "르르르" 발음',
    duration: 60,
    icon: '👅',
    color: '#6C5CE7',
    description: '혀끝을 윗니 뒤에 대고 공기를 내보내며 혀를 진동시킵니다.',
    breathPattern: null,
    guideNotes: [60, 62, 64, 67, 64, 62, 60],
    steps: null,
  },
  {
    id: 'breath_support',
    title: '호흡 지지',
    subtitle: '복식호흡으로 소리 지탱',
    duration: 120,
    icon: '🌬️',
    color: '#55EFC4',
    description: '배꼽 아래 복부에 힘을 주며 "스~" 소리를 최대한 길게 유지합니다.',
    breathPattern: null,
    guideNotes: [60, 67, 72, 67, 60],
    steps: null,
  },
  {
    id: 'vocal_cord_contraction',
    title: '성대 조이기',
    subtitle: '성대 수축 근육 강화 훈련',
    duration: 90,
    icon: '🎙️',
    color: '#E17055',
    description: '목을 크게 열고 "놀(Knoll)" 발음으로 높은 음에서 낮은 음까지 부드럽게 글라이딩합니다. 성대 마찰음(Glottal Fry)이 나지 않도록 무리하지 마세요.',
    breathPattern: null,
    guideNotes: [76, 74, 72, 69, 67, 64, 60, 57, 53],
    steps: null,
    glide: true,
    glideSteps: [
      { label: '목을 크게 열기', desc: 'Big open throat — 목 안쪽을 넓게 열어주세요', duration: 3, color: '#E17055' },
      { label: '입술 살짝 닿기', desc: '입술을 아주 살짝만 붙여 진동이 느껴지도록 준비합니다', duration: 3, color: '#FDCB6E' },
      { label: '높은 음 준비', desc: '편안하게 낼 수 있는 높은 음을 찾아주세요 (최고음은 피하기)', duration: 4, color: '#A29BFE' },
      { label: '"놀" 글라이딩', desc: '"놀(Knoll)" 발음으로 높은 음 → 낮은 음까지 한 호흡에 부드럽게 내려오세요', duration: 8, color: '#00CEC9' },
      { label: '쉬기', desc: '잠시 쉬고 다시 반복합니다. 음이탈은 정상이에요!', duration: 3, color: '#55EFC4' },
    ],
  },
];

type Exercise = typeof warmupExercises[0];
type ViewState = 'list' | 'ready' | 'player';

// ─── 대기 화면 ───────────────────────────────────────────────
interface ReadyScreenProps {
  exercise: Exercise;
  onStart: () => void;
  onOther: () => void;
}

function ReadyScreen({ exercise, onStart, onOther }: ReadyScreenProps) {
  const [countdown, setCountdown] = useState(3);
  const [autoStarting, setAutoStarting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // 3초 카운트다운 후 자동 시작
    setAutoStarting(true);
    timerRef.current = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          clearInterval(timerRef.current!);
          timerRef.current = null;
          onStart();
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [onStart]);

  const handleManualStart = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    onStart();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center px-6"
      style={{ background: '#1A1A24', maxWidth: 390, margin: '0 auto' }}>

      {/* 비디오 플레이스홀더 */}
      <div className="w-full aspect-video rounded-2xl mb-6 flex flex-col items-center justify-center"
        style={{ background: '#2A2A35', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="text-5xl mb-2">{exercise.icon}</div>
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>VIDEO</p>
      </div>

      {/* 훈련 제목 + 설명 */}
      <h2 className="text-xl font-black text-white text-center mb-2" style={{ fontFamily: 'Nunito, sans-serif' }}>
        {exercise.title}
      </h2>
      <p className="text-sm text-center mb-8" style={{ color: 'rgba(255,255,255,0.55)', lineHeight: 1.6 }}>
        {exercise.description}
      </p>

      {/* 버튼 2개 */}
      <div className="w-full space-y-3">
        <button onClick={handleManualStart}
          className="w-full h-12 rounded-2xl flex items-center justify-center gap-2 text-white font-bold text-sm transition-all active:scale-[0.97]"
          style={{ background: '#4A90D9' }}>
          <Play size={16} />
          바로 시작
        </button>
        <button onClick={onOther}
          className="w-full h-12 rounded-2xl flex items-center justify-center gap-2 font-bold text-sm transition-all active:scale-[0.97]"
          style={{ background: '#2A2A35', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }}>
          <RotateCcw size={16} />
          다른 트레이닝
        </button>
      </div>

      {/* 원형 카운트다운 */}
      {autoStarting && countdown > 0 && (
        <div className="mt-6 flex flex-col items-center gap-1">
          <div className="relative w-14 h-14">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 56 56">
              <circle cx="28" cy="28" r="24" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
              <circle cx="28" cy="28" r="24" fill="none" stroke="#4A90D9" strokeWidth="3"
                strokeDasharray={`${2 * Math.PI * 24}`}
                strokeDashoffset={`${2 * Math.PI * 24 * (1 - countdown / 3)}`}
                style={{ transition: 'stroke-dashoffset 0.9s linear' }} />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-xl font-black text-white">{countdown}</span>
          </div>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>초 후 자동 시작</p>
        </div>
      )}
    </div>
  );
}

// ─── 호흡 단계 원형 카운트다운 ───────────────────────────────
interface BreathCircleProps {
  phase: string;
  label: string;
  count: number;
  color: string;
  totalCount: number;
}

function BreathCircle({ phase, label, count, color, totalCount }: BreathCircleProps) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const progress = count / totalCount;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-36 h-36">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
          <circle cx="60" cy="60" r={radius} fill="none" stroke={color} strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - progress)}
            style={{ transition: 'stroke-dashoffset 0.9s linear' }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-black" style={{ color, fontFamily: 'Nunito, sans-serif' }}>{count}</span>
        </div>
      </div>
      <p className="text-base font-bold text-white">{label}</p>
    </div>
  );
}

// ─── 성대 조이기 글라이딩 UI ─────────────────────────────────
interface GlideStepDisplayProps {
  step: { label: string; desc: string; duration: number; color: string };
  stepIndex: number;
  totalSteps: number;
  timeLeft: number;
  pitchNote: string | null;
  pitchFreq: number | null;
  volume: number;
}

function GlideStepDisplay({ step, stepIndex, totalSteps, timeLeft, pitchNote, pitchFreq, volume }: GlideStepDisplayProps) {
  const progress = timeLeft / step.duration;
  const circumference = 2 * Math.PI * 52;

  return (
    <div className="flex flex-col items-center gap-5 w-full">
      {/* 단계 표시 */}
      <div className="flex gap-2">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div key={i} className="h-1.5 rounded-full transition-all duration-300"
            style={{
              width: i === stepIndex ? 24 : 8,
              background: i === stepIndex ? step.color : 'rgba(255,255,255,0.15)',
            }} />
        ))}
      </div>

      {/* 원형 카운트다운 + 음파 */}
      <div className="relative w-44 h-44 flex items-center justify-center">
        {/* 음량 파동 */}
        {[1, 2, 3].map(i => (
          <div key={i} className="absolute rounded-full"
            style={{
              width: `${90 + i * 20 * volume}px`,
              height: `${90 + i * 20 * volume}px`,
              background: `${step.color}${(10 - i * 3).toString(16).padStart(2, '0')}`,
              border: `1px solid ${step.color}25`,
              transition: 'all 0.1s ease',
            }} />
        ))}
        {/* SVG 원형 진행 */}
        <svg className="absolute w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="5" />
          <circle cx="60" cy="60" r="52" fill="none" stroke={step.color} strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - progress)}
            style={{ transition: 'stroke-dashoffset 0.9s linear' }} />
        </svg>
        {/* 중앙 내용 */}
        <div className="relative z-10 flex flex-col items-center gap-1">
          <span className="text-5xl font-black" style={{ color: step.color, fontFamily: 'Nunito, sans-serif' }}>
            {timeLeft}
          </span>
          {pitchNote && (
            <div className="text-center">
              <p className="text-lg font-black text-white">{pitchNote}</p>
              {pitchFreq && <p className="text-xs" style={{ color: step.color }}>{Math.round(pitchFreq)} Hz</p>}
            </div>
          )}
        </div>
      </div>

      {/* 단계 라벨 + 설명 */}
      <div className="text-center px-4">
        <p className="text-xl font-black text-white mb-1" style={{ fontFamily: 'Nunito, sans-serif' }}>
          {step.label}
        </p>
        <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>
          {step.desc}
        </p>
      </div>

      {/* 글라이딩 화살표 (4번째 단계: 글라이딩) */}
      {stepIndex === 3 && (
        <div className="flex items-center gap-3 px-6 py-3 rounded-2xl"
          style={{ background: 'rgba(0,206,201,0.12)', border: '1px solid rgba(0,206,201,0.25)' }}>
          <span className="text-2xl">🎙️</span>
          <div>
            <p className="text-xs font-bold" style={{ color: '#00CEC9' }}>"놀(Knoll)" 발음</p>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>높은 음 ↓ 낮은 음 · 한 호흡으로</p>
          </div>
          <div className="ml-auto text-2xl">↘️</div>
        </div>
      )}

      {/* 주의사항 배너 */}
      {stepIndex === 3 && (
        <div className="flex items-start gap-2 px-4 py-2 rounded-xl w-full"
          style={{ background: 'rgba(253,203,110,0.1)', border: '1px solid rgba(253,203,110,0.2)' }}>
          <span className="text-sm">⚠️</span>
          <p className="text-xs" style={{ color: 'rgba(253,203,110,0.9)' }}>
            너무 낮은 음까지 무리하지 마세요. 음이탈은 정상입니다!
          </p>
        </div>
      )}
    </div>
  );
}

// ─── 플레이어 화면 ────────────────────────────────────────────
interface PlayerScreenProps {
  exercises: Exercise[];
  initialIndex: number;
  onClose: () => void;
}

function PlayerScreen({ exercises, initialIndex, onClose }: PlayerScreenProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeLeft, setTimeLeft] = useState(exercises[initialIndex].duration);
  const [completed, setCompleted] = useState(false);

  // 호흡 패턴 상태
  const [breathPhaseIdx, setBreathPhaseIdx] = useState(0);
  const [breathCount, setBreathCount] = useState(0);

  // 성대 조이기 글라이딩 단계 상태
  const [glideStepIdx, setGlideStepIdx] = useState(0);
  const [glideStepTimeLeft, setGlideStepTimeLeft] = useState(0);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const breathTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const guideIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const glideTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { playNoteSequence } = useAudioGuide();
  const { isListening, currentPitch, volume, startListening, stopListening } = usePitchDetection();
  const { addXp, markCompleted } = useApp();

  const exercise = exercises[currentIndex];

  // 운동 변경 시 상태 리셋
  useEffect(() => {
    stopAll();
    setTimeLeft(exercise.duration);
    setCompleted(false);
    setBreathPhaseIdx(0);
    setBreathCount(exercise.steps?.[0]?.count ?? 0);
    setIsPlaying(false);
  }, [currentIndex]);

  useEffect(() => {
    return () => stopAll();
  }, []);

  const stopAll = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (breathTimerRef.current) { clearInterval(breathTimerRef.current); breathTimerRef.current = null; }
    if (guideIntervalRef.current) { clearInterval(guideIntervalRef.current); guideIntervalRef.current = null; }
    if (glideTimerRef.current) { clearInterval(glideTimerRef.current); glideTimerRef.current = null; }
    stopListening();
  }, [stopListening]);

  // 성대 조이기 글라이딩 단계 루프
  const startGlideLoop = useCallback(() => {
    const glideSteps = (exercise as any).glideSteps;
    if (!glideSteps) return;
    let stepIdx = 0;
    let stepTime = glideSteps[0].duration;
    setGlideStepIdx(0);
    setGlideStepTimeLeft(glideSteps[0].duration);

    glideTimerRef.current = setInterval(() => {
      stepTime -= 1;
      if (stepTime <= 0) {
        stepIdx = (stepIdx + 1) % glideSteps.length;
        stepTime = glideSteps[stepIdx].duration;
        setGlideStepIdx(stepIdx);
        // 글라이딩 단계(4번째)에서 가이드 음 재생
        if (stepIdx === 3) {
          playNoteSequence((exercise as any).guideNotes, 0.5, 0.08);
        }
      }
      setGlideStepTimeLeft(stepTime);
    }, 1000);
  }, [exercise, playNoteSequence]);

  // 호흡 패턴 루프 시작
  const startBreathLoop = useCallback(() => {
    if (!exercise.steps) return;
    let phaseIdx = 0;
    let count = exercise.steps[0].count;
    setBreathPhaseIdx(0);
    setBreathCount(exercise.steps[0].count);

    breathTimerRef.current = setInterval(() => {
      count -= 1;
      if (count <= 0) {
        phaseIdx = (phaseIdx + 1) % exercise.steps!.length;
        count = exercise.steps![phaseIdx].count;
      }
      setBreathPhaseIdx(phaseIdx);
      setBreathCount(count);
    }, 1000);
  }, [exercise]);

  // 가이드 음 루프
  const startGuideLoop = useCallback(() => {
    const noteDuration = 0.38;
    const gap = 0.05;
    const totalMs = (noteDuration + gap) * exercise.guideNotes.length * 1000 + 600;
    playNoteSequence(exercise.guideNotes, noteDuration, gap);
    guideIntervalRef.current = setInterval(() => {
      playNoteSequence(exercise.guideNotes, noteDuration, gap);
    }, totalMs);
  }, [exercise, playNoteSequence]);

  const handlePlay = useCallback(async () => {
    if (isPlaying) {
      stopAll();
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      await startListening();
      const isGlide = !!(exercise as any).glide;
      if (isGlide) {
        startGlideLoop();
      } else {
        startGuideLoop();
        if (exercise.steps) startBreathLoop();
      }

      timerRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            stopAll();
            setIsPlaying(false);
            setCompleted(true);
            addXp(20);
            markCompleted(exercise.id);
            toast.success(`${exercise.title} 완료! +20 XP 🎉`);
            setTimeout(() => {
              if (currentIndex < exercises.length - 1) {
                setCurrentIndex(i => i + 1);
              } else {
                onClose();
              }
            }, 2000);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
  }, [isPlaying, exercise, currentIndex, exercises.length, startListening, startGuideLoop, startBreathLoop, startGlideLoop, stopAll, addXp, markCompleted, onClose]);

  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  const progress = ((exercise.duration - timeLeft) / exercise.duration) * 100;

  const currentStep = exercise.steps?.[breathPhaseIdx];

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: '#111118', maxWidth: 390, margin: '0 auto' }}>

      {/* 상단 진행 바 */}
      <div className="h-1 w-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
        <div className="h-full transition-all duration-1000" style={{ width: `${progress}%`, background: '#4A90D9' }} />
      </div>

      {/* 상단 네비게이션 */}
      <div className="flex items-center justify-between px-4 pt-10 pb-2">
        <button onClick={() => { stopAll(); onClose(); }}
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.1)' }}>
          <ArrowLeft size={18} className="text-white" />
        </button>
        <div className="text-center">
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{currentIndex + 1} / {exercises.length}</p>
        </div>
        <button
          onClick={() => { stopAll(); setCurrentIndex(i => Math.min(i + 1, exercises.length - 1)); }}
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.1)' }}>
          <SkipForward size={16} className="text-white" />
        </button>
      </div>

      {/* 메인 콘텐츠 영역 */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6">

        {completed ? (
          <div className="flex flex-col items-center gap-4">
            <CheckCircle2 size={64} style={{ color: '#00CEC9' }} />
            <p className="text-2xl font-black text-white">완료! +20 XP</p>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>잠시 후 다음 훈련으로 이동합니다...</p>
          </div>
        ) : (
          <>
            {/* 성대 조이기 글라이딩 단계 UI */}
            {(exercise as any).glide && isPlaying ? (
              <GlideStepDisplay
                step={(exercise as any).glideSteps[glideStepIdx]}
                stepIndex={glideStepIdx}
                totalSteps={(exercise as any).glideSteps.length}
                timeLeft={glideStepTimeLeft}
                pitchNote={currentPitch ? `${currentPitch.note}${currentPitch.octave}` : null}
                pitchFreq={currentPitch?.frequency ?? null}
                volume={volume}
              />
            ) : exercise.steps && isPlaying && currentStep ? (
              /* 호흡 패턴이 있는 경우: 원형 카운트다운 */
              <BreathCircle
                phase={currentStep.phase}
                label={currentStep.label}
                count={breathCount}
                color={currentStep.color}
                totalCount={currentStep.count}
              />
            ) : (
              /* 일반 운동: 아이콘 + 피치 표시 */
              <div className="flex flex-col items-center gap-4">
                {/* 아이콘 + 음파 애니메이션 */}
                <div className="relative w-40 h-40 flex items-center justify-center">
                  {/* 배경 파동 */}
                  {isPlaying && [1, 2, 3].map(i => (
                    <div key={i} className="absolute rounded-full"
                      style={{
                        width: `${80 + i * 25 * volume}px`,
                        height: `${80 + i * 25 * volume}px`,
                        background: `${exercise.color}${Math.round(15 - i * 4).toString(16).padStart(2, '0')}`,
                        border: `1px solid ${exercise.color}30`,
                        transition: 'all 0.1s ease',
                      }} />
                  ))}
                  <div className="relative z-10 w-20 h-20 rounded-full flex items-center justify-center text-4xl"
                    style={{ background: `${exercise.color}25`, border: `2px solid ${exercise.color}60` }}>
                    {exercise.icon}
                  </div>
                </div>

                {/* 현재 음정 표시 */}
                {isListening && (
                  <div className="text-center">
                    <p className="text-3xl font-black text-white" style={{ fontFamily: 'Nunito, sans-serif' }}>
                      {currentPitch ? `${currentPitch.note}${currentPitch.octave}` : '—'}
                    </p>
                    {currentPitch && (
                      <p className="text-xs mt-1" style={{ color: exercise.color }}>
                        {Math.round(currentPitch.frequency)} Hz
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* 하단 오버레이 */}
      <div className="px-4 pb-8 pt-4" style={{ background: 'linear-gradient(to top, #111118, transparent)' }}>
        {/* 훈련명 + 지시문 */}
        <div className="text-center mb-4">
          <p className="text-base font-black text-white">{exercise.title}</p>
          <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>{exercise.description.slice(0, 50)}...</p>
        </div>

        {/* 메인 타이머 */}
        <div className="text-center mb-4">
          <span className="text-5xl font-black text-white" style={{ fontFamily: 'Nunito, sans-serif', letterSpacing: '-2px' }}>
            {formatTime(timeLeft)}
          </span>
        </div>

        {/* 컨트롤 버튼 */}
        <div className="flex items-center justify-center gap-6">
          <button
            onClick={() => { stopAll(); setCurrentIndex(i => Math.max(i - 1, 0)); }}
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.1)' }}>
            <SkipBack size={20} className="text-white" />
          </button>

          <button
            onClick={handlePlay}
            disabled={completed}
            className="w-16 h-16 rounded-full flex items-center justify-center transition-all active:scale-[0.95]"
            style={{ background: exercise.color, boxShadow: `0 4px 20px ${exercise.color}60` }}>
            {isPlaying
              ? <Pause size={24} className="text-white" />
              : <Play size={24} className="text-white ml-0.5" />}
          </button>

          <button
            onClick={() => { stopAll(); setCurrentIndex(i => Math.min(i + 1, exercises.length - 1)); }}
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.1)' }}>
            <SkipForward size={20} className="text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── 메인 페이지 ──────────────────────────────────────────────
export default function WarmupPage() {
  const [, navigate] = useLocation();
  const [view, setView] = useState<ViewState>('list');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { todayCompleted } = useApp();

  const handleSelectExercise = (index: number) => {
    setSelectedIndex(index);
    setView('ready');
  };

  const handleStartPlayer = useCallback(() => {
    setView('player');
  }, []);

  const handleOtherTraining = useCallback(() => {
    // 랜덤으로 다른 훈련 선택
    const otherIndices = warmupExercises.map((_, i) => i).filter(i => i !== selectedIndex);
    const randomIdx = otherIndices[Math.floor(Math.random() * otherIndices.length)];
    setSelectedIndex(randomIdx);
  }, [selectedIndex]);

  if (view === 'ready') {
    return (
      <ReadyScreen
        exercise={warmupExercises[selectedIndex]}
        onStart={handleStartPlayer}
        onOther={handleOtherTraining}
      />
    );
  }

  if (view === 'player') {
    return (
      <PlayerScreen
        exercises={warmupExercises}
        initialIndex={selectedIndex}
        onClose={() => setView('list')}
      />
    );
  }

  // 목록 화면
  return (
    <div className="min-h-full pb-4" style={{ background: '#1A1A24' }}>
      <div className="px-4 pt-12 pb-4 flex items-center gap-3">
        <button onClick={() => navigate('/practice')}
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.1)' }}>
          <ArrowLeft size={18} className="text-white" />
        </button>
        <div>
          <h1 className="text-xl font-black text-white" style={{ fontFamily: 'Nunito, sans-serif' }}>워밍업</h1>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>발성 전 준비 운동</p>
        </div>
      </div>

      <div className="px-4 space-y-2.5">
        {warmupExercises.map((ex, index) => {
          const done = todayCompleted.includes(ex.id);
          return (
            <button
              key={ex.id}
              onClick={() => handleSelectExercise(index)}
              className="w-full rounded-2xl p-4 flex items-center gap-4 card-hover text-left transition-all active:scale-[0.98]"
              style={{ background: '#2A2A35' }}
            >
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 text-2xl"
                style={{ background: `${ex.color}20`, border: `1px solid ${ex.color}40` }}>
                {ex.icon}
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-white">{ex.title}</p>
                <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>{ex.subtitle}</p>
                <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  {Math.floor(ex.duration / 60) > 0 ? `${Math.floor(ex.duration / 60)}분 ` : ''}
                  {ex.duration % 60 > 0 ? `${ex.duration % 60}초` : ''}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {done && <CheckCircle2 size={16} style={{ color: '#00CEC9' }} />}
                <div className="w-7 h-7 rounded-full flex items-center justify-center"
                  style={{ background: `${ex.color}20` }}>
                  <Play size={12} style={{ color: ex.color }} className="ml-0.5" />
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
