import { useLocation } from 'wouter';
import { Home, Music, Gamepad2, User, Mic } from 'lucide-react';

const tabs = [
  { path: '/', icon: Home, label: '홈' },
  { path: '/practice', icon: Mic, label: '연습' },
  { path: '/songs', icon: Music, label: '노래' },
  { path: '/game', icon: Gamepad2, label: '게임' },
  { path: '/mypage', icon: User, label: 'MY' },
];

export default function BottomNav() {
  const [location, navigate] = useLocation();

  return (
    <nav className="bottom-nav">
      <div className="flex items-center justify-around h-full px-2">
        {tabs.map(({ path, icon: Icon, label }) => {
          const isActive = path === '/' ? location === '/' : location.startsWith(path);
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className="flex flex-col items-center gap-0.5 flex-1 py-1 transition-all duration-200"
              style={{ transform: isActive ? 'scale(1.05)' : 'scale(1)' }}
            >
              <div
                className="relative flex items-center justify-center w-10 h-7 rounded-xl transition-all duration-200"
                style={{
                  background: isActive ? 'oklch(0.60 0.22 280 / 20%)' : 'transparent',
                }}
              >
                <Icon
                  size={20}
                  style={{
                    color: isActive ? 'oklch(0.75 0.18 280)' : 'oklch(0.50 0.02 255)',
                    filter: isActive ? 'drop-shadow(0 0 6px oklch(0.60 0.22 280 / 80%))' : 'none',
                    transition: 'all 0.2s ease',
                  }}
                />
                {isActive && (
                  <span
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                    style={{ background: 'oklch(0.75 0.18 280)' }}
                  />
                )}
              </div>
              <span
                className="text-[10px] font-semibold transition-all duration-200"
                style={{
                  color: isActive ? 'oklch(0.75 0.18 280)' : 'oklch(0.50 0.02 255)',
                  fontFamily: 'Nunito, sans-serif',
                }}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
