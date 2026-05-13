import { useState, useRef, useCallback, useEffect } from 'react';
import { useLocation, useParams } from 'wouter';
import { ArrowLeft, Mic, Pause, Video, Heart, Camera, Square } from 'lucide-react';
import { usePitchDetection } from '@/hooks/usePitchDetection';
import { useApp } from '@/contexts/AppContext';
import { toast } from 'sonner';

const songList: Record<string, { id: string; title: string; artist: string; youtubeId: string; key: string; bpm: number; difficulty: string }> = {
  '1': { id: '1', title: '봄날', artist: 'BTS', youtubeId: 'xEeFrLSkMm8', key: 'F#m', bpm: 76, difficulty: '중급' },
  '2': { id: '2', title: '밤편지', artist: 'IU', youtubeId: 'BzYnNdJhZQw', key: 'Db', bpm: 72, difficulty: '초급' },
  '3': { id: '3', title: 'Dynamite', artist: 'BTS', youtubeId: 'gdZLi9oWNZg', key: 'B', bpm: 114, difficulty: '중급' },
  '4': { id: '4', title: 'Celebrity', artist: 'IU', youtubeId: 'lCqBMFQwHKk', key: 'G', bpm: 100, difficulty: '중급' },
  '5': { id: '5', title: 'Lilac', artist: 'IU', youtubeId: 'D1PvIWdJ8xo', key: 'Bb', bpm: 115, difficulty: '중급' },
  '6': { id: '6', title: 'Love poem', artist: 'IU', youtubeId: 'A-MjGnpCbqM', key: 'Db', bpm: 68, difficulty: '초급' },
  '7': { id: '7', title: 'Butter', artist: 'BTS', youtubeId: 'WMweEpGlu_U', key: 'G', bpm: 110, difficulty: '중급' },
  '8': { id: '8', title: 'Permission to Dance', artist: 'BTS', youtubeId: 'CuklIb9d3fI', key: 'C', bpm: 124, difficulty: '초급' },
  '9': { id: '9', title: 'INVU', artist: '태연', youtubeId: 'UBURTj20HXI', key: 'Fm', bpm: 110, difficulty: '고급' },
  '10': { id: '10', title: '그대라는 시', artist: '에릭남 & 웬디', youtubeId: 'Xyj_LFX0tTU', key: 'C', bpm: 80, difficulty: '초급' },
};

type PracticeMode = 'pitch' | 'video' | 'audio';

export default function SongPracticePage() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const song = songList[params.id || '1'];

  const [mode, setMode] = useState<PracticeMode>('pitch');
  const [isRecording, setIsRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [isFav, setIsFav] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { isListening, currentPitch, pitchHistory, volume, startListening, stopListening } = usePitchDetection();
  const { addRecording, addXp, earnBadge } = useApp();

  // Draw pitch graph
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || mode !== 'pitch') return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    if (pitchHistory.length < 2) return;

    const midiMin = 36, midiMax = 84;
    const midiToY = (m: number) => H - ((m - midiMin) / (midiMax - midiMin)) * H;
    const now = pitchHistory[pitchHistory.length - 1].time;
    const visible = pitchHistory.filter(p => p.time >= now - 6);
    if (visible.length < 2) return;
    const timeToX = (t: number) => ((t - (now - 6)) / 6) * W;

    ctx.strokeStyle = 'rgba(162,155,254,0.85)';
    ctx.lineWidth = 2;
    ctx.shadowBlur = 8;
    ctx.shadowColor = 'rgba(162,155,254,0.5)';
    ctx.beginPath();
    visible.forEach((p, i) => {
      const x = timeToX(p.time), y = midiToY(p.midi);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.shadowBlur = 0;

    if (currentPitch) {
      ctx.beginPath();
      ctx.arc(timeToX(currentPitch.time), midiToY(currentPitch.midi), 5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(162,155,254,1)';
      ctx.fill();
    }
  }, [pitchHistory, currentPitch, mode]);

  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const startRecording = useCallback(async () => {
    setElapsed(0);
    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);

    if (mode === 'video') {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: true });
        if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play(); }
        const mr = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp8,opus' });
        chunksRef.current = [];
        mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
        mr.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: 'video/webm' });
          const url = URL.createObjectURL(blob);
          addRecording({
            id: Date.now().toString(), title: song.title, artist: song.artist,
            date: new Date().toISOString(), duration: elapsed, videoBlob: blob, videoUrl: url,
            type: 'video', thumbnail: `https://img.youtube.com/vi/${song.youtubeId}/mqdefault.jpg`,
          });
          earnBadge('recorder');
          toast.success('영상이 My Albums에 저장되었습니다! 🎬');
        };
        mr.start();
        mediaRecorderRef.current = mr;
      } catch { toast.error('카메라 접근 권한이 필요합니다'); return; }
    } else if (mode === 'audio') {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mr = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
        chunksRef.current = [];
        mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
        mr.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
          const url = URL.createObjectURL(blob);
          addRecording({
            id: Date.now().toString(), title: song.title, artist: song.artist,
            date: new Date().toISOString(), duration: elapsed, audioBlob: blob, audioUrl: url,
            type: 'audio', thumbnail: `https://img.youtube.com/vi/${song.youtubeId}/mqdefault.jpg`,
          });
          earnBadge('recorder');
          toast.success('오디오가 My Albums에 저장되었습니다! 🎙️');
        };
        mr.start();
        mediaRecorderRef.current = mr;
      } catch { toast.error('마이크 접근 권한이 필요합니다'); return; }
    }

    if (mode === 'pitch' || mode === 'audio') await startListening();
    setIsRecording(true);
  }, [mode, song, elapsed, addRecording, earnBadge, startListening]);

  const stopRecording = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    stopListening();
    setIsRecording(false);
    if (elapsed > 10) { addXp(25); toast.success(`노래 연습 완료! +25 XP`); }
  }, [elapsed, stopListening, addXp]);

  if (!song) return <div className="text-white p-4">곡을 찾을 수 없습니다.</div>;

  return (
    <div className="min-h-full flex flex-col" style={{ background: 'oklch(0.10 0.03 255)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-12 pb-3">
        <button onClick={() => navigate('/songs')} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'oklch(1 0 0 / 10%)' }}>
          <ArrowLeft size={18} className="text-white" />
        </button>
        <div className="text-center">
          <p className="text-sm font-bold text-white">{song.title}</p>
          <p className="text-xs" style={{ color: 'oklch(0.55 0.05 255)' }}>{song.artist}</p>
        </div>
        <button onClick={() => setIsFav(f => !f)}>
          <Heart size={20} fill={isFav ? '#FF6B6B' : 'none'} style={{ color: isFav ? '#FF6B6B' : 'oklch(0.45 0.05 255)' }} />
        </button>
      </div>

      {/* Mode Selector */}
      <div className="px-4 mb-3">
        <div className="flex gap-2 p-1 rounded-2xl" style={{ background: 'oklch(1 0 0 / 8%)' }}>
          {([['pitch', '피치', Mic], ['video', '영상', Camera], ['audio', '오디오', Mic]] as const).map(([id, label, Icon]) => (
            <button key={id} onClick={() => setMode(id as PracticeMode)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all"
              style={{ background: mode === id ? 'oklch(0.60 0.22 280)' : 'transparent', color: mode === id ? 'white' : 'oklch(0.50 0.05 255)' }}>
              <Icon size={12} />{label}
            </button>
          ))}
        </div>
      </div>

      {/* YouTube Player */}
      <div className="px-4 mb-3">
        <div className="rounded-2xl overflow-hidden aspect-video bg-black">
          <iframe
            src={`https://www.youtube.com/embed/${song.youtubeId}?rel=0&modestbranding=1`}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={song.title}
          />
        </div>
      </div>

      {/* Video Preview (video mode) */}
      {mode === 'video' && (
        <div className="px-4 mb-3">
          <div className="rounded-2xl overflow-hidden bg-black" style={{ height: 120 }}>
            <video ref={videoRef} className="w-full h-full object-cover scale-x-[-1]" muted playsInline />
            {!isRecording && (
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-white/40 text-xs">카메라 미리보기</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pitch Canvas (pitch mode) */}
      {mode === 'pitch' && (
        <div className="px-4 mb-3">
          <div className="rounded-2xl overflow-hidden pitch-canvas-area" style={{ height: 100 }}>
            <canvas ref={canvasRef} width={358} height={100} className="w-full h-full" />
            {currentPitch && (
              <div className="absolute top-2 right-3">
                <span className="text-lg font-black text-white">{currentPitch.note}{currentPitch.octave}</span>
              </div>
            )}
            {!isListening && (
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-white/30 text-xs">녹음 시작 시 피치 그래프가 표시됩니다</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Song Info */}
      <div className="px-4 mb-3">
        <div className="bg-card-gradient rounded-2xl p-3 flex items-center justify-between">
          <div className="flex gap-4 text-center">
            <div><p className="text-[10px]" style={{ color: 'oklch(0.50 0.05 255)' }}>키</p><p className="text-sm font-bold text-white">{song.key}</p></div>
            <div><p className="text-[10px]" style={{ color: 'oklch(0.50 0.05 255)' }}>BPM</p><p className="text-sm font-bold text-white">{song.bpm}</p></div>
            <div><p className="text-[10px]" style={{ color: 'oklch(0.50 0.05 255)' }}>난이도</p><p className="text-sm font-bold text-white">{song.difficulty}</p></div>
          </div>
          {isRecording && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: 'rgba(255,50,50,0.2)', border: '1px solid rgba(255,50,50,0.4)' }}>
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs font-bold text-red-400">{formatTime(elapsed)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Volume bar */}
      {isListening && (
        <div className="px-4 mb-2">
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'oklch(1 0 0 / 10%)' }}>
            <div className="h-full rounded-full transition-all duration-75"
              style={{ width: `${volume * 100}%`, background: 'linear-gradient(90deg, oklch(0.60 0.22 280), oklch(0.55 0.18 195))' }} />
          </div>
        </div>
      )}

      {/* Record Button */}
      <div className="px-4 pb-6 mt-auto">
        <button
          onClick={isRecording ? stopRecording : startRecording}
          className="w-full h-14 rounded-2xl flex items-center justify-center gap-3 text-white font-bold text-base transition-all"
          style={{
            background: isRecording ? 'oklch(0.55 0.22 25)' : 'oklch(0.60 0.22 280)',
            boxShadow: isRecording ? '0 4px 20px oklch(0.55 0.22 25 / 40%)' : '0 4px 20px oklch(0.60 0.22 280 / 40%)',
          }}
        >
          {isRecording
            ? <><Square size={18} fill="white" /> 녹화 중지 및 저장</>
            : mode === 'video' ? <><Video size={18} /> 영상 녹화 시작</>
            : mode === 'audio' ? <><Mic size={18} /> 오디오 녹음 시작</>
            : <><Mic size={18} /> 피치 모니터링 시작</>
          }
        </button>
      </div>
    </div>
  );
}
