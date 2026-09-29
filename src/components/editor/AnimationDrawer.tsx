import React, { useState } from 'react';
import { Clip, InAnimation, OutAnimation, ComboAnimation } from '../../types/editor';
import { Sparkles, X, Check } from 'lucide-react';
import { t } from '../../utils/i18n';

interface AnimationDrawerProps {
  clip: Clip | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateClip: (clip: Clip) => void;
}

export const AnimationDrawer: React.FC<AnimationDrawerProps> = ({
  clip,
  isOpen,
  onClose,
  onUpdateClip,
}) => {
  const [category, setCategory] = useState<'in' | 'out' | 'combo'>('in');
  const [inAnim, setInAnim] = useState<InAnimation>(clip?.inAnimation?.type || 'none');
  const [outAnim, setOutAnim] = useState<OutAnimation>(clip?.outAnimation?.type || 'none');
  const [comboAnim, setComboAnim] = useState<ComboAnimation>(clip?.comboAnimation?.type || 'none');
  const [duration, setDuration] = useState<number>(clip?.inAnimation?.duration || 0.6);

  if (!isOpen || !clip) return null;

  const inAnimations: { id: InAnimation; label: string }[] = [
    { id: 'none', label: 'None' },
    { id: 'fade_in', label: 'Fade In' },
    { id: 'zoom_in', label: 'Zoom In' },
    { id: 'slide_left', label: 'Slide Left' },
    { id: 'slide_right', label: 'Slide Right' },
    { id: 'slide_up', label: 'Slide Up' },
    { id: 'slide_down', label: 'Slide Down' },
    { id: 'pop', label: 'Pop Elastic' },
    { id: 'bounce', label: 'Bounce In' },
    { id: 'rotate', label: 'Rotate Spin' },
    { id: 'blur_in', label: 'Blur In' },
    { id: 'elastic', label: 'Elastic Spring' },
    { id: 'light_in', label: 'Flash Light' },
  ];

  const outAnimations: { id: OutAnimation; label: string }[] = [
    { id: 'none', label: 'None' },
    { id: 'fade_out', label: 'Fade Out' },
    { id: 'zoom_out', label: 'Zoom Out' },
    { id: 'slide_left', label: 'Slide Left' },
    { id: 'slide_right', label: 'Slide Right' },
    { id: 'slide_up', label: 'Slide Up' },
    { id: 'slide_down', label: 'Slide Down' },
    { id: 'pop_out', label: 'Pop Out' },
    { id: 'bounce_out', label: 'Bounce Out' },
    { id: 'rotate_out', label: 'Rotate Out' },
    { id: 'blur_out', label: 'Blur Out' },
  ];

  const comboAnimations: { id: ComboAnimation; label: string }[] = [
    { id: 'none', label: 'None' },
    { id: 'zoom_rotate', label: 'Zoom + Rotate' },
    { id: 'shake_zoom', label: 'Shake + Zoom' },
    { id: 'bounce_scale', label: 'Bounce + Scale' },
    { id: 'slide_fade', label: 'Slide + Fade' },
    { id: 'pop_rotate', label: 'Pop + Rotate' },
  ];

  const handleApply = () => {
    onUpdateClip({
      ...clip,
      inAnimation: inAnim !== 'none' ? { type: inAnim, duration } : undefined,
      outAnimation: outAnim !== 'none' ? { type: outAnim, duration } : undefined,
      comboAnimation: comboAnim !== 'none' ? { type: comboAnim, duration } : undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <h3 className="font-semibold text-white">Animation System</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Tabs: In, Out, Combo */}
        <div className="grid grid-cols-3 p-1 m-4 bg-slate-950 rounded-xl border border-slate-800">
          <button
            onClick={() => setCategory('in')}
            className={`py-2 text-xs font-semibold rounded-lg capitalize transition-colors ${
              category === 'in' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            In Animation
          </button>
          <button
            onClick={() => setCategory('out')}
            className={`py-2 text-xs font-semibold rounded-lg capitalize transition-colors ${
              category === 'out' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Out Animation
          </button>
          <button
            onClick={() => setCategory('combo')}
            className={`py-2 text-xs font-semibold rounded-lg capitalize transition-colors ${
              category === 'combo' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Combo
          </button>
        </div>

        {/* Animation Duration Slider */}
        <div className="px-6 py-2">
          <div className="flex justify-between text-xs text-slate-400 mb-1">
            <span>Animation Duration</span>
            <span className="font-mono text-indigo-400 font-semibold">{duration}s</span>
          </div>
          <input
            type="range"
            min="0.1"
            max="2.5"
            step="0.1"
            value={duration}
            onChange={(e) => setDuration(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>

        {/* List of Animations */}
        <div className="p-6 pt-2 flex-1 overflow-y-auto">
          <div className="grid grid-cols-3 gap-2">
            {category === 'in' &&
              inAnimations.map((anim) => (
                <button
                  key={anim.id}
                  onClick={() => setInAnim(anim.id)}
                  className={`py-3 px-2 rounded-xl border text-center transition-all ${
                    inAnim === anim.id
                      ? 'bg-indigo-600 border-indigo-400 text-white shadow-md'
                      : 'bg-slate-800/80 border-slate-700/60 text-slate-300 hover:border-slate-600'
                  }`}
                >
                  <span className="text-xs font-medium block truncate">{anim.label}</span>
                </button>
              ))}

            {category === 'out' &&
              outAnimations.map((anim) => (
                <button
                  key={anim.id}
                  onClick={() => setOutAnim(anim.id)}
                  className={`py-3 px-2 rounded-xl border text-center transition-all ${
                    outAnim === anim.id
                      ? 'bg-indigo-600 border-indigo-400 text-white shadow-md'
                      : 'bg-slate-800/80 border-slate-700/60 text-slate-300 hover:border-slate-600'
                  }`}
                >
                  <span className="text-xs font-medium block truncate">{anim.label}</span>
                </button>
              ))}

            {category === 'combo' &&
              comboAnimations.map((anim) => (
                <button
                  key={anim.id}
                  onClick={() => setComboAnim(anim.id)}
                  className={`py-3 px-2 rounded-xl border text-center transition-all ${
                    comboAnim === anim.id
                      ? 'bg-indigo-600 border-indigo-400 text-white shadow-md'
                      : 'bg-slate-800/80 border-slate-700/60 text-slate-300 hover:border-slate-600'
                  }`}
                >
                  <span className="text-xs font-medium block truncate">{anim.label}</span>
                </button>
              ))}
          </div>
        </div>

        {/* Footer Apply */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={() => {
              setInAnim('none');
              setOutAnim('none');
              setComboAnim('none');
            }}
            className="py-2 px-4 rounded-xl border border-slate-700 text-slate-400 hover:text-white text-xs font-medium"
          >
            Clear
          </button>
          <button
            onClick={handleApply}
            className="py-2.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md transition-colors"
          >
            Apply Animation
          </button>
        </div>
      </div>
    </div>
  );
};
