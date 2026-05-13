import { useRef, useEffect, useState, useCallback } from 'react';
import { useLocation } from 'wouter';
import { ArrowLeft, Mic, Pause, Trophy } from 'lucide-react';
import { usePitchDetection } from '@/hooks/usePitchDetection';
import { useAudioGuide } from '@/hooks/useAudioGuide';
import { useApp } from '@/contexts/AppContext';
import { toast } from 'sonner';

const SEAL_IMG = 'https://d2xsxph8kpxj0f.cloudfront.net/310419663032506040/2qUj9V5qzb6JP2x9TbX7ue/seal_mascot-MkdCY6MumAwwjKixF4c4mN.webp';

interface Note { x: number; y: number; midi: number; collected: boolean; }
interface GameState { sealY: number; score: number; notes: Note[]; gameOver: boolean; }

const CANVAS_W = 358;
const CANVAS_H = 400;
const MIDI_MIN = 48; // C3
const MIDI_MAX = 72; // C5
const SEAL_X = 60;
const SEAL_SIZE = 44;

export default function SealGamePage() {
  const [, navigate] = useLocation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<GameState>({ sealY: CANVAS_H / 2, score: 0, notes: [], gameOver: false });
  const rafRef = useRef<number>(0);
  const lastNoteRef = useRef<number>(0);
  const sealImgRef = useRef<HTMLImageElement | null>(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => parseInt(localStorage.getItem('seal_highscore') || '0'));
  const [gameOver, setGameOver] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const { isListening, currentPitch, volume, startListening, stopListening } = usePitchDetection();
  const { playSuccess, playClick } = useAudioGuide();
  const { addXp, earnBadge } = useApp();

  // Preload seal image
  useEffect(() => {
    const img = new Image();
    img.src = SEAL_IMG;
    img.onload = () => { sealImgRef.current = img; };
  }, []);

  // Map MIDI pitch to canvas Y
  const midiToY = (midi: number) => {
    const clamped = Math.max(MIDI_MIN, Math.min(MIDI_MAX, midi));
    return CANVAS_H - ((clamped - MIDI_MIN) / (MIDI_MAX - MIDI_MIN)) * CANVAS_H;
  };

  const spawnNote = useCallback(() => {
    const midi = Math.floor(Math.random() * (MIDI_MAX - MIDI_MIN)) + MIDI_MIN;
    const y = midiToY(midi);
    gameRef.current.notes.push({ x: CANVAS_W + 20, y, midi, collected: false });
  }, []);

  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const g = gameRef.current;
    if (g.gameOver) return;

    // Update seal Y based on pitch
    if (currentPitch && currentPitch.midi >= MIDI_MIN - 2 && currentPitch.midi <= MIDI_MAX + 2) {
      const targetY = midiToY(currentPitch.midi);
      g.sealY += (targetY - g.sealY) * 0.18;
    } else if (!currentPitch) {
      // Gravity when no pitch
      g.sealY += (CANVAS_H * 0.65 - g.sealY) * 0.05;
    }
    g.sealY = Math.max(SEAL_SIZE / 2, Math.min(CANVAS_H - SEAL_SIZE / 2, g.sealY));

    // Spawn notes
    const now = Date.now();
    if (now - lastNoteRef.current > 1200) {
      spawnNote();
      lastNoteRef.current = now;
    }

    // Move notes
    g.notes = g.notes.filter(n => n.x > -30);
    g.notes.forEach(n => { n.x -= 3.5; });

    // Collision detection
    g.notes.forEach(n => {
      if (!n.collected && Math.abs(n.x - SEAL_X) < 28 && Math.abs(n.y - g.sealY) < 28) {
        n.collected = true;
        g.score += 10;
        setScore(g.score);
        playClick();
      }
    });

    // Draw
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    // Background
    const bg = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
    bg.addColorStop(0, 'oklch(0.18 0.06 240)');
    bg.addColorStop(1, 'oklch(0.12 0.04 250)');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Pitch guide lines
    for (let midi = MIDI_MIN; midi <= MIDI_MAX; midi += 2) {
      const y = midiToY(midi);
      ctx.strokeStyle = 'rgba(255,255,255,0.04)';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(CANVAS_W, y);
      ctx.stroke();
    }

    // Note labels on left
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    for (let midi = MIDI_MIN; midi <= MIDI_MAX; midi += 4) {
      const y = midiToY(midi);
      const note = noteNames[midi % 12];
      const oct = Math.floor(midi / 12) - 1;
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.font = '9px Nunito, sans-serif';
      ctx.fillText(`${note}${oct}`, 4, y + 3);
    }

    // Draw notes (music note symbols)
    g.notes.forEach(n => {
      if (n.collected) return;
      const noteNames2 = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
      const noteName = noteNames2[n.midi % 12];

      // Glow
      ctx.shadowBlur = 12;
      ctx.shadowColor = 'rgba(162,155,254,0.8)';

      // Circle
      ctx.beginPath();
      ctx.arc(n.x, n.y, 16, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(108,92,231,0.85)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(162,155,254,0.9)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Note name
      ctx.fillStyle = 'white';
      ctx.font = 'bold 9px Nunito, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(noteName, n.x, n.y + 3);
      ctx.textAlign = 'left';

      // Music note symbol
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.font = '10px serif';
      ctx.fillText('♪', n.x + 12, n.y - 10);
    });

    // Draw seal
    if (sealImgRef.current) {
      ctx.save();
      ctx.drawImage(sealImgRef.current, SEAL_X - SEAL_SIZE / 2, g.sealY - SEAL_SIZE / 2, SEAL_SIZE, SEAL_SIZE);
      ctx.restore();
    } else {
      ctx.font = '32px serif';
      ctx.textAlign = 'center';
      ctx.fillText('🦭', SEAL_X, g.sealY + 10);
      ctx.textAlign = 'left';
    }

    // Volume indicator
    if (volume > 0) {
      ctx.fillStyle = `rgba(162,155,254,${volume * 0.6})`;
      ctx.beginPath();
      ctx.arc(SEAL_X, g.sealY, SEAL_SIZE / 2 + volume * 20, 0, Math.PI * 2);
      ctx.fill();
    }

    rafRef.current = requestAnimationFrame(gameLoop);
  }, [currentPitch, volume, spawnNote, playClick]);

  const startGame = useCallback(async () => {
    gameRef.current = { sealY: CANVAS_H / 2, score: 0, notes: [], gameOver: false };
    lastNoteRef.current = Date.now();
    setScore(0);
    setGameOver(false);
    setIsPlaying(true);
    await startListening();
    rafRef.current = requestAnimationFrame(gameLoop);
  }, [startListening, gameLoop]);

  const stopGame = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    stopListening();
    setIsPlaying(false);
    const finalScore = gameRef.current.score;
    if (finalScore > highScore) {
      setHighScore(finalScore);
      localStorage.setItem('seal_highscore', String(finalScore));
      toast.success(`새 최고 기록! ${finalScore}점 🎉`);
    }
    if (finalScore >= 50) { addXp(20); earnBadge('game_player'); }
    setGameOver(true);
  }, [stopListening, highScore, addXp, earnBadge]);

  useEffect(() => () => { cancelAnimationFrame(rafRef.current); stopListening(); }, [stopListening]);

  return (
    <div className="min-h-full flex flex-col" style={{ background: 'oklch(0.10 0.03 255)' }}>
      <div className="flex items-center justify-between px-4 pt-12 pb-3">
        <button onClick={() => { stopGame(); navigate('/game'); }} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'oklch(1 0 0 / 10%)' }}>
          <ArrowLeft size={18} className="text-white" />
        </button>
        <div className="text-center">
          <p className="text-base font-black text-white" style={{ fontFamily: 'Nunito, sans-serif' }}>물개 게임</p>
          <p className="text-xs" style={{ color: 'oklch(0.55 0.05 255)' }}>목소리 높낮이로 물개를 조종하세요</p>
        </div>
        <div className="flex items-center gap-1">
          <Trophy size={14} style={{ color: '#FDCB6E' }} />
          <span className="text-xs font-bold text-white">{highScore}</span>
        </div>
      </div>

      {/* Score */}
      <div className="px-4 mb-3 flex items-center justify-between">
        <div className="bg-card-gradient rounded-2xl px-4 py-2">
          <p className="text-xs" style={{ color: 'oklch(0.55 0.05 255)' }}>점수</p>
          <p className="text-2xl font-black text-white" style={{ fontFamily: 'Nunito, sans-serif' }}>{score}</p>
        </div>
        {currentPitch && isPlaying && (
          <div className="bg-card-gradient rounded-2xl px-4 py-2 text-right">
            <p className="text-xs" style={{ color: 'oklch(0.55 0.05 255)' }}>현재 음정</p>
            <p className="text-2xl font-black text-white">{currentPitch.note}{currentPitch.octave}</p>
          </div>
        )}
      </div>

      {/* Canvas */}
      <div className="px-4 mb-3">
        <div className="rounded-3xl overflow-hidden relative" style={{ border: '1px solid oklch(1 0 0 / 10%)' }}>
          <canvas ref={canvasRef} width={CANVAS_W} height={CANVAS_H} className="w-full" style={{ display: 'block' }} />

          {!isPlaying && !gameOver && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3" style={{ background: 'oklch(0.10 0.03 255 / 80%)' }}>
              <img src={SEAL_IMG} alt="seal" className="w-20 h-20 object-contain" />
              <p className="text-white font-bold text-center px-6">목소리 높낮이로 물개를 조종해<br />음표를 먹으세요!</p>
              <p className="text-sm text-white/50 text-center px-6">C3~C5 범위로 노래하면<br />물개가 위아래로 움직입니다</p>
            </div>
          )}

          {gameOver && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3" style={{ background: 'oklch(0.10 0.03 255 / 85%)' }}>
              <p className="text-3xl font-black text-white">{score}점</p>
              {score >= highScore && score > 0 && <p className="text-sm font-bold" style={{ color: '#FDCB6E' }}>🏆 최고 기록!</p>}
              <button onClick={startGame} className="px-6 py-3 rounded-2xl font-bold text-white" style={{ background: 'oklch(0.60 0.22 280)' }}>
                다시 시작
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="px-4 pb-6">
        <button
          onClick={isPlaying ? stopGame : startGame}
          className="w-full h-14 rounded-2xl flex items-center justify-center gap-3 text-white font-bold text-base"
          style={{ background: isPlaying ? 'oklch(0.55 0.22 25)' : 'oklch(0.60 0.22 280)', boxShadow: '0 4px 20px oklch(0.60 0.22 280 / 40%)' }}
        >
          {isPlaying ? <><Pause size={20} /> 게임 종료</> : <><Mic size={20} /> 게임 시작</>}
        </button>
      </div>
    </div>
  );
}
