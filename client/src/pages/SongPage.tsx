import { useState } from 'react';
import { useLocation } from 'wouter';
import { Search, ChevronRight, Heart, Play } from 'lucide-react';

const songList = [
  { id: '1', title: '봄날', artist: 'BTS', youtubeId: 'xEeFrLSkMm8', key: 'F#m', bpm: 76, difficulty: '중급', genre: '발라드' },
  { id: '2', title: '밤편지', artist: 'IU', youtubeId: 'BzYnNdJhZQw', key: 'Db', bpm: 72, difficulty: '초급', genre: '발라드' },
  { id: '3', title: 'Dynamite', artist: 'BTS', youtubeId: 'gdZLi9oWNZg', key: 'B', bpm: 114, difficulty: '중급', genre: '팝' },
  { id: '4', title: 'Celebrity', artist: 'IU', youtubeId: 'lCqBMFQwHKk', key: 'G', bpm: 100, difficulty: '중급', genre: '팝' },
  { id: '5', title: 'Lilac', artist: 'IU', youtubeId: 'D1PvIWdJ8xo', key: 'Bb', bpm: 115, difficulty: '중급', genre: '팝' },
  { id: '6', title: 'Love poem', artist: 'IU', youtubeId: 'A-MjGnpCbqM', key: 'Db', bpm: 68, difficulty: '초급', genre: '발라드' },
  { id: '7', title: 'Butter', artist: 'BTS', youtubeId: 'WMweEpGlu_U', key: 'G', bpm: 110, difficulty: '중급', genre: '팝' },
  { id: '8', title: 'Permission to Dance', artist: 'BTS', youtubeId: 'CuklIb9d3fI', key: 'C', bpm: 124, difficulty: '초급', genre: '팝' },
  { id: '9', title: 'INVU', artist: '태연', youtubeId: 'UBURTj20HXI', key: 'Fm', bpm: 110, difficulty: '고급', genre: 'R&B' },
  { id: '10', title: '그대라는 시', artist: '에릭남 & 웬디', youtubeId: 'Xyj_LFX0tTU', key: 'C', bpm: 80, difficulty: '초급', genre: '발라드' },
];

const difficultyColor: Record<string, string> = { '초급': '#00CEC9', '중급': '#FDCB6E', '고급': '#FF6B6B' };

export default function SongPage() {
  const [, navigate] = useLocation();
  const [search, setSearch] = useState('');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [filter, setFilter] = useState<'전체' | '발라드' | '팝' | 'R&B'>('전체');

  const filtered = songList.filter(s => {
    const matchSearch = s.title.includes(search) || s.artist.includes(search);
    const matchFilter = filter === '전체' || s.genre === filter;
    return matchSearch && matchFilter;
  });

  const toggleFav = (id: string) => setFavorites(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);

  return (
    <div className="min-h-full pb-4">
      <div className="px-4 pt-12 pb-4">
        <h1 className="text-2xl font-black text-white" style={{ fontFamily: 'Nunito, sans-serif' }}>노래 연습</h1>
        <p className="text-xs mt-1" style={{ color: 'oklch(0.55 0.05 255)' }}>YouTube 영상으로 노래하며 녹화하세요</p>
      </div>

      <div className="px-4 space-y-4">
        {/* Search */}
        <div className="flex items-center gap-3 px-4 h-11 rounded-2xl" style={{ background: 'oklch(1 0 0 / 8%)', border: '1px solid oklch(1 0 0 / 10%)' }}>
          <Search size={16} style={{ color: 'oklch(0.50 0.05 255)' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="곡명 또는 아티스트 검색"
            className="flex-1 bg-transparent text-sm text-white placeholder:text-white/30 outline-none"
          />
        </div>

        {/* Genre Filter */}
        <div className="flex gap-2">
          {(['전체', '발라드', '팝', 'R&B'] as const).map(g => (
            <button key={g} onClick={() => setFilter(g)}
              className="px-3 py-1.5 rounded-full text-xs font-bold transition-all"
              style={{
                background: filter === g ? 'oklch(0.60 0.22 280)' : 'oklch(1 0 0 / 8%)',
                color: filter === g ? 'white' : 'oklch(0.55 0.05 255)',
              }}>
              {g}
            </button>
          ))}
        </div>

        {/* Song List */}
        <div className="space-y-2.5">
          {filtered.map(song => (
            <div key={song.id} className="bg-card-gradient rounded-2xl p-4 flex items-center gap-3">
              {/* Thumbnail */}
              <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 relative">
                <img
                  src={`https://img.youtube.com/vi/${song.youtubeId}/mqdefault.jpg`}
                  alt={song.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'oklch(0 0 0 / 30%)' }}>
                  <Play size={16} className="text-white" fill="white" />
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate">{song.title}</p>
                <p className="text-xs mt-0.5 truncate" style={{ color: 'oklch(0.55 0.05 255)' }}>{song.artist}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                    style={{ background: `${difficultyColor[song.difficulty]}22`, color: difficultyColor[song.difficulty] }}>
                    {song.difficulty}
                  </span>
                  <span className="text-[10px]" style={{ color: 'oklch(0.45 0.05 255)' }}>Key: {song.key} · {song.bpm} BPM</span>
                </div>
              </div>

              <div className="flex flex-col items-center gap-2">
                <button onClick={() => toggleFav(song.id)}>
                  <Heart size={16} fill={favorites.includes(song.id) ? '#FF6B6B' : 'none'} style={{ color: favorites.includes(song.id) ? '#FF6B6B' : 'oklch(0.45 0.05 255)' }} />
                </button>
                <button onClick={() => navigate(`/songs/${song.id}`)}>
                  <ChevronRight size={16} style={{ color: 'oklch(0.45 0.05 255)' }} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
