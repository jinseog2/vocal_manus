import { useRef, useCallback } from 'react';
import { noteToFrequency } from './usePitchDetection';

// Web Audio API로 피아노 음정을 합성하는 훅
// 실제 피아노 음색을 모방하기 위해 하모닉스(배음) 합성 사용
export function useAudioGuide() {
  const audioCtxRef = useRef<AudioContext | null>(null);

  const getCtx = useCallback(() => {
    if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
      audioCtxRef.current = new AudioContext();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  // 피아노 음색 합성: 기본음 + 배음 구조
  const playNote = useCallback((midi: number, duration = 1.0, volume = 0.5) => {
    const ctx = getCtx();
    const freq = noteToFrequency(midi);
    const now = ctx.currentTime;

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0, now);
    masterGain.gain.linearRampToValueAtTime(volume, now + 0.01);
    masterGain.gain.exponentialRampToValueAtTime(volume * 0.7, now + 0.1);
    masterGain.gain.exponentialRampToValueAtTime(volume * 0.3, now + duration * 0.6);
    masterGain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    masterGain.connect(ctx.destination);

    // 배음 구조로 피아노 음색 근사
    const harmonics = [
      { ratio: 1, gain: 1.0 },
      { ratio: 2, gain: 0.5 },
      { ratio: 3, gain: 0.25 },
      { ratio: 4, gain: 0.12 },
      { ratio: 5, gain: 0.06 },
      { ratio: 6, gain: 0.03 },
    ];

    harmonics.forEach(({ ratio, gain }) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.type = ratio === 1 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq * ratio, now);
      gainNode.gain.setValueAtTime(gain, now);
      osc.connect(gainNode);
      gainNode.connect(masterGain);
      osc.start(now);
      osc.stop(now + duration + 0.1);
    });
  }, [getCtx]);

  // 스케일 시퀀스 재생 (도레미파솔라시도)
  const playScale = useCallback(async (
    startMidi: number,
    ascending = true,
    noteDuration = 0.4,
    gap = 0.05
  ) => {
    const ctx = getCtx();
    const intervals = [0, 2, 4, 5, 7, 9, 11, 12];
    const sequence = ascending ? intervals : [...intervals].reverse();
    let time = ctx.currentTime;

    sequence.forEach((interval) => {
      const midi = startMidi + interval;
      const freq = noteToFrequency(midi);
      const now = time;

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0, now);
      masterGain.gain.linearRampToValueAtTime(0.4, now + 0.01);
      masterGain.gain.exponentialRampToValueAtTime(0.15, now + noteDuration * 0.7);
      masterGain.gain.exponentialRampToValueAtTime(0.001, now + noteDuration);
      masterGain.connect(ctx.destination);

      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      osc.connect(masterGain);
      osc.start(now);
      osc.stop(now + noteDuration);

      const osc2 = ctx.createOscillator();
      const g2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(freq * 2, now);
      g2.gain.setValueAtTime(0.2, now);
      osc2.connect(g2);
      g2.connect(masterGain);
      osc2.start(now);
      osc2.stop(now + noteDuration);

      time += noteDuration + gap;
    });

    return new Promise<void>(resolve => setTimeout(resolve, (noteDuration + gap) * sequence.length * 1000 + 200));
  }, [getCtx]);

  // 아르페지오 코드 재생 (워밍업용)
  const playArpeggio = useCallback((rootMidi: number, type: 'major' | 'minor' = 'major') => {
    const intervals = type === 'major' ? [0, 4, 7, 12] : [0, 3, 7, 12];
    intervals.forEach((interval, i) => {
      setTimeout(() => playNote(rootMidi + interval, 0.8, 0.35), i * 120);
    });
  }, [playNote]);

  // 단음 기준음 재생 (피치 모드 기준음)
  const playReferenceNote = useCallback((midi: number) => {
    playNote(midi, 2.0, 0.4);
  }, [playNote]);

  // 성공/실패 효과음
  const playSuccess = useCallback(() => {
    const ctx = getCtx();
    const now = ctx.currentTime;
    [60, 64, 67, 72].forEach((midi, i) => {
      const freq = noteToFrequency(midi);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.1);
      gain.gain.setValueAtTime(0.3, now + i * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.1);
      osc.stop(now + i * 0.1 + 0.4);
    });
  }, [getCtx]);

  const playFail = useCallback(() => {
    const ctx = getCtx();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.3);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.35);
  }, [getCtx]);

  const playClick = useCallback(() => {
    const ctx = getCtx();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.06);
  }, [getCtx]);

  return { playNote, playScale, playArpeggio, playReferenceNote, playSuccess, playFail, playClick };
}
