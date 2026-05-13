import { useRef, useEffect, useState, useCallback } from 'react';
import { useLocation } from 'wouter';
import { ArrowLeft, Mic, Pause, Trophy } from 'lucide-react';
import { usePitchDetection } from '@/hooks/usePitchDetection';
import { useAudioGuide } from '@/hooks/useAudioGuide';
import { useApp } from '@/contexts/AppContext';
import { toast } from 'sonner';

const PENGUIN_IMG = 'https://d2xsxph8kpxj0f.cloudfront.net/310419663032506040/2qUj9V5qzb6JP2x9TbX7ue/penguin_mascot-XrXJPBmQbMhzwrxGDPEJCE.webp';

const CANVAS_W = 358;
const CANVAS_H = 400;
const PENGUIN_X = 60;
const PENGUIN_SIZE = 44;
const GRAVITY = 0.35;
const PIPE_GAP = 130;
const PIPE_WIDTH = 42;
const PIPE_SPEED = 2.8;

interface Pipe { x: number; topH: number; passed: boolean; }
interface GameState { penguinY: number; velY: number; pipes: Pipe[]; score: number; gameOver: boolean; }

export default function PenguinGamePage() {
  const [, navigate] = useLocation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<GameState>({ penguinY: CANVAS_H / 2, velY: 0, pipes: [], score: 0, gameOver: false });
  const rafRef = useRef<number>(0);
  const lastPipeRef = useRef<number>(0);
  const penguinImgRef = useRef<HTMLImageElement | null>(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => parseInt(localStorage.getItem('penguin_highscore') || '0'));
  const [gameOver, setGameOver] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const { isListening, volume, startListening, stopListening } = usePitchDetection();
  const { playClick, playFail } = useAudioGuide();
  const { addXp, earnBadge } = useApp();

  useEffect(() => {
    const img = new Image();
    img.src = PENGUIN_IMG;
    img.onload = () => { penguinImgRef.current = img; };
  }, []);

  const spawnPipe = useCallback(() => {
    const topH = Math.floor(Math.random() * (CANVAS_H - PIPE_GAP - 60)) + 30;
    gameRef.current.pipes.push({ x: CANVAS_W + 10, topH, passed: false });
  }, []);

  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const g = gameRef.current;
    if (g.gameOver) return;

    // Physics: volume lifts penguin
    const lift = volume > 0.05 ? -volume * 12 : 0;
    g.velY += GRAVITY;
    g.velY += lift;
    g.velY = Math.max(-10, Math.min(10, g.velY));
    g.penguinY += g.velY;

    // Boundary
    if (g.penguinY < PENGUIN_SIZE / 2) { g.penguinY = PENGUIN_SIZE / 2; g.velY = 0; }
    if (g.penguinY > CANVAS_H - PENGUIN_SIZE / 2) {
      g.gameOver = true;
      endGame();
      return;
    }

    // Spawn pipes
    const now = Date.now();
    if (now - lastPipeRef.current > 1800) { spawnPipe(); lastPipeRef.current = now; }

    // Move pipes & collision
    g.pipes = g.pipes.filter(p => p.x > -PIPE_WIDTH - 10);
    for (const p of g.pipes) {
      p.x -= PIPE_SPEED;
      if (!p.passed && p.x + PIPE_WIDTH < PENGUIN_X) {
        p.passed = true;
        g.score += 1;
        setScore(g.score);
        playClick();
      }
      // Collision
      const px = PENGUIN_X, py = g.penguinY, pr = PENGUIN_SIZE / 2 - 6;
      if (px + pr > p.x && px - pr < p.x + PIPE_WIDTH) {
        if (py - pr < p.topH || py + pr > p.topH + PIPE_GAP) {
          g.gameOver = true;
          playFail();
          endGame();
          return;
        }
      }
    }

    // Draw
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    // Background gradient
    const bg = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
    bg.addColorStop(0, 'oklch(0.20 0.06 200)');
    bg.addColorStop(1, 'oklch(0.12 0.04 210)');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Pipes (ice-style)
    g.pipes.forEach(p => {
      // Top pipe
      const topGrad = ctx.createLinearGradient(p.x, 0, p.x + PIPE_WIDTH, 0);
      topGrad.addColorStop(0, 'oklch(0.45 0.15 195)');
      topGrad.addColorStop(1, 'oklch(0.35 0.12 200)');
      ctx.fillStyle = topGrad;
      ctx.beginPath();
      ctx.roundRect(p.x, 0, PIPE_WIDTH, p.topH - 4, [0, 0, 8, 8]);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Bottom pipe
      const botY = p.topH + PIPE_GAP;
      ctx.fillStyle = topGrad;
      ctx.beginPath();
      ctx.roundRect(p.x, botY + 4, PIPE_WIDTH, CANVAS_H - botY - 4, [8, 8, 0, 0]);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.stroke();

      // Gap highlight
      ctx.fillStyle = 'rgba(0,206,201,0.08)';
      ctx.fillRect(p.x, p.topH, PIPE_WIDTH, PIPE_GAP);
    });

    // Penguin
    if (penguinImgRef.current) {
      ctx.save();
      ctx.translate(PENGUIN_X, g.penguinY);
      const tilt = Math.max(-25, Math.min(25, g.velY * 3));
      ctx.rotate((tilt * Math.PI) / 180);
      ctx.drawImage(penguinImgRef.current, -PENGUIN_SIZE / 2, -PENGUIN_SIZE / 2, PENGUIN_SIZE, PENGUIN_SIZE);
      ctx.restore();
    } else {
      ctx.font = '32px serif';
      ctx.textAlign = 'center';
      ctx.fillText('🐧', PENGUIN_X, g.penguinY + 10);
      ctx.textAlign = 'left';
    }

    // Volume aura
    if (volume > 0.05) {
      ctx.beginPath();
      ctx.arc(PENGUIN_X, g.penguinY, PENGUIN_SIZE / 2 + volume * 18, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0,206,201,${volume * 0.25})`;
      ctx.fill();
    }

    // Score display on canvas
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.font = 'bold 28px Nunito, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(String(g.score), CANVAS_W / 2, 40);
    ctx.textAlign = 'left';

    rafRef.current = requestAnimationFrame(gameLoop);
  }, [volume, spawnPipe, playClick, playFail]);

  const endGame = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    stopListening();
    setIsPlaying(false);
    setGameOver(true);
    const finalScore = gameRef.current.score;
    if (finalScore > highScore) {
      setHighScore(finalScore);
      localStorage.setItem('penguin_highscore', String(finalScore));
      toast.success(`새 최고 기록! ${finalScore}점 🎉`);
    }
    if (finalScore >= 5) { addXp(20); earnBadge('game_player'); }
  }, [stopListening, highScore, addXp, earnBadge]);

  const startGame = useCallback(async () => {
    cancelAnimationFrame(rafRef.current);
    gameRef.current = { penguinY: CANVAS_H / 2, velY: 0, pipes: [], score: 0, gameOver: false };
    lastPipeRef.current = Date.now();
    setScore(0);
    setGameOver(false);
    setIsPlaying(true);
    await startListening();
    rafRef.current = requestAnimationFrame(gameLoop);
  }, [startListening, gameLoop]);

  useEffect(() => () => { cancelAnimationFrame(rafRef.current); stopListening(); }, [stopListening]);

  return (
    <div className="min-h-full flex flex-col" style={{ background: 'oklch(0.10 0.03 255)' }}>
      <div className="flex items-center justify-between px-4 pt-12 pb-3">
        <button onClick={() => { endGame(); navigate('/game'); }} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'oklch(1 0 0 / 10%)' }}>
          <ArrowLeft size={18} className="text-white" />
        </button>
        <div className="text-center">
          <p className="text-base font-black text-white" style={{ fontFamily: 'Nunito, sans-serif' }}>펭귄 게임</p>
          <p className="text-xs" style={{ color: 'oklch(0.55 0.05 255)' }}>목소리 크기로 펭귄을 날리세요</p>
        </div>
        <div className="flex items-center gap-1">
          <Trophy size={14} style={{ color: '#FDCB6E' }} />
          <span className="text-xs font-bold text-white">{highScore}</span>
        </div>
      </div>

      {/* Volume indicator */}
      <div className="px-4 mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/40">볼륨</span>
          <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'oklch(1 0 0 / 10%)' }}>
            <div className="h-full rounded-full transition-all duration-75"
              style={{ width: `${volume * 100}%`, background: 'linear-gradient(90deg, oklch(0.55 0.18 195), oklch(0.65 0.20 150))' }} />
          </div>
          <span className="text-xs font-bold text-white/60">{Math.round(volume * 100)}%</span>
        </div>
      </div>

      {/* Canvas */}
      <div className="px-4 mb-3">
        <div className="rounded-3xl overflow-hidden relative" style={{ border: '1px solid oklch(1 0 0 / 10%)' }}>
          <canvas ref={canvasRef} width={CANVAS_W} height={CANVAS_H} className="w-full" style={{ display: 'block' }} />

          {!isPlaying && !gameOver && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3" style={{ background: 'oklch(0.10 0.03 255 / 80%)' }}>
              <img src={PENGUIN_IMG} alt="penguin" className="w-20 h-20 object-contain" />
              <p className="text-white font-bold text-center px-6">목소리 크기로 펭귄을 날려<br />파이프 사이를 통과하세요!</p>
              <p className="text-sm text-white/50 text-center px-6">크게 소리내면 위로 올라가고<br />조용하면 아래로 내려갑니다</p>
            </div>
          )}

          {gameOver && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3" style={{ background: 'oklch(0.10 0.03 255 / 85%)' }}>
              <p className="text-xl font-bold text-white/60">게임 오버</p>
              <p className="text-4xl font-black text-white">{score}점</p>
              {score >= highScore && score > 0 && <p className="text-sm font-bold" style={{ color: '#FDCB6E' }}>🏆 최고 기록!</p>}
              <button onClick={startGame} className="px-6 py-3 rounded-2xl font-bold text-white" style={{ background: 'oklch(0.55 0.18 195)' }}>
                다시 시작
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="px-4 pb-6">
        <button
          onClick={isPlaying ? endGame : startGame}
          className="w-full h-14 rounded-2xl flex items-center justify-center gap-3 text-white font-bold text-base"
          style={{ background: isPlaying ? 'oklch(0.55 0.22 25)' : 'oklch(0.55 0.18 195)', boxShadow: '0 4px 20px oklch(0.55 0.18 195 / 40%)' }}
        >
          {isPlaying ? <><Pause size={20} /> 게임 종료</> : <><Mic size={20} /> 게임 시작</>}
        </button>
      </div>
    </div>
  );
}
