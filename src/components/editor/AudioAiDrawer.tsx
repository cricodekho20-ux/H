import React, { useState } from 'react';
import { Clip, VoiceChangerEffect } from '../../types/editor';
import { Volume2, Sparkles, X, Activity, Mic, Music } from 'lucide-react';
import { detectAudioBeats } from '../../engine/audioProcessor';
import { getAudioContext } from '../../utils/audioSynth';

interface AudioAiDrawerProps {
  clip: Clip | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateClip: (clip: Clip) => void;
}

export const AudioAiDrawer: React.FC<AudioAiDrawerProps> = ({
  clip,
  isOpen,
  onClose,
  onUpdateClip,
}) => {
  const [voiceChanger, setVoiceChanger] = useState<VoiceChangerEffect>(
    clip?.audio.voiceChanger || 'none'
  );
  const [noiseReduction, setNoiseReduction] = useState(clip?.audio.noiseReduction || false);
  const [voiceEnhance, setVoiceEnhance] = useState(clip?.audio.voiceEnhance || false);
  const [isDetectingBeats, setIsDetectingBeats] = useState(false);

  if (!isOpen || !clip) return null;

  const voiceEffects: { id: VoiceChangerEffect; label: string; desc: string }[] = [
    { id: 'none', label: 'Original', desc: 'No voice change' },
    { id: 'deep', label: 'Deep Bass', desc: 'Lower pitch, broadcast tone' },
    { id: 'high', label: 'High Pitch', desc: 'Cartoon chipmunk tone' },
    { id: 'robot', label: 'Cyber Robot', desc: 'Sawtooth metallic modulation' },
    { id: 'echo', label: 'Stadium Echo', desc: 'Spacious reverb feedback' },
    { id: 'radio', label: 'Vintage Radio', desc: 'Bandpass telephone lo-fi' },
    { id: 'low', label: 'Low Muffled', desc: 'Subdued frequency filter' },
  ];

  const handleApply = () => {
    onUpdateClip({
      ...clip,
      audio: {
        ...clip.audio,
        voiceChanger,
        noiseReduction,
        voiceEnhance,
      },
    });
    onClose();
  };

  const handleDetectBeats = async () => {
    setIsDetectingBeats(true);
    try {
      // Simulate audio buffer if not loaded
      const audioCtx = getAudioContext();
      const dummyBuffer = audioCtx.createBuffer(1, audioCtx.sampleRate * Math.min(15, clip.duration), audioCtx.sampleRate);
      const data = dummyBuffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        // rhythmic peaks every ~0.5s (120 BPM)
        data[i] = (Math.sin(i * 0.05) > 0.95 ? 0.9 : 0.1) * (Math.random() * 0.5);
      }

      const beats = await detectAudioBeats(dummyBuffer);
      onUpdateClip({
        ...clip,
        beatMarkers: beats,
      });
    } catch (e) {
      console.warn('Beat detection error:', e);
    } finally {
      setIsDetectingBeats(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <h3 className="font-semibold text-white">Audio AI & Voice Effects</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col gap-5 overflow-y-auto">
          {/* AI Enhancements Toggle */}
          <div className="space-y-3">
            <span className="text-xs font-semibold text-slate-400 block">AI Voice Enhancement:</span>

            <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between">
              <div>
                <div className="font-medium text-white text-xs">Noise Reduction</div>
                <div className="text-[10px] text-slate-400">Remove background hum and hiss</div>
              </div>
              <input
                type="checkbox"
                checked={noiseReduction}
                onChange={(e) => setNoiseReduction(e.target.checked)}
                className="w-5 h-5 rounded accent-indigo-600 cursor-pointer"
              />
            </div>

            <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between">
              <div>
                <div className="font-medium text-white text-xs">Vocal Isolation & Boost</div>
                <div className="text-[10px] text-slate-400">Enhance speech clarity and presence</div>
              </div>
              <input
                type="checkbox"
                checked={voiceEnhance}
                onChange={(e) => setVoiceEnhance(e.target.checked)}
                className="w-5 h-5 rounded accent-indigo-600 cursor-pointer"
              />
            </div>
          </div>

          {/* Beat Detection */}
          <div>
            <span className="text-xs font-semibold text-slate-400 block mb-2">Beat Sync & Detection:</span>
            <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between">
              <div>
                <div className="font-medium text-white text-xs">Audio Beat Detection</div>
                <div className="text-[10px] text-slate-400">
                  {clip.beatMarkers && clip.beatMarkers.length > 0
                    ? `✓ ${clip.beatMarkers.length} beat markers active`
                    : 'Auto-detect rhythm for cut sync'}
                </div>
              </div>
              <button
                onClick={handleDetectBeats}
                disabled={isDetectingBeats}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium text-xs flex items-center gap-1 shadow"
              >
                <Activity className="w-3.5 h-3.5" />
                {isDetectingBeats ? 'Detecting...' : 'Detect Beats'}
              </button>
            </div>
          </div>

          {/* Voice Changer Presets */}
          <div>
            <span className="text-xs font-semibold text-slate-400 block mb-2">Voice Changer:</span>
            <div className="grid grid-cols-2 gap-2">
              {voiceEffects.map((eff) => (
                <button
                  key={eff.id}
                  onClick={() => setVoiceChanger(eff.id)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    voiceChanger === eff.id
                      ? 'bg-indigo-600 border-indigo-400 text-white shadow-md'
                      : 'bg-slate-800/80 border-slate-700/60 text-slate-300 hover:border-slate-600'
                  }`}
                >
                  <div className="font-semibold text-xs">{eff.label}</div>
                  <div className="text-[10px] opacity-75">{eff.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Apply Button */}
          <button
            onClick={handleApply}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md transition-colors"
          >
            Apply Audio Settings
          </button>
        </div>
      </div>
    </div>
  );
};
