import { useState, useCallback, useRef } from 'react';

interface UseScreenShareReturn {
  screenStream: MediaStream | null;
  isSharing: boolean;
  hasAudio: boolean;
  startScreenShare: (micStream?: MediaStream | null) => Promise<MediaStream | null>;
  stopScreenShare: () => void;
  error: string | null;
}

export const useScreenShareWithAudio = (
  onEndedCallback?: () => void
): UseScreenShareReturn => {
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [hasAudio, setHasAudio] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const mixedDestinationRef = useRef<MediaStreamAudioDestinationNode | null>(null);

  const stopScreenShare = useCallback(() => {
    if (screenStream) {
      screenStream.getTracks().forEach((track) => track.stop());
      setScreenStream(null);
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    setIsSharing(false);
    setHasAudio(false);
    setError(null);
    if (onEndedCallback) {
      onEndedCallback();
    }
  }, [screenStream, onEndedCallback]);

  const startScreenShare = useCallback(
    async (micStream?: MediaStream | null): Promise<MediaStream | null> => {
      try {
        setError(null);
        // Request display media with full video and audio capabilities
        const displayStream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            cursor: 'always',
            displaySurface: 'monitor',
          } as MediaTrackConstraints,
          audio: {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
          },
        });

        const displayAudioTracks = displayStream.getAudioTracks();
        const hasScreenAudio = displayAudioTracks.length > 0;
        setHasAudio(hasScreenAudio);

        let finalStream = displayStream;

        // If screen has audio AND participant has active mic, mix them together with Web Audio API!
        if (hasScreenAudio && micStream && micStream.getAudioTracks().length > 0) {
          try {
            const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
            const audioCtx = new AudioCtx();
            audioContextRef.current = audioCtx;

            const destination = audioCtx.createMediaStreamDestination();
            mixedDestinationRef.current = destination;

            // Connect screen audio
            const screenSource = audioCtx.createMediaStreamSource(
              new MediaStream([displayAudioTracks[0]])
            );
            screenSource.connect(destination);

            // Connect mic audio with slight attenuation so both can be clearly heard
            const micSource = audioCtx.createMediaStreamSource(
              new MediaStream([micStream.getAudioTracks()[0]])
            );
            const micGain = audioCtx.createGain();
            micGain.gain.value = 1.0;
            micSource.connect(micGain);
            micGain.connect(destination);

            // Compose mixed output stream
            finalStream = new MediaStream([
              ...displayStream.getVideoTracks(),
              ...destination.stream.getAudioTracks(),
            ]);
          } catch (audioMixErr) {
            console.warn('Could not mix screen audio with mic, using native screen stream:', audioMixErr);
            finalStream = displayStream;
          }
        }

        // Listen for user stopping screen share via browser floating controls
        displayStream.getVideoTracks()[0].onended = () => {
          stopScreenShare();
        };

        setScreenStream(finalStream);
        setIsSharing(true);
        return finalStream;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Screen sharing was cancelled or denied.';
        console.warn('Screen share error:', message);
        setError(message);
        return null;
      }
    },
    [stopScreenShare]
  );

  return {
    screenStream,
    isSharing,
    hasAudio,
    startScreenShare,
    stopScreenShare,
    error,
  };
};
