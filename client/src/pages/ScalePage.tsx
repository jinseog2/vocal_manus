import { useState, useCallback, useRef } from 'react';
import { useLocation } from 'wouter';
import { ArrowLeft, Play, Pause, ChevronRight, CheckCircle2, Music } from 'lucide-react';
import { useAudioGuide } from '@/hooks/useAudioGuide';
import { usePitchDetection } from '@/hooks/usePitchDetection';
import { useApp } from '@/contexts/AppContext';
import { toast } from 'sonner';

const KEYS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const KEY_MIDI: Record<string, number> = { C: 60, 'C#': 61, D: 62, 'D#': 63, E: 64, F: 65, 'F#': 66, G: 67, 'G#': 68, A: 69, 'A#': 70, B: 71 };

const scaleExercises = [
  { id: 'major_c', title: 'C장조 스케일', key: 'C', type: 'major' as const, octave: 4, color: '#74B9FF', icon: '🎹', bpm: 80 },
  { id: 'major_g', title: 'G장조 스케일', key: 'G', type: 'major' as const, octave: 3, color: '#A29BFE', icon: '🎵', bpm: 80 },
  { id: 'major_d', title: 'D장조 스케일', key: 'D', type: 'major' as const, octave: 4, color: '#00CEC9', icon: '🎶', bpm: 80 },
  { id: 'minor_a', title: 'A단조 스케일', key: 'A', type: 'minor' as const, octave: 3, color: '#FDCB6E', icon: '🎸', bpm: 80 },
  { id: 'minor_e', title: 'E단조 스케일', key: 'E', type: 'minor' as const, octave: 3, color: '#FF6B6B', icon: '🎺', bpm: 80 },
  { id: 'chromatic', title: '반음계 스케일', key: 'C', type: 'chromatic' as const, octave: 4, color: '#6C5CE7', icon: '🎻', bpm: 60 },
  { id: 'pentatonic', title: '펜타토닉 스케일', key: 'C', type: 'pentatonic' as const, octave: 4, color: '#FF6B6B', icon: '🥁', bpm: 90 },
  { id: 'arpeggio_maj', title: '장3화음 아르페지오', key: 'C', type: 'arpeggio_maj' as const, octave: 4, color: '#74B9FF', icon: '🎷', bpm: 70 },
  { id: 'arpeggio_min', title: '단3화음 아르페지오', key: 'A', type: 'arpeggio_min' as const, octave: 3, color: '#A29BFE', icon: '🎤', bpm: 70 },
  { id: 'octave_jump', title: '옥타브 점프', key: 'C', type: 'octave' as const, octave: 4, color: '#00CEC9', icon: '⬆️', bpm: 60 },
  { id: 'thirds', title: '3도 도약', key: 'C', type: 'thirds' as const, octave: 4, color: '#FDCB6E', icon: '🎼', bpm: 75 },
  { id: 'fifths', title: '5도 도약', key: 'C', type: 'fifths' as const, octave: 4, color: '#FF6B6B', icon: '🎹', bpm: 70 },
];

function getScaleIntervals(type: string): number[] {
  switch (type) {
    case 'major': return [0, 2, 4, 5, 7, 9, 11, 12, 11, 9, 7, 5, 4, 2, 0];
    case 'minor': return [0, 2, 3, 5, 7, 8, 10, 12, 10, 8, 7, 5, 3, 2, 0];
    case 'chromatic': return [0,1,2,3,4,5,6,7,8,9,10,11,12,11,10,9,8,7,6,5,4,3,2,1,0];
    case 'pentatonic': return [0, 2, 4, 7, 9, 12, 9, 7, 4, 2, 0];
    case 'arpeggio_maj': return [0, 4, 7, 12, 7, 4, 0];
    case 'arpeggio_min': return [0, 3, 7, 12, 7, 3, 0];
    case 'octave': return [0, 12, 0, 12, 0];
    case 'thirds': return [0, 4, 2, 6, 4, 8, 5, 9, 7, 11, 9, 12];
    case 'fifths': return [0, 7, 2, 9, 4, 11, 5, 12];
    default: return [0, 2, 4, 5, 7, 9, 11, 12];
  }
}

interface ScalePlayerProps {
  exercise: typeof scaleExercises[0];
  onClose: () => void;
}

function ScalePlayer({ exercise, onClose }: ScalePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedKey, setSelectedKey] = useState(exercise.key);
  const [currentNoteIdx, setCurrentNoteIdx] = useState(-1);
  const [guideActive, setGuideActive] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { playNote, playSuccess } = useAudioGuide();
  const { isListening, currentPitch, volume, startListening, stopListening } = usePitchDetection();
  const { addXp, markCompleted } = useApp();

  const intervals = getScaleIntervals(exercise.type);
  const baseMidi = KEY_MIDI[selectedKey] + (exercise.octave - 4) * 12;
  const noteDuration = 60 / exercise.bpm;

  const handlePlay = useCallback(async () => {
    if (isPlaying) {
      setIsPlaying(false);
      stopListening();
      if (intervalRef.current) clearInterval(intervalRef.current);
      setCurrentNoteIdx(-1);
      setGuideActive(false);
      return;
    }
    setIsPlaying(true);
    setGuideActive(true);
    await startListening();

    let idx = 0;
    setCurrentNoteIdx(0);
    playNote(baseMidi + intervals[0], noteDuration * 0.9);

    intervalRef.current = setInterval(() => {
      idx++;
      if (idx >= intervals.length) {
        clearInterval(intervalRef.current!);
        setIsPlaying(false);
        setCurrentNoteIdx(-1);
        setGuideActive(false);
        stopListening();
        addXp(20);
        markCompleted(exercise.id);
        playSuccess();
        toast.success(`${exercise.title} 완료! +20 XP`);
      } else {
        setCurrentNoteIdx(idx);
        playNote(baseMidi + intervals[idx], noteDuration * 0.9);
      }
    }, noteDuration * 1000);
  }, [isPlaying, exercise, selectedKey, baseMidi, intervals, noteDuration, playNote, playSuccess, startListening, stopListening, addXp, markCompleted]);

  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: 'oklch(0.10 0.03 255)', maxWidth: 390, margin: '0 auto' }}>
      <div className="flex items-center justify-between px-4 pt-12 pb-4">
        <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'oklch(1 0 0 / 10%)' }}>
          <ArrowLeft size={18} className="text-white" />
        </button>
        <h2 className="text-base font-bold text-white">{exercise.title}</h2>
        <div className="w-9" />
      </div>

      <div className="flex-1 px-4 flex flex-col gap-4 overflow-y-auto">
        {/* Key Selector */}
        <div className="bg-card-gradient rounded-2xl p-4">
          <p className="text-xs font-bold text-white mb-3">조성 선택</p>
          <div className="flex gap-1.5 flex-wrap">
            {KEYS.map(k => (
              <button key={k} onClick={() => setSelectedKey(k)}
                className="px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all"
                style={{
                  background: selectedKey === k ? exercise.color : 'oklch(1 0 0 / 8%)',
                  color: selectedKey === k ? 'white' : 'oklch(0.60 0.05 255)',
                }}>
                {k}
              </button>
            ))}
          </div>
        </div>

        {/* Note Sequence Visualizer */}
        <div className="bg-card-gradient rounded-2xl p-4">
          <p className="text-xs font-bold text-white mb-3">음 시퀀스</p>
          <div className="flex gap-1 flex-wrap">
            {intervals.map((interval, i) => {
              const midi = baseMidi + interval;
              const note = noteNames[((midi % 12) + 12) % 12];
              const oct = Math.floor(midi / 12) - 1;
              const isActive = i === currentNoteIdx;
              return (
                <div key={i}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all duration-150"
                  style={{
                    background: isActive ? exercise.color : `${exercise.color}22`,
                    color: isActive ? 'white' : exercise.color,
                    transform: isActive ? 'scale(1.2)' : 'scale(1)',
                    boxShadow: isActive ? `0 0 12px ${exercise.color}80` : 'none',
                  }}>
                  {note}
                </div>
              );
            })}
          </div>
          {guideActive && (
            <p className="text-xs mt-2 animate-pulse" style={{ color: exercise.color }}>♪ 가이드 음 재생 중...</p>
          )}
        </div>

        {/* Pitch Feedback */}
        {isListening && (
          <div className="bg-card-gradient rounded-2xl p-4 flex items-center gap-4">
            <div className="flex-1">
              <p className="text-xs" style={{ color: 'oklch(0.55 0.05 255)' }}>내 음정</p>
              <p className="text-3xl font-black text-white">{currentPitch ? `${currentPitch.note}${currentPitch.octave}` : '-'}</p>
              {currentPitch && (
                <p className="text-xs mt-0.5" style={{ color: exercise.color }}>{Math.round(currentPitch.frequency)} Hz</p>
              )}
            </div>
            <div className="w-2 h-16 rounded-full overflow-hidden" style={{ background: 'oklch(1 0 0 / 10%)' }}>
              <div className="w-full rounded-full transition-all duration-75"
                style={{ height: `${volume * 100}%`, marginTop: `${(1 - volume) * 100}%`, background: exercise.color }} />
            </div>
          </div>
        )}

        {/* BPM Info */}
        <div className="bg-card-gradient rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs" style={{ color: 'oklch(0.55 0.05 255)' }}>템포</p>
            <p className="text-lg font-black text-white">{exercise.bpm} BPM</p>
          </div>
          <div>
            <p className="text-xs" style={{ color: 'oklch(0.55 0.05 255)' }}>음 개수</p>
            <p className="text-lg font-black text-white">{intervals.length}음</p>
          </div>
          <div>
            <p className="text-xs" style={{ color: 'oklch(0.55 0.05 255)' }}>조성</p>
            <p className="text-lg font-black text-white">{selectedKey}</p>
          </div>
        </div>
      </div>

      <div className="px-4 pb-8 pt-4">
        <button onClick={handlePlay}
          className="w-full h-14 rounded-2xl flex items-center justify-center gap-3 text-white font-bold text-base"
          style={{ background: isPlaying ? 'oklch(0.50 0.20 25)' : exercise.color, boxShadow: `0 4px 20px ${exercise.color}44` }}>
          {isPlaying ? <><Pause size={20} /> 정지</> : <><Play size={20} /> 스케일 시작</>}
        </button>
      </div>
    </div>
  );
}

export default function ScalePage() {
  const [, navigate] = useLocation();
  const [selected, setSelected] = useState<typeof scaleExercises[0] | null>(null);
  const { todayCompleted } = useApp();

  if (selected) return <ScalePlayer exercise={selected} onClose={() => setSelected(null)} />;

  return (
    <div className="min-h-full pb-4">
      <div className="px-4 pt-12 pb-4 flex items-center gap-3">
        <button onClick={() => navigate('/practice')} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'oklch(1 0 0 / 10%)' }}>
          <ArrowLeft size={18} className="text-white" />
        </button>
        <div>
          <h1 className="text-xl font-black text-white" style={{ fontFamily: 'Nunito, sans-serif' }}>스케일 연습</h1>
          <p className="text-xs" style={{ color: 'oklch(0.55 0.05 255)' }}>음계 훈련으로 음정 정확도 향상</p>
        </div>
      </div>
      <div className="px-4 space-y-2.5">
        {scaleExercises.map(ex => {
          const done = todayCompleted.includes(ex.id);
          return (
            <button key={ex.id} onClick={() => setSelected(ex)}
              className="w-full bg-card-gradient rounded-2xl p-4 flex items-center gap-4 card-hover text-left">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 text-2xl"
                style={{ background: `${ex.color}22`, border: `1px solid ${ex.color}44` }}>
                {ex.icon}
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-white">{ex.title}</p>
                <p className="text-xs mt-0.5" style={{ color: 'oklch(0.55 0.05 255)' }}>{ex.key}조 · {ex.bpm} BPM</p>
              </div>
              <div className="flex items-center gap-2">
                {done && <CheckCircle2 size={16} style={{ color: '#00CEC9' }} />}
                <Music size={12} style={{ color: ex.color }} />
                <ChevronRight size={14} style={{ color: 'oklch(0.45 0.05 255)' }} />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
