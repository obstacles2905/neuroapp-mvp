import {
  VOICE_CLIPPING_METERING_THRESHOLD,
  VOICE_SILENCE_METERING_THRESHOLD,
} from '@/lib/biometrics/constants/voice-capture.constants';
import { Audio } from 'expo-av';

export interface VoiceRecordingStopped {
  durationMs: number;
  meteringSamples: number[];
  uri: string;
}

export interface VoiceRecorderAdapter {
  start(): Promise<void>;
  stop(): Promise<VoiceRecordingStopped>;
  tickDurationMs(): Promise<number>;
}

function computeSilenceRatio(samples: readonly number[]): number {
  if (samples.length === 0) {
    return 1;
  }
  let silent = 0;
  for (const s of samples) {
    if (s < VOICE_SILENCE_METERING_THRESHOLD) {
      silent += 1;
    }
  }
  return silent / samples.length;
}

function computeMaxClippingRun(samples: readonly number[]): number {
  let run = 0;
  let maxRun = 0;
  for (const s of samples) {
    if (s >= VOICE_CLIPPING_METERING_THRESHOLD) {
      run += 1;
      maxRun = Math.max(maxRun, run);
    } else {
      run = 0;
    }
  }
  return maxRun;
}

export function meteringSilenceRatio(samples: readonly number[]): number {
  return computeSilenceRatio(samples);
}

export function meteringMaxClippingRun(samples: readonly number[]): number {
  return computeMaxClippingRun(samples);
}

export function meteringCoefficientOfVariation(samples: readonly number[]): number {
  if (samples.length < 2) {
    return 0;
  }
  const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
  const variance =
    samples.reduce((acc, x) => acc + (x - mean) ** 2, 0) / samples.length;
  const std = Math.sqrt(variance);
  if (Math.abs(mean) < 1e-6) {
    return std;
  }
  return std / Math.abs(mean);
}

export function createExpoVoiceRecorderAdapter(): VoiceRecorderAdapter {
  let recording: Audio.Recording | null = null;
  let pollId: ReturnType<typeof setInterval> | null = null;
  const meteringSamples: number[] = [];
  let lastDurationMs = 0;

  return {
    async start(): Promise<void> {
      const perm = await Audio.requestPermissionsAsync();
      if (!perm.granted) {
        throw new Error('microphone_denied');
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      meteringSamples.length = 0;
      lastDurationMs = 0;
      const rec = new Audio.Recording();
      await rec.prepareToRecordAsync({
        ...Audio.RecordingOptionsPresets.HIGH_QUALITY,
        isMeteringEnabled: true,
      });
      recording = rec;
      await rec.startAsync();
      pollId = setInterval(() => {
        void (async () => {
          const active = recording;
          if (active == null) {
            return;
          }
          try {
            const status = await active.getStatusAsync();
            if (status.durationMillis != null) {
              lastDurationMs = status.durationMillis;
            }
            if (status.isRecording && typeof status.metering === 'number') {
              meteringSamples.push(status.metering);
            }
          } catch {
            // игнорируем гонки при остановке
          }
        })();
      }, 90);
    },

    async tickDurationMs(): Promise<number> {
      const rec = recording;
      if (rec == null) {
        return 0;
      }
      try {
        const status = await rec.getStatusAsync();
        if (status.durationMillis != null) {
          lastDurationMs = status.durationMillis;
        }
        return lastDurationMs;
      } catch {
        return lastDurationMs;
      }
    },

    async stop(): Promise<VoiceRecordingStopped> {
      if (pollId != null) {
        clearInterval(pollId);
        pollId = null;
      }
      const rec = recording;
      if (rec == null) {
        throw new Error('not_recording');
      }
      await rec.stopAndUnloadAsync();
      recording = null;
      const uri = rec.getURI();
      if (uri == null) {
        throw new Error('recording_uri_missing');
      }
      return {
        durationMs: lastDurationMs,
        meteringSamples: [...meteringSamples],
        uri,
      };
    },
  };
}
