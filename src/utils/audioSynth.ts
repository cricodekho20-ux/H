// Offline Web Audio Synthesizer for 100% royalty-free, legal, zero-network music & sound effects

let audioCtx: AudioContext | null = null;

export function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// Convert AudioBuffer to WAV Blob
export function bufferToWaveBlob(abuffer: AudioBuffer): Blob {
  const numOfChan = abuffer.numberOfChannels;
  const length = abuffer.length * numOfChan * 2 + 44;
  const out = new DataView(new ArrayBuffer(length));
  const channels: Float32Array[] = [];
  let sampleRate = abuffer.sampleRate;
  let offset = 0;
  let pos = 0;

  function setUint16(data: number) {
    out.setUint16(pos, data, true);
    pos += 2;
  }
  function setUint32(data: number) {
    out.setUint32(pos, data, true);
    pos += 4;
  }

  // write WAVE header
  setUint32(0x46464952); // "RIFF"
  setUint32(length - 8); // file length - 8
  setUint32(0x45564157); // "WAVE"

  setUint32(0x20746d66); // "fmt " chunk
  setUint32(16); // length = 16
  setUint16(1); // PCM (uncompressed)
  setUint16(numOfChan);
  setUint32(sampleRate);
  setUint32(sampleRate * 2 * numOfChan); // avg. bytes/sec
  setUint16(numOfChan * 2); // block-align
  setUint16(16); // 16-bit

  setUint32(0x61746164); // "data" - chunk
  setUint32(length - pos - 4); // chunk length

  for (let i = 0; i < abuffer.numberOfChannels; i++) {
    channels.push(abuffer.getChannelData(i));
  }

  while (pos < length) {
    for (let i = 0; i < numOfChan; i++) {
      let sample = Math.max(-1, Math.min(1, channels[i][offset]));
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
      out.setInt16(pos, sample, true);
      pos += 2;
    }
    offset++;
  }

  return new Blob([out.buffer], { type: 'audio/wav' });
}

// Generates waveform peaks array (0..1) for timeline rendering
export function generateWaveformPeaks(buffer: AudioBuffer, numBars = 60): number[] {
  const channelData = buffer.getChannelData(0);
  const step = Math.floor(channelData.length / numBars);
  const peaks: number[] = [];

  for (let i = 0; i < numBars; i++) {
    let sum = 0;
    const start = i * step;
    const end = Math.min(start + step, channelData.length);
    for (let j = start; j < end; j++) {
      sum += Math.abs(channelData[j]);
    }
    const avg = sum / (end - start || 1);
    peaks.push(Math.min(1, Math.max(0.1, avg * 3.5)));
  }

  return peaks;
}

// Generate musical tracks offline using OfflineAudioContext
export async function synthesizeStockAudio(generatorName: string, durationSec = 15): Promise<{ blob: Blob; url: string; waveform: number[] }> {
  const sampleRate = 44100;
  const offlineCtx = new OfflineAudioContext(2, sampleRate * durationSec, sampleRate);

  const masterGain = offlineCtx.createGain();
  masterGain.gain.setValueAtTime(0.7, 0);
  masterGain.gain.linearRampToValueAtTime(0.7, durationSec - 1.5);
  masterGain.gain.linearRampToValueAtTime(0, durationSec);
  masterGain.connect(offlineCtx.destination);

  const t = offlineCtx.currentTime;

  if (generatorName === 'sfx_whoosh') {
    // Whoosh noise sweep
    const bufferSize = sampleRate * 0.6;
    const noiseBuffer = offlineCtx.createBuffer(1, bufferSize, sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    const whiteNoise = offlineCtx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;

    const filter = offlineCtx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.value = 3.0;
    filter.frequency.setValueAtTime(200, 0);
    filter.frequency.exponentialRampToValueAtTime(3200, 0.25);
    filter.frequency.exponentialRampToValueAtTime(300, 0.6);

    const gain = offlineCtx.createGain();
    gain.gain.setValueAtTime(0.01, 0);
    gain.gain.linearRampToValueAtTime(0.8, 0.25);
    gain.gain.linearRampToValueAtTime(0.001, 0.6);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);
    whiteNoise.start(0);
  } else if (generatorName === 'sfx_pop') {
    // Punchy pop
    const osc = offlineCtx.createOscillator();
    const gain = offlineCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, 0);
    osc.frequency.exponentialRampToValueAtTime(120, 0.15);
    gain.gain.setValueAtTime(0.9, 0);
    gain.gain.exponentialRampToValueAtTime(0.001, 0.15);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(0);
    osc.stop(0.15);
  } else if (generatorName === 'sfx_click') {
    // Fast tactile click
    const osc = offlineCtx.createOscillator();
    const gain = offlineCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1400, 0);
    osc.frequency.exponentialRampToValueAtTime(250, 0.05);
    gain.gain.setValueAtTime(0.8, 0);
    gain.gain.exponentialRampToValueAtTime(0.001, 0.05);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(0);
    osc.stop(0.05);
  } else if (generatorName === 'sfx_bell') {
    // Pleasant chime bell
    const freqs = [587.33, 880, 1174.66, 1760];
    freqs.forEach((freq, idx) => {
      const osc = offlineCtx.createOscillator();
      const gain = offlineCtx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.3 / (idx + 1), 0);
      gain.gain.exponentialRampToValueAtTime(0.0001, 1.8);
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(0);
      osc.stop(1.8);
    });
  } else if (generatorName === 'sfx_camera') {
    // Camera shutter click + advance
    const osc = offlineCtx.createOscillator();
    const gain = offlineCtx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(2200, 0);
    osc.frequency.linearRampToValueAtTime(400, 0.04);
    gain.gain.setValueAtTime(0.7, 0);
    gain.gain.linearRampToValueAtTime(0.01, 0.04);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(0);
    osc.stop(0.04);

    const osc2 = offlineCtx.createOscillator();
    const gain2 = offlineCtx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(1600, 0.06);
    osc2.frequency.linearRampToValueAtTime(300, 0.12);
    gain2.gain.setValueAtTime(0.5, 0.06);
    gain2.gain.linearRampToValueAtTime(0.01, 0.12);
    osc2.connect(gain2);
    gain2.connect(masterGain);
    osc2.start(0.06);
    osc2.stop(0.12);
  } else {
    // Dynamic musical beat generators (Cinematic, Travel, Vlog, News, Motivation)
    const bpm = generatorName === 'music_news' ? 128 : generatorName === 'music_travel' ? 105 : 120;
    const beatSec = 60 / bpm;
    const rootFreq = generatorName === 'music_cinematic' ? 110 : generatorName === 'music_news' ? 130.81 : 146.83; // A2, C3, D3

    // Bassline
    const bassNotes = [rootFreq, rootFreq * 1.334, rootFreq * 1.122, rootFreq * 0.89];
    let noteIdx = 0;
    for (let time = 0; time < durationSec; time += beatSec * 2) {
      const osc = offlineCtx.createOscillator();
      const gain = offlineCtx.createGain();
      osc.type = generatorName === 'music_tech' ? 'sawtooth' : 'sine';
      osc.frequency.setValueAtTime(bassNotes[noteIdx % bassNotes.length], time);
      gain.gain.setValueAtTime(0.35, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + beatSec * 1.8);

      const filter = offlineCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 400;

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(masterGain);
      osc.start(time);
      osc.stop(time + beatSec * 1.9);
      noteIdx++;
    }

    // Melodic Arpeggios / Chords
    const chordPitches = [rootFreq * 2, rootFreq * 2.5, rootFreq * 3, rootFreq * 3.75, rootFreq * 4];
    for (let time = 0; time < durationSec; time += beatSec / 2) {
      if (Math.sin(time) > -0.4) {
        const osc = offlineCtx.createOscillator();
        const gain = offlineCtx.createGain();
        osc.type = generatorName === 'music_vlog' ? 'sine' : 'triangle';
        const pitch = chordPitches[Math.floor(Math.abs(Math.sin(time * 3)) * chordPitches.length)];
        osc.frequency.setValueAtTime(pitch, time);
        gain.gain.setValueAtTime(0.18, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + beatSec * 0.45);
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(time);
        osc.stop(time + beatSec * 0.48);
      }
    }

    // Drum beat (Kick & Hi-hats)
    for (let time = 0; time < durationSec; time += beatSec) {
      // Kick on every beat or beats 1 and 3
      const kickOsc = offlineCtx.createOscillator();
      const kickGain = offlineCtx.createGain();
      kickOsc.frequency.setValueAtTime(150, time);
      kickOsc.frequency.exponentialRampToValueAtTime(45, time + 0.12);
      kickGain.gain.setValueAtTime(0.65, time);
      kickGain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
      kickOsc.connect(kickGain);
      kickGain.connect(masterGain);
      kickOsc.start(time);
      kickOsc.stop(time + 0.16);

      // Hi-hat on half beats
      const hatTime = time + beatSec / 2;
      if (hatTime < durationSec) {
        const hatOsc = offlineCtx.createOscillator();
        const hatGain = offlineCtx.createGain();
        hatOsc.type = 'square';
        hatOsc.frequency.setValueAtTime(6000, hatTime);
        hatGain.gain.setValueAtTime(0.08, hatTime);
        hatGain.gain.exponentialRampToValueAtTime(0.001, hatTime + 0.04);
        hatOsc.connect(hatGain);
        hatGain.connect(masterGain);
        hatOsc.start(hatTime);
        hatOsc.stop(hatTime + 0.05);
      }
    }
  }

  const renderedBuffer = await offlineCtx.startRendering();
  const blob = bufferToWaveBlob(renderedBuffer);
  const url = URL.createObjectURL(blob);
  const waveform = generateWaveformPeaks(renderedBuffer, 64);

  return { blob, url, waveform };
}

// Built-in catalog of royalty-free stock music and SFX
export const STOCK_SOUNDS: {
  id: string;
  name: string;
  category: 'News' | 'Cinematic' | 'Motivation' | 'Travel' | 'Vlog' | 'Emotional' | 'Tech' | 'Comedy' | 'SFX';
  duration: number;
  type: 'music' | 'sfx';
  generator: string;
}[] = [
  // Music
  { id: 'mus_1', name: 'Breaking News India', category: 'News', duration: 15, type: 'music', generator: 'music_news' },
  { id: 'mus_2', name: 'Cinematic Epic Drone', category: 'Cinematic', duration: 15, type: 'music', generator: 'music_cinematic' },
  { id: 'mus_3', name: 'Creator Motivation Beat', category: 'Motivation', duration: 15, type: 'music', generator: 'music_motivation' },
  { id: 'mus_4', name: 'Wanderlust India Travel', category: 'Travel', duration: 15, type: 'music', generator: 'music_travel' },
  { id: 'mus_5', name: 'Chai & Lo-Fi Vibes', category: 'Vlog', duration: 15, type: 'music', generator: 'music_vlog' },
  { id: 'mus_6', name: 'Emotional Story Piano', category: 'Emotional', duration: 15, type: 'music', generator: 'music_emotional' },
  { id: 'mus_7', name: 'Tech Future Innovation', category: 'Tech', duration: 15, type: 'music', generator: 'music_tech' },
  { id: 'mus_8', name: 'Fun Comedy Reel', category: 'Comedy', duration: 15, type: 'music', generator: 'music_comedy' },
  // SFX
  { id: 'sfx_1', name: 'Cinematic Whoosh', category: 'SFX', duration: 0.6, type: 'sfx', generator: 'sfx_whoosh' },
  { id: 'sfx_2', name: 'Sub Pop Sound', category: 'SFX', duration: 0.2, type: 'sfx', generator: 'sfx_pop' },
  { id: 'sfx_3', name: 'Modern Tap Click', category: 'SFX', duration: 0.1, type: 'sfx', generator: 'sfx_click' },
  { id: 'sfx_4', name: 'Notification Bell', category: 'SFX', duration: 1.8, type: 'sfx', generator: 'sfx_bell' },
  { id: 'sfx_5', name: 'DSLR Shutter Snap', category: 'SFX', duration: 0.3, type: 'sfx', generator: 'sfx_camera' },
];
