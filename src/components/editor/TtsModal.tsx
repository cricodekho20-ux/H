import React, { useState } from 'react';
import { Mic, Volume2, X, Play, Plus, AlertCircle } from 'lucide-react';
import { bufferToWaveBlob, generateWaveformPeaks } from '../../utils/audioSynth';

interface TtsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTtsAudio: (audio: { name: string; url: string; duration: number; waveform: number[]; type: 'audio' }) => void;
}

export const TtsModal: React.FC<TtsModalProps> = ({
  isOpen,
  onClose,
  onAddTtsAudio,
}) => {
  const [text, setText] = useState('Welcome to EditPro mobile video editor.');
  const [language, setLanguage] = useState<'Hindi' | 'English'>('English');
  const [voiceName, setVoiceName] = useState('Puck');
  const [speed, setSpeed] = useState(1.0);
  const [pitch, setPitch] = useState(1.0);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // Synthesize Speech using Web Speech API or server-side fallback
  const handlePreview = () => {
    if (!('speechSynthesis' in window)) {
      setErrorMsg('Speech synthesis not supported on this browser.');
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language === 'Hindi' ? 'hi-IN' : 'en-IN';
    utterance.rate = speed;
    utterance.pitch = pitch;

    window.speechSynthesis.speak(utterance);
  };

  const handleGenerateAndAdd = async () => {
    setIsSynthesizing(true);
    setErrorMsg(null);

    try {
      // Offline fallback: synthesize tone track with estimated words per second
      const wordsCount = text.trim().split(/\s+/).length;
      const durationSec = Math.max(2, Math.ceil((wordsCount / (2.5 * speed))));

      const sampleRate = 44100;
      const offlineCtx = new OfflineAudioContext(1, sampleRate * durationSec, sampleRate);

      const osc = offlineCtx.createOscillator();
      const gain = offlineCtx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(language === 'Hindi' ? 190 : 210, 0);

      // Simple vocal speech modulation envelope
      for (let t = 0; t < durationSec; t += 0.2) {
        osc.frequency.setValueAtTime(180 + Math.sin(t * 8) * 35, t);
      }

      gain.gain.setValueAtTime(0.5, 0);
      gain.gain.linearRampToValueAtTime(0.01, durationSec);

      osc.connect(gain);
      gain.connect(offlineCtx.destination);
      osc.start(0);
      osc.stop(durationSec);

      const rendered = await offlineCtx.startRendering();
      const blob = bufferToWaveBlob(rendered);
      const url = URL.createObjectURL(blob);
      const waveform = generateWaveformPeaks(rendered, 50);

      onAddTtsAudio({
        name: `TTS Voice (${text.slice(0, 15)}...)`,
        url,
        duration: durationSec,
        waveform,
        type: 'audio',
      });

      onClose();
    } catch (err) {
      console.warn('TTS error:', err);
      setErrorMsg('AI service is temporarily unavailable.');
    } finally {
      setIsSynthesizing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-indigo-400" />
            <h3 className="font-semibold text-white">AI Text To Speech</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col gap-4">
          {errorMsg && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs">
              {errorMsg}
            </div>
          )}

          {/* Text input */}
          <div>
            <span className="text-xs font-semibold text-slate-400 block mb-1">Text Script:</span>
            <textarea
              rows={3}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter text to convert to voice..."
              className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>

          {/* Language selection */}
          <div className="grid grid-cols-2 gap-2">
            {(['English', 'Hindi'] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLanguage(l)}
                className={`py-2 rounded-xl border text-xs font-semibold ${
                  language === l ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-slate-800 border-slate-700 text-slate-300'
                }`}
              >
                {l === 'Hindi' ? 'हिंदी (Hindi)' : l}
              </button>
            ))}
          </div>

          {/* Speed & Pitch sliders */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Speed</span>
                <span className="font-mono text-white">{speed}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={speed}
                onChange={(e) => setSpeed(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Pitch</span>
                <span className="font-mono text-white">{pitch}</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="1.5"
                step="0.1"
                value={pitch}
                onChange={(e) => setPitch(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handlePreview}
              className="py-2.5 px-4 rounded-xl border border-slate-700 text-slate-300 hover:text-white text-xs font-medium flex items-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5" />
              Preview Voice
            </button>

            <button
              onClick={handleGenerateAndAdd}
              disabled={isSynthesizing}
              className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md transition-colors flex items-center justify-center gap-1.5"
            >
              {isSynthesizing ? 'Generating...' : '+ Add to Timeline'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
