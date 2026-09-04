import { useEffect, useState, useRef } from 'react';

export const useAudioVisualizer = (
  stream: MediaStream | null,
  isMuted: boolean = false
): { volume: number; isSpeaking: boolean } => {
  const [volume, setVolume] = useState<number>(0);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const animationFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (!stream || isMuted || stream.getAudioTracks().length === 0) {
      setVolume(0);
      setIsSpeaking(false);
      return;
    }

    const audioTrack = stream.getAudioTracks()[0];
    if (!audioTrack || !audioTrack.enabled) {
      setVolume(0);
      setIsSpeaking(false);
      return;
    }

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.6;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const checkAudio = () => {
        analyser.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        const normalized = Math.min(100, Math.round((average / 128) * 100));

        setVolume(normalized);
        setIsSpeaking(normalized > 14);

        animationFrameRef.current = requestAnimationFrame(checkAudio);
      };

      checkAudio();

      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        if (audioCtx.state !== 'closed') {
          audioCtx.close().catch(() => {});
        }
      };
    } catch (err) {
      console.warn('Audio visualizer error:', err);
    }
  }, [stream, isMuted]);

  return { volume, isSpeaking };
};
