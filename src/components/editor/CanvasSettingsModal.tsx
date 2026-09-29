import React, { useState } from 'react';
import { AspectRatio, CanvasSettings } from '../../types/editor';
import { Ratio, X, Palette, Check, RefreshCw } from 'lucide-react';
import { t } from '../../utils/i18n';

interface CanvasSettingsModalProps {
  currentRatio: AspectRatio;
  currentSettings?: CanvasSettings;
  isOpen: boolean;
  onClose: () => void;
  onApply: (ratio: AspectRatio, settings: CanvasSettings) => void;
  onAutoReframe: (targetRatio: AspectRatio) => void;
}

export const CanvasSettingsModal: React.FC<CanvasSettingsModalProps> = ({
  currentRatio,
  currentSettings,
  isOpen,
  onClose,
  onApply,
  onAutoReframe,
}) => {
  const [ratio, setRatio] = useState<AspectRatio>(currentRatio);
  const [bgType, setBgType] = useState<'color' | 'gradient' | 'blur' | 'image'>(
    currentSettings?.backgroundType || 'color'
  );
  const [bgColor, setBgColor] = useState(currentSettings?.backgroundColor || '#090d16');
  const [grad1, setGrad1] = useState(currentSettings?.gradientColors?.[0] || '#1e1b4b');
  const [grad2, setGrad2] = useState(currentSettings?.gradientColors?.[1] || '#4338ca');

  if (!isOpen) return null;

  const ratios: { id: AspectRatio; label: string; desc: string }[] = [
    { id: '9:16', label: '9:16', desc: 'Shorts & Reels' },
    { id: '16:9', label: '16:9', desc: 'YouTube' },
    { id: '1:1', label: '1:1', desc: 'Square' },
    { id: '4:3', label: '4:3', desc: 'Classic' },
    { id: '3:4', label: '3:4', desc: 'Portrait' },
    { id: '21:9', label: '21:9', desc: 'Cinematic Ultrawide' },
  ];

  const handleSave = () => {
    const settings: CanvasSettings = {
      aspectRatio: ratio,
      backgroundType: bgType,
      backgroundColor: bgColor,
      gradientColors: [grad1, grad2],
    };
    onApply(ratio, settings);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Ratio className="w-5 h-5 text-indigo-400" />
            <h3 className="font-semibold text-white">Project Canvas Settings</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col gap-5">
          {/* Aspect Ratio Presets */}
          <div>
            <span className="text-xs font-semibold text-slate-400 block mb-2">Canvas Aspect Ratio:</span>
            <div className="grid grid-cols-3 gap-2">
              {ratios.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setRatio(r.id)}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    ratio === r.id
                      ? 'bg-indigo-600 border-indigo-400 text-white shadow-md'
                      : 'bg-slate-800/80 border-slate-700/60 text-slate-300 hover:border-slate-600'
                  }`}
                >
                  <div className="font-bold text-xs">{r.label}</div>
                  <div className="text-[10px] opacity-75">{r.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Auto Reframe */}
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <div className="font-semibold text-white text-xs">Auto Reframe Subject</div>
              <div className="text-[10px] text-slate-400">Keep center of interest focused</div>
            </div>
            <button
              onClick={() => onAutoReframe(ratio)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 text-xs font-medium border border-indigo-500/30 flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              Reframe Now
            </button>
          </div>

          {/* Canvas Background Settings */}
          <div>
            <span className="text-xs font-semibold text-slate-400 block mb-2">Canvas Background:</span>
            <div className="grid grid-cols-3 p-1 mb-3 bg-slate-950 rounded-xl border border-slate-800">
              {(['color', 'gradient', 'blur'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setBgType(t)}
                  className={`py-1.5 text-xs font-semibold rounded-lg capitalize transition-colors ${
                    bgType === t ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {bgType === 'color' && (
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400">Background Color:</span>
                <input
                  type="color"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="w-8 h-8 rounded border border-slate-700 cursor-pointer"
                />
                <span className="text-xs font-mono text-slate-400">{bgColor}</span>
              </div>
            )}

            {bgType === 'gradient' && (
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Color 1:</span>
                  <input
                    type="color"
                    value={grad1}
                    onChange={(e) => setGrad1(e.target.value)}
                    className="w-8 h-8 rounded border border-slate-700 cursor-pointer"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Color 2:</span>
                  <input
                    type="color"
                    value={grad2}
                    onChange={(e) => setGrad2(e.target.value)}
                    className="w-8 h-8 rounded border border-slate-700 cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Apply Button */}
          <button
            onClick={handleSave}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md transition-colors"
          >
            Apply Canvas Settings
          </button>
        </div>
      </div>
    </div>
  );
};
