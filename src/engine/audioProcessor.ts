import { VoiceChangerEffect } from '../types/editor';

// Offline Audio Processing & Beat Detection using Web Audio API
export async function detectAudioBeats(audioBuffer: AudioBuffer, bpmThreshold = 0.5): Promise<number[]> {
  const channelData = audioBuffer.getChannelData(0);
  const sampleRate = audioBuffer.sampleRate;
  const bufferLength = channelData.length;

  // Window size of ~0.05 seconds
  const windowSize = Math.floor(sampleRate * 0.05);
  const energies: number[] = [];

  for (let i = 0; i < bufferLength; i += windowSize) {
    let sum = 0;
    const end = Math.min(i + windowSize, bufferLength);
    for (let j = i; j < end; j++) {
      sum += channelData[j] * channelData[j];
    }
    energies.push(sum / (end - i || 1));
  }

  // Find local energy peaks that exceed average local energy by threshold
  const beatTimes: number[] = [];
  const localSpan = 15; // surrounding windows

  for (let i = localSpan; i < energies.length - localSpan; i++) {
    let localAvg = 0;
    for (let j = i - localSpan; j <= i + localSpan; j++) {
      localAvg += energies[j];
    }
    localAvg /= (localSpan * 2 + 1);

    if (energies[i] > localAvg * (1 + bpmThreshold) && energies[i] > energies[i - 1] && energies[i] > energies[i + 1]) {
      const timeSec = (i * windowSize) / sampleRate;
      // Minimum interval of 0.25s between beats
      if (beatTimes.length === 0 || timeSec - beatTimes[beatTimes.length - 1] > 0.25) {
        beatTimes.push(Number(timeSec.toFixed(2)));
      }
    }
  }

  return beatTimes;
}

// Apply voice changer filter nodes in Web Audio chain
export function applyVoiceChangerNodes(
  ctx: BaseAudioContext,
  source: AudioNode,
  destination: AudioNode,
  effect: VoiceChangerEffect
) {
  if (effect === 'none') {
    source.connect(destination);
    return;
  }

  if (effect === 'deep') {
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowshelf';
    filter.frequency.value = 350;
    filter.gain.value = 14;

    const highCut = ctx.createBiquadFilter();
    highCut.type = 'lowpass';
    highCut.frequency.value = 2200;

    source.connect(filter);
    filter.connect(highCut);
    highCut.connect(destination);
  } else if (effect === 'high') {
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 900;
    filter.gain.value = 10;

    source.connect(filter);
    filter.connect(destination);
  } else if (effect === 'robot') {
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = 50;

    const ringMod = ctx.createGain();
    ringMod.gain.value = 0;

    const carrier = ctx.createGain();
    carrier.gain.value = 0.5;

    osc.connect(ringMod.gain);
    source.connect(ringMod);
    ringMod.connect(destination);
    osc.start(0);
  } else if (effect === 'echo') {
    const delay = ctx.createDelay();
    delay.delayTime.value = 0.22;

    const feedback = ctx.createGain();
    feedback.gain.value = 0.45;

    delay.connect(feedback);
    feedback.connect(delay);

    source.connect(destination);
    source.connect(delay);
    delay.connect(destination);
  } else if (effect === 'radio') {
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1800;
    filter.Q.value = 2.5;

    const dist = ctx.createWaveShaper();
    dist.curve = makeDistortionCurve(15) as any;

    source.connect(filter);
    filter.connect(dist);
    dist.connect(destination);
  } else if (effect === 'low') {
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 800;
    source.connect(filter);
    filter.connect(destination);
  }
}

function makeDistortionCurve(amount = 20): Float32Array {
  const k = amount;
  const n = 22050;
  const curve = new Float32Array(n);
  const deg = Math.PI / 180;
  for (let i = 0; i < n; ++i) {
    const x = (i * 2) / n - 1;
    curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
  }
  return curve;
}
