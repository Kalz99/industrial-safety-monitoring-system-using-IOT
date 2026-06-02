import { useEffect, useRef } from 'react';

/**
 * Custom React hook to play a continuous, high-fidelity pulsing industrial alarm
 * synthesized dynamically using the Web Audio API. Stops immediately when instructed.
 */
export const useAlarmSound = (isPlaying: boolean) => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isPlaying) {
      cleanup();
      return;
    }

    try {
      // 1. Initialize Audio Context cleanly
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioContextClass();
      audioContextRef.current = audioCtx;

      // 2. Define the pulsing siren dual-oscillator tone
      const playTone = () => {
        if (!audioCtx || audioCtx.state === 'closed') return;

        const osc1 = audioCtx.createOscillator();
        const osc2 = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        osc1.type = 'sawtooth';
        osc2.type = 'sine';

        // Detuned frequencies to create industrial alarm tension (dissonance)
        osc1.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 frequency
        osc2.frequency.setValueAtTime(883, audioCtx.currentTime); // 3Hz detune

        // High urgency gain envelope
        gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.12, audioCtx.currentTime + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);

        osc1.connect(gainNode);
        osc2.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        osc1.start();
        osc2.start();

        osc1.stop(audioCtx.currentTime + 0.35);
        osc2.stop(audioCtx.currentTime + 0.35);
      };

      // 3. Play double pulsing alarm siren on a continuous loop
      const triggerDoubleBeep = () => {
        playTone();
        setTimeout(() => {
          playTone();
        }, 400);
      };

      // Play immediately on mount
      triggerDoubleBeep();

      // Loop the warning double beep alarm every 1.4 seconds continuously
      const intervalId = window.setInterval(triggerDoubleBeep, 1400);
      intervalRef.current = intervalId;

    } catch (error) {
      console.warn('Fidelity Web Audio Context blocked or unsupported:', error);
    }

    return () => {
      cleanup();
    };
  }, [isPlaying]);

  const cleanup = () => {
    // Stop the alarm loop interval
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    // Cleanly close the browser Audio Context
    if (audioContextRef.current) {
      if (audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch((err) => {
          console.warn('Error closing AudioContext:', err);
        });
      }
      audioContextRef.current = null;
    }
  };
};

export default useAlarmSound;
