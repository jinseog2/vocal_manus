import { useRef, useEffect, useState, useCallback } from 'react';
import { useLocation } from 'wouter';
import { ArrowLeft, Settings, Mic, Pause, Video, Speaker } from 'lucide-react';
import { usePitchDetection, frequencyToNote } from '@/hooks/usePitchDetection';
import { useAudioGuide } from '@/hooks/useAudioGuide';
import { useApp } from '@/contexts/AppContext';
import { toast } from 'sonner';

const PITCH_BG = 'https://d2xsxph8kpxj0f.cloudfront.net/310419663032506040/2qUj9V5qzb6JP2x9TbX7ue/pitch_bg-TbCGB3yQxppr9dBaeJjo8L.webp';

const NOTE_NAMES_KR: Record<string, string> = {
  'C': '도', 'D': '레', 'E': '미', 'F': '파', 'G': '솔', 'A': '라', 'B': '시',
  'C#': '도#', 'D#': '레#', 'F#': '파#', 'G#': '솔#', 'A#': '라#',
};

type PracticeMode = 'pitch' | 'video' | 'speaker';

export default function PitchModePage() {
  const [, navigate] = useLocation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [mode, setMode] = useState<PracticeMode>('pitch');
  const [isRecording, setIsRecording] = useState(false);
  const [showModeSelect, setShowModeSelect] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { isListening, currentPitch, pitchHistory, error, volume, startListening, stopListening, clearHistory } = usePitchDetection();
  const { playReferenceNote } = useAudioGuide();
  const { addRecording, addXp, markCompleted } = useApp();

  // Draw pitch graph on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    if (pitchHistory.length < 2) return;

    // MIDI range to display: 36 (C2) to 84 (C6)
    const midiMin = 36;
    const midiMax = 84;
    const midiRange = midiMax - midiMin;

    const midiToY = (midi: number) => H - ((midi - midiMin) / midiRange) * H;

    // Draw horizontal note lines (faint)
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 0.5;
    for (let midi = midiMin; midi <= midiMax; midi++) {
      if (midi % 12 === 0) {
        ctx.strokeStyle = 'rgba(255,255,255,0.12)';
        ctx.lineWidth = 1;
      } else {
        ctx.strokeStyle = 'rgba(255,255,255,0.04)';
        ctx.lineWidth = 0.5;
      }
      const y = midiToY(midi);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }

    // Time window: last 8 seconds
    const now = pitchHistory[pitchHistory.length - 1].time;
    const windowSec = 8;
    const visible = pitchHistory.filter(p => p.time >= now - windowSec);
    if (visible.length < 2) return;

    const timeToX = (t: number) => ((t - (now - windowSec)) / windowSec) * W;

    // Draw glow trail
    ctx.shadowBlur = 12;
    ctx.shadowColor = 'oklch(0.70 0.18 280)';
    ctx.strokeStyle = 'rgba(162,155,254,0.8)';
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    ctx.beginPath();
    let started = false;
    for (let i = 0; i < visible.length; i++) {
      const p = visible[i];
      const x = timeToX(p.time);
      const y = midiToY(p.midi);
      if (!started) { ctx.moveTo(x, y); started = true; }
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Draw music note icons along the path
    const noteEmoji = '♪';
    ctx.font = '14px serif';
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    const step = Math.max(1, Math.floor(visible.length / 12));
    for (let i = 0; i < visible.length; i += step) {
      const p = visible[i];
      ctx.fillText(noteEmoji, timeToX(p.time) - 6, midiToY(p.midi) + 5);
    }

    // Current pitch dot
    if (currentPitch) {
      const cx = timeToX(currentPitch.time);
      const cy = midiToY(currentPitch.midi);
      ctx.beginPath();
      ctx.arc(cx, cy, 6, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(162,155,254,1)';
      ctx.shadowBlur = 16;
      ctx.shadowColor = 'rgba(162,155,254,0.8)';
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // Center vertical line
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(W / 2, 0);
    ctx.lineTo(W / 2, H);
    ctx.stroke();
    ctx.setLineDash([]);
  }, [pitchHistory, currentPitch]);

  // Timer
  useEffect(() => {
    if (isListening) {
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isListening]);

  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const handleToggle = useCallback(async () => {
    if (isListening) {
      stopListening();
      if (isRecording && mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }
      if (elapsed > 5) {
        addXp(10);
        markCompleted('tp3');
        toast.success('피치 연습 완료! +10 XP');
      }
    } else {
      setElapsed(0);
      clearHistory();
      await startListening();

      if (mode === 'video') {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: true });
          if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play(); }
          const mr = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp8,opus' });
          chunksRef.current = [];
          mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
          mr.onstop = () => {
            const blob = new Blob(chunksRef.current, { type: 'video/webm' });
            // ✅ P0 수정: base64로 변환하여 영구 저장
            const reader = new FileReader();
            reader.onload = () => {
              addRecording({ id: Date.now().toString(), title: '피치 연습 영상', artist: '나', date: new Date().toISOString(), duration: elapsed, videoData: reader.result as string, mimeType: 'video/webm', type: 'video' });
              toast.success('영상이 My Albums에 저장되었습니다!');
            };
            reader.readAsDataURL(blob);
          };
          mr.start();
          mediaRecorderRef.current = mr;
          setIsRecording(true);
        } catch { toast.error('카메라 접근 권한이 필요합니다'); }
      }
    }
  }, [isListening, mode, elapsed, stopListening, startListening, clearHistory, addXp, markCompleted, addRecording, isRecording]);

  const modeLabels: Record<PracticeMode, string> = { pitch: '피치 모드', video: '영상 모드', speaker: '스피커 모드' };

  return (
    <div className="min-h-full flex flex-col" style={{ backgroundImage: `url(${PITCH_BG})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
      <div className="absolute inset-0" style={{ background: 'oklch(0.10 0.03 255 / 75%)' }} />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-4 pt-12 pb-3">
        <button onClick={() => navigate('/practice')} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'oklch(1 0 0 / 10%)' }}>
          <ArrowLeft size={18} className="text-white" />
        </button>
        <button onClick={() => setShowModeSelect(s => !s)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold text-white" style={{ background: 'oklch(1 0 0 / 15%)', border: '1px solid oklch(1 0 0 / 20%)' }}>
          {modeLabels[mode]} ▾
        </button>
        <button className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'oklch(1 0 0 / 10%)' }}>
          <Settings size={18} className="text-white" />
        </button>
      </div>

      {/* Mode Selector Dropdown */}
      {showModeSelect && (
        <div className="relative z-20 mx-4 rounded-2xl overflow-hidden" style={{ background: 'oklch(0.18 0.04 255 / 95%)', border: '1px solid oklch(1 0 0 / 15%)' }}>
          {([['pitch', '피치 모드', Mic, '#A29BFE'], ['video', '영상 모드', Video, '#74B9FF'], ['speaker', '스피커 모드', Speaker, '#00CEC9']] as const).map(([id, label, Icon, color]) => (
            <button key={id} onClick={() => { setMode(id as PracticeMode); setShowModeSelect(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 transition-colors"
              style={{ background: mode === id ? `${color}22` : 'transparent' }}>
              <Icon size={18} style={{ color }} />
              <span className="text-sm font-semibold text-white">{label}</span>
              {mode === id && <span className="ml-auto text-xs" style={{ color }}>✓</span>}
            </button>
          ))}
        </div>
      )}

      {/* Video Preview (video mode) */}
      {mode === 'video' && (
        <div className="relative z-10 mx-4 mt-2 rounded-2xl overflow-hidden aspect-video bg-black">
          <video ref={videoRef} className="w-full h-full object-cover scale-x-[-1]" muted playsInline />
          {isRecording && (
            <div className="absolute top-2 right-2 flex items-center gap-1.5 px-2 py-1 rounded-full" style={{ background: 'rgba(255,50,50,0.85)' }}>
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              <span className="text-xs font-bold text-white">REC {formatTime(elapsed)}</span>
            </div>
          )}
        </div>
      )}

      {/* Pitch Canvas */}
      <div className="relative z-10 flex-1 mx-4 mt-2 rounded-2xl overflow-hidden pitch-canvas-area" style={{ minHeight: mode === 'video' ? 160 : 320 }}>
        <canvas ref={canvasRef} width={358} height={mode === 'video' ? 160 : 320} className="w-full h-full" />

        {/* Current note display */}
        {currentPitch && (
          <div className="absolute top-3 right-3 text-right">
            <p className="text-3xl font-black text-white text-glow" style={{ fontFamily: 'Nunito, sans-serif' }}>
              {currentPitch.note}{currentPitch.octave}
            </p>
            <p className="text-sm font-bold" style={{ color: 'oklch(0.75 0.18 280)' }}>
              {NOTE_NAMES_KR[currentPitch.note] || currentPitch.note}
            </p>
            <p className="text-xs" style={{ color: 'oklch(0.55 0.05 255)' }}>{Math.round(currentPitch.frequency)} Hz</p>
          </div>
        )}

        {/* Volume bar */}
        <div className="absolute left-3 top-3 bottom-3 w-1.5 rounded-full overflow-hidden" style={{ background: 'oklch(1 0 0 / 10%)' }}>
          <div className="absolute bottom-0 w-full rounded-full transition-all duration-75"
            style={{ height: `${volume * 100}%`, background: 'linear-gradient(to top, oklch(0.60 0.22 280), oklch(0.55 0.18 195))' }} />
        </div>

        {!isListening && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <p className="text-white/60 text-sm font-semibold">마이크 버튼을 눌러 시작하세요</p>
            <p className="text-white/30 text-xs">음정이 음표 궤적으로 표시됩니다</p>
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-red-400 text-sm text-center px-4">{error}</p>
          </div>
        )}
      </div>

      {/* Timer */}
      {isListening && (
        <div className="relative z-10 text-center mt-2">
          <span className="text-white/60 text-sm font-mono">{formatTime(elapsed)}</span>
        </div>
      )}

      {/* Controls */}
      <div className="relative z-10 flex items-center justify-center gap-6 py-6">
        <button onClick={() => { if (currentPitch) playReferenceNote(currentPitch.midi); }}
          className="w-12 h-12 rounded-full flex items-center justify-center text-white/60 text-xs font-bold"
          style={{ background: 'oklch(1 0 0 / 10%)', border: '1px solid oklch(1 0 0 / 15%)' }}>
          기준음
        </button>

        <button
          onClick={handleToggle}
          className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${isListening ? 'mic-active' : ''}`}
          style={{ background: isListening ? 'oklch(0.60 0.22 280)' : 'oklch(0.50 0.20 280)', boxShadow: isListening ? '0 0 24px oklch(0.60 0.22 280 / 60%)' : 'none' }}
        >
          {isListening ? <Pause size={24} className="text-white" /> : <Mic size={24} className="text-white" />}
        </button>

        <button onClick={() => { stopListening(); clearHistory(); setElapsed(0); }}
          className="w-12 h-12 rounded-full flex items-center justify-center text-white/60 text-xs font-bold"
          style={{ background: 'oklch(1 0 0 / 10%)', border: '1px solid oklch(1 0 0 / 15%)' }}>
          초기화
        </button>
      </div>
    </div>
  );
}
