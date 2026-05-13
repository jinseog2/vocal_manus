import { useLocation } from 'wouter';

export default function NotFound() {
  const [, navigate] = useLocation();
  return (
    <div className="min-h-full flex flex-col items-center justify-center gap-4 px-4">
      <span className="text-6xl">🎤</span>
      <h1 className="text-xl font-black text-white">페이지를 찾을 수 없습니다</h1>
      <button onClick={() => navigate('/')} className="px-6 py-3 rounded-2xl font-bold text-white" style={{ background: 'oklch(0.60 0.22 280)' }}>
        홈으로 돌아가기
      </button>
    </div>
  );
}
