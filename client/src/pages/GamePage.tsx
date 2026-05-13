import { useLocation } from 'wouter';
import { ArrowLeft, Star, Trophy, Zap } from 'lucide-react';

const SEAL_IMG = 'https://d2xsxph8kpxj0f.cloudfront.net/310419663032506040/2qUj9V5qzb6JP2x9TbX7ue/seal_mascot-MkdCY6MumAwwjKixF4c4mN.webp';
const PENGUIN_IMG = 'https://d2xsxph8kpxj0f.cloudfront.net/310419663032506040/2qUj9V5qzb6JP2x9TbX7ue/penguin_mascot-XrXJPBmQbMhzwrxGDPEJCE.webp';

export default function GamePage() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-full pb-4">
      <div className="px-4 pt-12 pb-4">
        <h1 className="text-2xl font-black text-white" style={{ fontFamily: 'Nunito, sans-serif' }}>보컬 게임</h1>
        <p className="text-xs mt-1" style={{ color: 'oklch(0.55 0.05 255)' }}>목소리로 게임을 즐기며 실력을 키우세요</p>
      </div>

      <div className="px-4 space-y-4">
        {/* Seal Game */}
        <button
          onClick={() => navigate('/game/seal')}
          className="w-full rounded-3xl overflow-hidden card-hover text-left"
          style={{ background: 'linear-gradient(135deg, oklch(0.25 0.08 240) 0%, oklch(0.18 0.06 250) 100%)', border: '1px solid oklch(1 0 0 / 10%)' }}
        >
          <div className="p-5 flex items-end justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: 'oklch(0.60 0.22 280 / 30%)', color: 'oklch(0.80 0.15 280)' }}>
                  피치 게임
                </span>
              </div>
              <h2 className="text-xl font-black text-white mb-1" style={{ fontFamily: 'Nunito, sans-serif' }}>물개 게임</h2>
              <p className="text-sm text-white/70 mb-3">목소리 높낮이로 물개를 조종하여<br />음표를 먹으세요!</p>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <Star size={12} style={{ color: '#FDCB6E' }} />
                  <span className="text-xs text-white/60">음정 조절</span>
                </div>
                <div className="flex items-center gap-1">
                  <Zap size={12} style={{ color: '#74B9FF' }} />
                  <span className="text-xs text-white/60">반응 속도</span>
                </div>
              </div>
            </div>
            <img src={SEAL_IMG} alt="seal" className="w-28 h-28 object-contain" style={{ filter: 'drop-shadow(0 4px 12px oklch(0.60 0.22 280 / 50%))' }} />
          </div>
          <div className="px-5 pb-4">
            <div className="h-10 rounded-2xl flex items-center justify-center font-bold text-sm text-white" style={{ background: 'oklch(0.60 0.22 280)' }}>
              게임 시작
            </div>
          </div>
        </button>

        {/* Penguin Game */}
        <button
          onClick={() => navigate('/game/penguin')}
          className="w-full rounded-3xl overflow-hidden card-hover text-left"
          style={{ background: 'linear-gradient(135deg, oklch(0.22 0.06 200) 0%, oklch(0.15 0.04 210) 100%)', border: '1px solid oklch(1 0 0 / 10%)' }}
        >
          <div className="p-5 flex items-end justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: 'oklch(0.55 0.18 195 / 30%)', color: 'oklch(0.75 0.15 195)' }}>
                  볼륨 게임
                </span>
              </div>
              <h2 className="text-xl font-black text-white mb-1" style={{ fontFamily: 'Nunito, sans-serif' }}>펭귄 게임</h2>
              <p className="text-sm text-white/70 mb-3">목소리 크기로 펭귄을 날려<br />장애물을 피하세요!</p>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <Trophy size={12} style={{ color: '#FDCB6E' }} />
                  <span className="text-xs text-white/60">볼륨 조절</span>
                </div>
                <div className="flex items-center gap-1">
                  <Zap size={12} style={{ color: '#00CEC9' }} />
                  <span className="text-xs text-white/60">지속력</span>
                </div>
              </div>
            </div>
            <img src={PENGUIN_IMG} alt="penguin" className="w-28 h-28 object-contain" style={{ filter: 'drop-shadow(0 4px 12px oklch(0.55 0.18 195 / 50%))' }} />
          </div>
          <div className="px-5 pb-4">
            <div className="h-10 rounded-2xl flex items-center justify-center font-bold text-sm text-white" style={{ background: 'oklch(0.55 0.18 195)' }}>
              게임 시작
            </div>
          </div>
        </button>

        {/* High Score */}
        <div className="bg-card-gradient rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Trophy size={16} style={{ color: '#FDCB6E' }} />
            <h3 className="text-sm font-bold text-white">최고 기록</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl p-3 text-center" style={{ background: 'oklch(1 0 0 / 5%)' }}>
              <p className="text-xs mb-1" style={{ color: 'oklch(0.55 0.05 255)' }}>물개 게임</p>
              <p className="text-xl font-black text-white">0</p>
              <p className="text-[10px]" style={{ color: 'oklch(0.45 0.05 255)' }}>점</p>
            </div>
            <div className="rounded-xl p-3 text-center" style={{ background: 'oklch(1 0 0 / 5%)' }}>
              <p className="text-xs mb-1" style={{ color: 'oklch(0.55 0.05 255)' }}>펭귄 게임</p>
              <p className="text-xl font-black text-white">0</p>
              <p className="text-[10px]" style={{ color: 'oklch(0.45 0.05 255)' }}>점</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
