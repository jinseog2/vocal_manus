import { useRef, useState, useCallback, useEffect } from 'react';

// Note names for display
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export function frequencyToNote(freq: number): { note: string; octave: number; cents: number; midi: number } {
  if (freq <= 0) return { note: '-', octave: 0, cents: 0, midi: 0 };
  const midi = 12 * Math.log2(freq / 440) + 69;
  const midiRounded = Math.round(midi);
  const cents = Math.round((midi - midiRounded) * 100);
  const octave = Math.floor(midiRounded / 12) - 1;
  const noteIndex = ((midiRounded % 12) + 12) % 12;
  return { note: NOTE_NAMES[noteIndex], octave, cents, midi: midiRounded };
}

export function noteToFrequency(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

// YIN pitch detection algorithm
function yinPitchDetect(buffer: Float32Array, sampleRate: number): number {
  const bufferSize = buffer.length;
  const halfSize = Math.floor(bufferSize / 2);
  const threshold = 0.10;
  const yinBuffer = new Float32Array(halfSize);

  // Step 1: Autocorrelation difference function
  yinBuffer[0] = 1;
  let runningSum = 0;

  for (let tau = 1; tau < halfSize; tau++) {
    let sum = 0;
    for (let i = 0; i < halfSize; i++) {
      const delta = buffer[i] - buffer[i + tau];
      sum += delta * delta;
    }
    yinBuffer[tau] = sum;
    runningSum += sum;
    // Cumulative mean normalized difference
    yinBuffer[tau] *= tau / runningSum;
  }

  // Step 2: Find first dip below threshold
  let tau = 2;
  while (tau < halfSize) {
    if (yinBuffer[tau] < threshold) {
      while (tau + 1 < halfSize && yinBuffer[tau + 1] < yinBuffer[tau]) {
        tau++;
      }
      // Parabolic interpolation
      const prev = tau > 0 ? yinBuffer[tau - 1] : yinBuffer[tau];
      const curr = yinBuffer[tau];
      const next = tau + 1 < halfSize ? yinBuffer[tau + 1] : yinBuffer[tau];
      const betterTau = tau + (next - prev) / (2 * (2 * curr - next - prev));
      return sampleRate / betterTau;
    }
    tau++;
  }
  return -1;
}

export interface PitchPoint {
  time: number;
  frequency: number;
  note: string;
  octave: number;
  midi: number;
}

export function usePitchDetection() {
  const [isListening, setIsListening] = useState(false);
  const [currentPitch, setCurrentPitch] = useState<PitchPoint | null>(null);
  const [pitchHistory, setPitchHistory] = useState<PitchPoint[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [volume, setVolume] = useState(0);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);

  const stopListening = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    if (sourceRef.current) { sourceRef.current.disconnect(); sourceRef.current = null; }
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    if (audioCtxRef.current) { audioCtxRef.current.close(); audioCtxRef.current = null; }
    analyserRef.current = null;
    setIsListening(false);
  }, []);

  const startListening = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false }, video: false });
      streamRef.current = stream;

      const audioCtx = new AudioContext({ sampleRate: 44100 });
      audioCtxRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.0;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);
      sourceRef.current = source;

      startTimeRef.current = performance.now();
      setPitchHistory([]);
      setIsListening(true);

      const buffer = new Float32Array(analyser.fftSize);

      const detect = () => {
        analyser.getFloatTimeDomainData(buffer);

        // Calculate RMS volume
        let rms = 0;
        for (let i = 0; i < buffer.length; i++) rms += buffer[i] * buffer[i];
        rms = Math.sqrt(rms / buffer.length);
        setVolume(Math.min(1, rms * 8));

        const freq = yinPitchDetect(buffer, audioCtx.sampleRate);
        const elapsed = (performance.now() - startTimeRef.current) / 1000;

        if (freq > 60 && freq < 1400 && rms > 0.01) {
          const { note, octave, midi } = frequencyToNote(freq);
          const point: PitchPoint = { time: elapsed, frequency: freq, note, octave, midi };
          setCurrentPitch(point);
          setPitchHistory(prev => {
            const next = [...prev, point];
            return next.length > 300 ? next.slice(-300) : next;
          });
        } else if (rms < 0.005) {
          setCurrentPitch(null);
        }

        rafRef.current = requestAnimationFrame(detect);
      };
      rafRef.current = requestAnimationFrame(detect);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError('마이크 접근 권한이 필요합니다: ' + msg);
    }
  }, []);

  const clearHistory = useCallback(() => {
    setPitchHistory([]);
    startTimeRef.current = performance.now();
  }, []);

  useEffect(() => () => stopListening(), [stopListening]);

  return { isListening, currentPitch, pitchHistory, error, volume, startListening, stopListening, clearHistory };
}
