import { useState, useRef } from 'react';
import { useLocation } from 'wouter';
import { ArrowLeft, Trash2, Play, Pause, Video, Mic, Tag, GitCompare } from 'lucide-react';
import { useApp, Recording } from '@/contexts/AppContext';
import { toast } from 'sonner';

export default function AlbumsPage() {
  const [, navigate] = useLocation();
  const { recordings, removeRecording } = useApp();
  const [playing, setPlaying] = useState<string | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [compareA, setCompareA] = useState<Recording | null>(null);
  const [compareB, setCompareB] = useState<Recording | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const handlePlay = (rec: Recording) => {
    if (playing === rec.id) {
      audioRef.current?.pause();
      videoRef.current?.pause();
      setPlaying(null);
      return;
    }
    setPlaying(rec.id);
    if (rec.type === 'audio' && rec.audioUrl) {
      if (!audioRef.current) audioRef.current = new Audio();
      audioRef.current.src = rec.audioUrl;
      audioRef.current.play();
      audioRef.current.onended = () => setPlaying(null);
    }
  };

  const handleDelete = (id: string) => {
    removeRecording(id);
    toast.success('삭제되었습니다');
  };

  const handleCompareSelect = (rec: Recording) => {
    if (!compareA) { setCompareA(rec); return; }
    if (!compareB && rec.id !== compareA.id) { setCompareB(rec); return; }
    setCompareA(rec);
    setCompareB(null);
  };

  const formatDuration = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  const formatDate = (iso: string) => new Date(iso).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="min-h-full pb-4">
      <div className="px-4 pt-12 pb-4 flex items-center gap-3">
        <button onClick={() => navigate('/mypage')} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'oklch(1 0 0 / 10%)' }}>
          <ArrowLeft size={18} className="text-white" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-black text-white" style={{ fontFamily: 'Nunito, sans-serif' }}>My Albums</h1>
          <p className="text-xs" style={{ color: 'oklch(0.55 0.05 255)' }}>{recordings.length}개의 녹음/녹화</p>
        </div>
        <button
          onClick={() => { setCompareMode(m => !m); setCompareA(null); setCompareB(null); }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all"
          style={{ background: compareMode ? 'oklch(0.60 0.22 280)' : 'oklch(1 0 0 / 10%)', color: 'white' }}
        >
          <GitCompare size={12} /> Before/After
        </button>
      </div>

      {/* Before vs After Compare Panel */}
      {compareMode && (
        <div className="mx-4 mb-4 bg-card-gradient rounded-2xl p-4">
          <p className="text-xs font-bold text-white mb-3">비교할 녹음 2개를 선택하세요</p>
          <div className="grid grid-cols-2 gap-3">
            {[{ label: 'Before', rec: compareA }, { label: 'After', rec: compareB }].map(({ label, rec }) => (
              <div key={label} className="rounded-xl p-3 text-center" style={{ background: 'oklch(1 0 0 / 6%)', border: '1px dashed oklch(1 0 0 / 15%)' }}>
                <p className="text-xs font-bold mb-1" style={{ color: label === 'Before' ? '#FF6B6B' : '#00CEC9' }}>{label}</p>
                {rec ? (
                  <div>
                    <p className="text-xs font-bold text-white truncate">{rec.title}</p>
                    <p className="text-[10px] mt-0.5" style={{ color: 'oklch(0.55 0.05 255)' }}>{formatDate(rec.date)}</p>
                    <button onClick={() => handlePlay(rec)} className="mt-2 w-7 h-7 rounded-full flex items-center justify-center mx-auto"
                      style={{ background: label === 'Before' ? '#FF6B6B33' : '#00CEC933' }}>
                      {playing === rec.id ? <Pause size={12} style={{ color: label === 'Before' ? '#FF6B6B' : '#00CEC9' }} /> : <Play size={12} style={{ color: label === 'Before' ? '#FF6B6B' : '#00CEC9' }} />}
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-white/30 mt-2">선택 안됨</p>
                )}
              </div>
            ))}
          </div>
          {compareA && compareB && (
            <p className="text-xs text-center mt-2" style={{ color: 'oklch(0.65 0.18 280)' }}>✓ 두 녹음을 선택했습니다. 각각 재생해 비교하세요!</p>
          )}
        </div>
      )}

      {recordings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'oklch(1 0 0 / 5%)' }}>
            <Mic size={28} style={{ color: 'oklch(0.45 0.05 255)' }} />
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-white">아직 녹음이 없습니다</p>
            <p className="text-xs mt-1" style={{ color: 'oklch(0.50 0.05 255)' }}>노래 연습이나 피치 모드에서<br />녹음/녹화를 시작해보세요</p>
          </div>
          <button onClick={() => navigate('/songs')} className="px-5 py-2.5 rounded-2xl text-sm font-bold text-white" style={{ background: 'oklch(0.60 0.22 280)' }}>
            노래 연습 시작
          </button>
        </div>
      ) : (
        <div className="px-4 space-y-3">
          {recordings.map(rec => (
            <div
              key={rec.id}
              className="bg-card-gradient rounded-2xl overflow-hidden"
              style={{ border: compareMode && (compareA?.id === rec.id || compareB?.id === rec.id) ? '1.5px solid oklch(0.60 0.22 280)' : '1px solid transparent' }}
            >
              {/* Video thumbnail or audio icon */}
              <div className="flex items-start gap-3 p-4">
                <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 relative"
                  style={{ background: 'oklch(1 0 0 / 8%)' }}>
                  {rec.thumbnail ? (
                    <img src={rec.thumbnail} alt={rec.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      {rec.type === 'video' ? <Video size={20} style={{ color: 'oklch(0.55 0.05 255)' }} /> : <Mic size={20} style={{ color: 'oklch(0.55 0.05 255)' }} />}
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'oklch(0 0 0 / 30%)' }}>
                    <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: 'oklch(0.60 0.22 280 / 80%)' }}>
                      {rec.type === 'video' ? <Video size={10} className="text-white" /> : <Mic size={10} className="text-white" />}
                    </div>
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">{rec.title}</p>
                  <p className="text-xs mt-0.5 truncate" style={{ color: 'oklch(0.55 0.05 255)' }}>{rec.artist}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full"
                      style={{ background: rec.type === 'video' ? 'oklch(0.55 0.18 195 / 20%)' : 'oklch(0.60 0.22 280 / 20%)', color: rec.type === 'video' ? 'oklch(0.70 0.15 195)' : 'oklch(0.75 0.15 280)' }}>
                      {rec.type === 'video' ? '영상' : '오디오'}
                    </span>
                    <span className="text-[10px]" style={{ color: 'oklch(0.45 0.05 255)' }}>{formatDuration(rec.duration)}</span>
                    <span className="text-[10px]" style={{ color: 'oklch(0.45 0.05 255)' }}>{formatDate(rec.date)}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  {compareMode ? (
                    <button onClick={() => handleCompareSelect(rec)}
                      className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ background: compareA?.id === rec.id || compareB?.id === rec.id ? 'oklch(0.60 0.22 280)' : 'oklch(1 0 0 / 10%)' }}>
                      <Tag size={14} className="text-white" />
                    </button>
                  ) : (
                    <button onClick={() => handlePlay(rec)}
                      className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ background: 'oklch(0.60 0.22 280 / 20%)' }}>
                      {playing === rec.id ? <Pause size={14} style={{ color: 'oklch(0.75 0.18 280)' }} /> : <Play size={14} style={{ color: 'oklch(0.75 0.18 280)' }} />}
                    </button>
                  )}
                  <button onClick={() => handleDelete(rec.id)}
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ background: 'oklch(0.55 0.22 25 / 15%)' }}>
                    <Trash2 size={14} style={{ color: 'oklch(0.65 0.20 25)' }} />
                  </button>
                </div>
              </div>

              {/* Video player inline */}
              {rec.type === 'video' && rec.videoUrl && playing === rec.id && (
                <div className="px-4 pb-4">
                  <video
                    ref={videoRef}
                    src={rec.videoUrl}
                    controls
                    autoPlay
                    className="w-full rounded-xl"
                    style={{ maxHeight: 200 }}
                    onEnded={() => setPlaying(null)}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
