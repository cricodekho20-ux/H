import React, { useState } from 'react';
import { Clip, ColorAdjustment, FilterPreset, Keyframe, TextAnimation, TextConfig, TransitionType, VideoEffect } from '../../types/editor';
import {
  Gauge, Volume2, Sliders, Sparkles, Layers, Palette, Music, Type,
  Trash2, Copy, X, Key, Shield, Move, Smile, Newspaper, Mic, Activity,
  Maximize2, Play
} from 'lucide-react';
import { t } from '../../utils/i18n';
import { STOCK_SOUNDS, synthesizeStockAudio } from '../../utils/audioSynth';

interface ToolPanelsProps {
  selectedClip: Clip | null;
  currentTime: number;
  onUpdateClip: (updated: Clip) => void;
  onDeleteClip: (clipId: string) => void;
  onDuplicateClip: (clip: Clip) => void;
  onAddTextClip: (text: string) => void;
  onAddAudioClip: (audio: { name: string; url: string; duration: number; waveform: number[]; type: 'audio' }) => void;
  // Triggers for modals
  onOpenSpeedCurve: () => void;
  onOpenAnimation: () => void;
  onOpenNewsTools: () => void;
  onOpenStickers: () => void;
  onOpenAudioAi: () => void;
  onOpenTts: () => void;
}

export type ActiveToolTab =
  | 'none'
  | 'speed'
  | 'transform'
  | 'keyframes'
  | 'filters'
  | 'adjust'
  | 'effects'
  | 'transitions'
  | 'chroma'
  | 'mask'
  | 'audio'
  | 'text'
  | 'music_library';

export const ToolPanels: React.FC<ToolPanelsProps> = ({
  selectedClip,
  currentTime,
  onUpdateClip,
  onDeleteClip,
  onDuplicateClip,
  onAddTextClip,
  onAddAudioClip,
  onOpenSpeedCurve,
  onOpenAnimation,
  onOpenNewsTools,
  onOpenStickers,
  onOpenAudioAi,
  onOpenTts,
}) => {
  const [activeTab, setActiveTab] = useState<ActiveToolTab>('none');
  const [loadingAudioId, setLoadingAudioId] = useState<string | null>(null);

  // Text editor state
  const [newTextStr, setNewTextStr] = useState('EditPro Text');
  const [textColor, setTextColor] = useState('#ffffff');
  const [strokeColor, setStrokeColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [bgColor, setBgColor] = useState('rgba(0,0,0,0.6)');
  const [fontSize, setFontSize] = useState(36);
  const [textAnim, setTextAnim] = useState<TextAnimation>('pop');

  const speeds = [0.1, 0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 2.0, 3.0, 4.0, 8.0];

  const filterPresets: { id: FilterPreset; name: string; bg: string }[] = [
    { id: 'none', name: 'Normal', bg: 'bg-slate-800' },
    { id: 'cinematic', name: 'Cinematic', bg: 'bg-amber-900/60' },
    { id: 'portrait', name: 'Portrait', bg: 'bg-rose-950/60' },
    { id: 'warm', name: 'Warm Sunset', bg: 'bg-orange-800/60' },
    { id: 'cool', name: 'Cool Teal', bg: 'bg-cyan-900/60' },
    { id: 'vintage', name: 'Vintage 70s', bg: 'bg-yellow-900/50' },
    { id: 'retro', name: 'Retro Film', bg: 'bg-amber-800/50' },
    { id: 'bw', name: 'Black & White', bg: 'bg-zinc-700' },
    { id: 'night', name: 'Night Mood', bg: 'bg-indigo-950/80' },
    { id: 'food', name: 'Food Pop', bg: 'bg-red-900/50' },
    { id: 'travel', name: 'Travel Vivid', bg: 'bg-teal-900/60' },
    { id: 'bright', name: 'Vibrant', bg: 'bg-emerald-900/60' },
    { id: 'dark', name: 'Moody Dark', bg: 'bg-slate-900' },
    { id: 'news', name: 'Broadcast', bg: 'bg-blue-900/60' },
  ];

  const effectsList: { id: VideoEffect; name: string }[] = [
    { id: 'none', name: 'None' },
    { id: 'glitch', name: 'Cyber Glitch' },
    { id: 'shake', name: 'Camera Shake' },
    { id: 'zoom', name: 'Beat Zoom' },
    { id: 'flash', name: 'Strobe Flash' },
    { id: 'rgb_split', name: 'RGB Split' },
    { id: 'vhs', name: 'Retro VHS' },
    { id: 'blur', name: 'Soft Blur' },
    { id: 'lens_blur', name: 'Lens Bokeh' },
    { id: 'film_grain', name: 'Film Grain' },
    { id: 'light_leak', name: 'Light Leak' },
  ];

  const transitionsList: { id: TransitionType; name: string }[] = [
    { id: 'none', name: 'None' },
    { id: 'fade', name: 'Cross Fade' },
    { id: 'dissolve', name: 'Dissolve' },
    { id: 'slide_left', name: 'Slide Left' },
    { id: 'slide_right', name: 'Slide Right' },
    { id: 'push', name: 'Push Up' },
    { id: 'zoom', name: 'Zoom In' },
    { id: 'whirl', name: 'Whirl' },
    { id: 'spin', name: 'Rotate Spin' },
    { id: 'flash', name: 'White Flash' },
    { id: 'blur', name: 'Blur Cut' },
    { id: 'glitch', name: 'Glitch Transition' },
  ];

  const handleUpdate = (patch: Partial<Clip>) => {
    if (!selectedClip) return;
    onUpdateClip({ ...selectedClip, ...patch });
  };

  const handleUpdateTransform = (patch: Partial<Clip['transform']>) => {
    if (!selectedClip) return;
    onUpdateClip({
      ...selectedClip,
      transform: { ...selectedClip.transform, ...patch },
    });
  };

  const handleUpdateAdjust = (key: keyof ColorAdjustment, val: number) => {
    if (!selectedClip) return;
    onUpdateClip({
      ...selectedClip,
      colorAdjustment: { ...selectedClip.colorAdjustment, [key]: val },
    });
  };

  const handleAddKeyframe = () => {
    if (!selectedClip) return;
    const localTime = (currentTime - selectedClip.startAt) * selectedClip.speed + selectedClip.trimIn;
    const newKf: Keyframe = {
      time: Number(localTime.toFixed(2)),
      x: selectedClip.transform.x || 0,
      y: selectedClip.transform.y || 0,
      scaleX: selectedClip.transform.scale || 1.0,
      scaleY: selectedClip.transform.scale || 1.0,
      rotation: selectedClip.transform.rotation || 0,
      opacity: selectedClip.transform.opacity ?? 1.0,
      easing: 'ease_in_out',
    };

    const filtered = (selectedClip.keyframes || []).filter((k) => Math.abs(k.time - localTime) > 0.05);
    onUpdateClip({
      ...selectedClip,
      keyframes: [...filtered, newKf].sort((a, b) => a.time - b.time),
    });
  };

  const handleDeleteKeyframe = (time: number) => {
    if (!selectedClip) return;
    onUpdateClip({
      ...selectedClip,
      keyframes: (selectedClip.keyframes || []).filter((k) => Math.abs(k.time - time) > 0.01),
    });
  };

  const handleAddStockSound = async (sound: typeof STOCK_SOUNDS[0]) => {
    try {
      setLoadingAudioId(sound.id);
      const res = await synthesizeStockAudio(sound.generator, sound.duration);
      onAddAudioClip({
        name: sound.name,
        url: res.url,
        duration: sound.duration,
        waveform: res.waveform,
        type: 'audio',
      });
      setActiveTab('none');
    } catch (err) {
      console.error('Audio synthesis failed:', err);
    } finally {
      setLoadingAudioId(null);
    }
  };

  const handleCreateTextClip = () => {
    if (!newTextStr.trim()) return;
    onAddTextClip(newTextStr);
    setActiveTab('none');
  };

  return (
    <div className="flex flex-col bg-slate-900 border-t border-slate-800 text-xs">
      {/* Bottom Action Carousel */}
      <div className="flex items-center gap-1 px-3 py-2 overflow-x-auto no-scrollbar border-b border-slate-800/80">
        {/* Speed */}
        <button
          onClick={() => setActiveTab(activeTab === 'speed' ? 'none' : 'speed')}
          disabled={!selectedClip}
          className={`flex flex-col items-center justify-center min-w-[56px] h-13 rounded-xl gap-1 transition-all ${
            activeTab === 'speed'
              ? 'bg-indigo-600 text-white shadow-md'
              : selectedClip
              ? 'text-slate-300 hover:bg-slate-800 active:scale-95'
              : 'text-slate-600 opacity-40 cursor-not-allowed'
          }`}
        >
          <Gauge className="w-4 h-4" />
          <span className="text-[10px] font-medium">{t('speed')}</span>
        </button>

        {/* Speed Curve trigger */}
        {selectedClip && (
          <button
            onClick={onOpenSpeedCurve}
            className="flex flex-col items-center justify-center min-w-[62px] h-13 rounded-xl gap-1 text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 active:scale-95 transition-all"
          >
            <Activity className="w-4 h-4" />
            <span className="text-[10px] font-medium">Curve</span>
          </button>
        )}

        {/* Animations Trigger (IN / OUT / COMBO) */}
        {selectedClip && (
          <button
            onClick={onOpenAnimation}
            className="flex flex-col items-center justify-center min-w-[62px] h-13 rounded-xl gap-1 text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 active:scale-95 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span className="text-[10px] font-medium">Animation</span>
          </button>
        )}

        {/* Transform / Crop */}
        <button
          onClick={() => setActiveTab(activeTab === 'transform' ? 'none' : 'transform')}
          disabled={!selectedClip}
          className={`flex flex-col items-center justify-center min-w-[56px] h-13 rounded-xl gap-1 transition-all ${
            activeTab === 'transform'
              ? 'bg-indigo-600 text-white shadow-md'
              : selectedClip
              ? 'text-slate-300 hover:bg-slate-800 active:scale-95'
              : 'text-slate-600 opacity-40 cursor-not-allowed'
          }`}
        >
          <Move className="w-4 h-4" />
          <span className="text-[10px] font-medium">{t('crop')}</span>
        </button>

        {/* Keyframe System */}
        <button
          onClick={() => setActiveTab(activeTab === 'keyframes' ? 'none' : 'keyframes')}
          disabled={!selectedClip}
          className={`flex flex-col items-center justify-center min-w-[56px] h-13 rounded-xl gap-1 transition-all ${
            activeTab === 'keyframes'
              ? 'bg-indigo-600 text-white shadow-md'
              : selectedClip
              ? 'text-slate-300 hover:bg-slate-800 active:scale-95'
              : 'text-slate-600 opacity-40 cursor-not-allowed'
          }`}
        >
          <Key className="w-4 h-4" />
          <span className="text-[10px] font-medium">{t('keyframes')}</span>
        </button>

        {/* Filters */}
        <button
          onClick={() => setActiveTab(activeTab === 'filters' ? 'none' : 'filters')}
          disabled={!selectedClip}
          className={`flex flex-col items-center justify-center min-w-[56px] h-13 rounded-xl gap-1 transition-all ${
            activeTab === 'filters'
              ? 'bg-indigo-600 text-white shadow-md'
              : selectedClip
              ? 'text-slate-300 hover:bg-slate-800 active:scale-95'
              : 'text-slate-600 opacity-40 cursor-not-allowed'
          }`}
        >
          <Palette className="w-4 h-4" />
          <span className="text-[10px] font-medium">{t('filters')}</span>
        </button>

        {/* Adjust */}
        <button
          onClick={() => setActiveTab(activeTab === 'adjust' ? 'none' : 'adjust')}
          disabled={!selectedClip}
          className={`flex flex-col items-center justify-center min-w-[56px] h-13 rounded-xl gap-1 transition-all ${
            activeTab === 'adjust'
              ? 'bg-indigo-600 text-white shadow-md'
              : selectedClip
              ? 'text-slate-300 hover:bg-slate-800 active:scale-95'
              : 'text-slate-600 opacity-40 cursor-not-allowed'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span className="text-[10px] font-medium">{t('adjust')}</span>
        </button>

        {/* Effects */}
        <button
          onClick={() => setActiveTab(activeTab === 'effects' ? 'none' : 'effects')}
          disabled={!selectedClip}
          className={`flex flex-col items-center justify-center min-w-[56px] h-13 rounded-xl gap-1 transition-all ${
            activeTab === 'effects'
              ? 'bg-indigo-600 text-white shadow-md'
              : selectedClip
              ? 'text-slate-300 hover:bg-slate-800 active:scale-95'
              : 'text-slate-600 opacity-40 cursor-not-allowed'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span className="text-[10px] font-medium">{t('effects')}</span>
        </button>

        {/* Transitions */}
        <button
          onClick={() => setActiveTab(activeTab === 'transitions' ? 'none' : 'transitions')}
          disabled={!selectedClip}
          className={`flex flex-col items-center justify-center min-w-[56px] h-13 rounded-xl gap-1 transition-all ${
            activeTab === 'transitions'
              ? 'bg-indigo-600 text-white shadow-md'
              : selectedClip
              ? 'text-slate-300 hover:bg-slate-800 active:scale-95'
              : 'text-slate-600 opacity-40 cursor-not-allowed'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span className="text-[10px] font-medium">{t('transitions')}</span>
        </button>

        {/* Chroma Key */}
        <button
          onClick={() => setActiveTab(activeTab === 'chroma' ? 'none' : 'chroma')}
          disabled={!selectedClip}
          className={`flex flex-col items-center justify-center min-w-[56px] h-13 rounded-xl gap-1 transition-all ${
            activeTab === 'chroma'
              ? 'bg-indigo-600 text-white shadow-md'
              : selectedClip
              ? 'text-slate-300 hover:bg-slate-800 active:scale-95'
              : 'text-slate-600 opacity-40 cursor-not-allowed'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span className="text-[10px] font-medium">{t('chroma_key')}</span>
        </button>

        {/* Stickers Trigger */}
        <button
          onClick={onOpenStickers}
          className="flex flex-col items-center justify-center min-w-[56px] h-13 rounded-xl gap-1 text-slate-300 hover:bg-slate-800 active:scale-95 transition-all"
        >
          <Smile className="w-4 h-4 text-amber-400" />
          <span className="text-[10px] font-medium">Stickers</span>
        </button>

        {/* News Creator Tools Trigger */}
        <button
          onClick={onOpenNewsTools}
          className="flex flex-col items-center justify-center min-w-[62px] h-13 rounded-xl gap-1 text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 active:scale-95 transition-all"
        >
          <Newspaper className="w-4 h-4" />
          <span className="text-[10px] font-medium">News Tools</span>
        </button>

        {/* Audio Volume */}
        <button
          onClick={() => setActiveTab(activeTab === 'audio' ? 'none' : 'audio')}
          disabled={!selectedClip}
          className={`flex flex-col items-center justify-center min-w-[56px] h-13 rounded-xl gap-1 transition-all ${
            activeTab === 'audio'
              ? 'bg-indigo-600 text-white shadow-md'
              : selectedClip
              ? 'text-slate-300 hover:bg-slate-800 active:scale-95'
              : 'text-slate-600 opacity-40 cursor-not-allowed'
          }`}
        >
          <Volume2 className="w-4 h-4" />
          <span className="text-[10px] font-medium">{t('volume')}</span>
        </button>

        {/* Audio AI & Voice Changer trigger */}
        {selectedClip && (
          <button
            onClick={onOpenAudioAi}
            className="flex flex-col items-center justify-center min-w-[62px] h-13 rounded-xl gap-1 text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 active:scale-95 transition-all"
          >
            <Mic className="w-4 h-4" />
            <span className="text-[10px] font-medium">Voice AI</span>
          </button>
        )}

        {/* Text to Speech trigger */}
        <button
          onClick={onOpenTts}
          className="flex flex-col items-center justify-center min-w-[56px] h-13 rounded-xl gap-1 text-slate-300 hover:bg-slate-800 active:scale-95 transition-all"
        >
          <Volume2 className="w-4 h-4 text-cyan-400" />
          <span className="text-[10px] font-medium">TTS Voice</span>
        </button>

        {/* Add Text */}
        <button
          onClick={() => setActiveTab(activeTab === 'text' ? 'none' : 'text')}
          className={`flex flex-col items-center justify-center min-w-[56px] h-13 rounded-xl gap-1 transition-all ${
            activeTab === 'text' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-800 active:scale-95'
          }`}
        >
          <Type className="w-4 h-4" />
          <span className="text-[10px] font-medium">{t('text')}</span>
        </button>

        {/* Music Library */}
        <button
          onClick={() => setActiveTab(activeTab === 'music_library' ? 'none' : 'music_library')}
          className={`flex flex-col items-center justify-center min-w-[56px] h-13 rounded-xl gap-1 transition-all ${
            activeTab === 'music_library' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-800 active:scale-95'
          }`}
        >
          <Music className="w-4 h-4" />
          <span className="text-[10px] font-medium">{t('audio')}</span>
        </button>

        {/* Duplicate Clip */}
        {selectedClip && (
          <button
            onClick={() => onDuplicateClip(selectedClip)}
            className="flex flex-col items-center justify-center min-w-[56px] h-13 rounded-xl gap-1 text-slate-300 hover:bg-slate-800 active:scale-95 transition-all"
          >
            <Copy className="w-4 h-4" />
            <span className="text-[10px] font-medium">{t('duplicate')}</span>
          </button>
        )}

        {/* Delete Clip */}
        {selectedClip && (
          <button
            onClick={() => {
              onDeleteClip(selectedClip.id);
              setActiveTab('none');
            }}
            className="flex flex-col items-center justify-center min-w-[56px] h-13 rounded-xl gap-1 text-rose-400 hover:bg-rose-500/20 active:scale-95 transition-all"
          >
            <Trash2 className="w-4 h-4" />
            <span className="text-[10px] font-medium">{t('delete')}</span>
          </button>
        )}
      </div>

      {/* Expanded Sub-Panel Drawer */}
      {activeTab !== 'none' && (
        <div className="p-4 bg-slate-950/95 max-h-64 overflow-y-auto border-b border-slate-800 animate-in slide-in-from-bottom duration-200">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/80">
            <span className="font-semibold text-white capitalize">{activeTab.replace('_', ' ')}</span>
            <button
              onClick={() => setActiveTab('none')}
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Speed Tab */}
          {activeTab === 'speed' && selectedClip && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Constant Speed:</span>
                <span className="font-mono text-indigo-400 font-semibold">{selectedClip.speed}x</span>
              </div>
              <div className="grid grid-cols-6 gap-2">
                {speeds.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleUpdate({ speed: s })}
                    className={`py-2 rounded-lg font-mono font-medium transition-colors ${
                      selectedClip.speed === s ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Transform Tab */}
          {activeTab === 'transform' && selectedClip && (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Scale */}
                <div>
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>Scale</span>
                    <span className="font-mono text-white">{Math.round((selectedClip.transform.scale || 1) * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="3.0"
                    step="0.05"
                    value={selectedClip.transform.scale || 1}
                    onChange={(e) => handleUpdateTransform({ scale: parseFloat(e.target.value) })}
                    className="w-full"
                  />
                </div>

                {/* Rotation */}
                <div>
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>Rotation</span>
                    <span className="font-mono text-white">{Math.round(selectedClip.transform.rotation)}°</span>
                  </div>
                  <input
                    type="range"
                    min="-180"
                    max="180"
                    value={selectedClip.transform.rotation}
                    onChange={(e) => handleUpdateTransform({ rotation: parseInt(e.target.value) })}
                    className="w-full"
                  />
                </div>

                {/* Opacity */}
                <div>
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>Opacity</span>
                    <span className="font-mono text-white">{Math.round(selectedClip.transform.opacity * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={selectedClip.transform.opacity}
                    onChange={(e) => handleUpdateTransform({ opacity: parseFloat(e.target.value) })}
                    className="w-full"
                  />
                </div>

                {/* Quick Flips */}
                <div className="flex items-end gap-2">
                  <button
                    onClick={() => handleUpdateTransform({ flipH: !selectedClip.transform.flipH })}
                    className={`flex-1 py-2 rounded-lg border font-medium transition-colors ${
                      selectedClip.transform.flipH ? 'bg-indigo-600 border-indigo-500 text-white' : 'border-slate-700 bg-slate-800 text-slate-300'
                    }`}
                  >
                    Flip H
                  </button>
                  <button
                    onClick={() => handleUpdateTransform({ flipV: !selectedClip.transform.flipV })}
                    className={`flex-1 py-2 rounded-lg border font-medium transition-colors ${
                      selectedClip.transform.flipV ? 'bg-indigo-600 border-indigo-500 text-white' : 'border-slate-700 bg-slate-800 text-slate-300'
                    }`}
                  >
                    Flip V
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Keyframe Tab */}
          {activeTab === 'keyframes' && selectedClip && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Add Keyframe for Position, Scale, Rotation & Opacity:</span>
                <button
                  onClick={handleAddKeyframe}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium flex items-center gap-1.5 shadow"
                >
                  <Key className="w-3.5 h-3.5" />
                  + Keyframe at {currentTime.toFixed(1)}s
                </button>
              </div>

              {/* List of keyframes */}
              <div className="space-y-1.5 mt-2">
                {(selectedClip.keyframes || []).length === 0 ? (
                  <div className="text-slate-500 italic py-2">
                    No keyframes on this clip yet. Move playhead and tap "+ Keyframe".
                  </div>
                ) : (
                  selectedClip.keyframes.map((kf, i) => (
                    <div key={i} className="flex items-center justify-between px-3 py-2 bg-slate-900 rounded-lg border border-slate-800">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-indigo-400 font-semibold">{kf.time.toFixed(1)}s</span>
                        <span className="text-slate-400 text-[11px]">
                          Scale: {Math.round((kf.scaleX || 1) * 100)}% | Rot: {kf.rotation || 0}° | Alpha: {Math.round((kf.opacity ?? 1) * 100)}%
                        </span>
                      </div>
                      <button
                        onClick={() => handleDeleteKeyframe(kf.time)}
                        className="text-rose-400 hover:text-rose-300 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Filters Tab */}
          {activeTab === 'filters' && selectedClip && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between text-slate-400">
                <span>Filter Intensity:</span>
                <span className="font-mono text-white">{selectedClip.filter.intensity}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={selectedClip.filter.intensity}
                onChange={(e) =>
                  handleUpdate({
                    filter: { ...selectedClip.filter, intensity: parseInt(e.target.value) },
                  })
                }
                className="w-full"
              />
              <div className="grid grid-cols-4 gap-2 pt-2">
                {filterPresets.map((f) => (
                  <button
                    key={f.id}
                    onClick={() =>
                      handleUpdate({
                        filter: { preset: f.id, intensity: selectedClip.filter.intensity || 80 },
                      })
                    }
                    className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                      selectedClip.filter.preset === f.id
                        ? 'border-indigo-400 ring-2 ring-indigo-400/50 text-white'
                        : 'border-slate-800 text-slate-300 hover:border-slate-700'
                    } ${f.bg}`}
                  >
                    <span className="text-[11px] font-medium truncate w-full text-center">{f.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Color Adjustments Tab */}
          {activeTab === 'adjust' && selectedClip && (
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: 'brightness', label: 'Brightness', min: -100, max: 100 },
                { key: 'contrast', label: 'Contrast', min: -100, max: 100 },
                { key: 'saturation', label: 'Saturation', min: -100, max: 100 },
                { key: 'exposure', label: 'Exposure', min: -100, max: 100 },
                { key: 'temperature', label: 'Warmth', min: -100, max: 100 },
                { key: 'vignette', label: 'Vignette', min: 0, max: 100 },
                { key: 'fade', label: 'Fade Film', min: 0, max: 100 },
                { key: 'sharpen', label: 'Sharpen', min: 0, max: 100 },
              ].map((item) => {
                const val = (selectedClip.colorAdjustment as any)[item.key] || 0;
                return (
                  <div key={item.key}>
                    <div className="flex justify-between text-slate-400 mb-1">
                      <span>{item.label}</span>
                      <span className="font-mono text-white">{val}</span>
                    </div>
                    <input
                      type="range"
                      min={item.min}
                      max={item.max}
                      value={val}
                      onChange={(e) => handleUpdateAdjust(item.key as any, parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>
                );
              })}
            </div>
          )}

          {/* Effects Tab */}
          {activeTab === 'effects' && selectedClip && (
            <div className="grid grid-cols-3 gap-2">
              {effectsList.map((eff) => (
                <button
                  key={eff.id}
                  onClick={() => handleUpdate({ effect: eff.id })}
                  className={`py-3 px-2 rounded-xl border text-center transition-all ${
                    selectedClip.effect === eff.id
                      ? 'bg-indigo-600 border-indigo-400 text-white shadow-md'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <span className="font-medium text-[11px] truncate block">{eff.name}</span>
                </button>
              ))}
            </div>
          )}

          {/* Transitions Tab */}
          {activeTab === 'transitions' && selectedClip && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between text-slate-400">
                <span>Transition Duration:</span>
                <span className="font-mono text-white">{selectedClip.transition.duration || 0.5}s</span>
              </div>
              <input
                type="range"
                min="0.2"
                max="2.0"
                step="0.1"
                value={selectedClip.transition.duration || 0.5}
                onChange={(e) =>
                  handleUpdate({
                    transition: { ...selectedClip.transition, duration: parseFloat(e.target.value) },
                  })
                }
                className="w-full"
              />
              <div className="grid grid-cols-3 gap-2 pt-2">
                {transitionsList.map((trans) => (
                  <button
                    key={trans.id}
                    onClick={() =>
                      handleUpdate({
                        transition: {
                          type: trans.id,
                          duration: selectedClip.transition.duration || 0.5,
                        },
                      })
                    }
                    className={`py-2.5 px-2 rounded-xl border text-center transition-all ${
                      selectedClip.transition.type === trans.id
                        ? 'bg-indigo-600 border-indigo-400 text-white shadow'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <span className="font-medium text-[11px] truncate block">{trans.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Chroma Key Tab */}
          {activeTab === 'chroma' && selectedClip && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-300 font-medium">Enable Green Screen Removal</span>
                <input
                  type="checkbox"
                  checked={selectedClip.chromaKey.enabled}
                  onChange={(e) =>
                    handleUpdate({
                      chromaKey: { ...selectedClip.chromaKey, enabled: e.target.checked },
                    })
                  }
                  className="w-5 h-5 rounded accent-indigo-600 cursor-pointer"
                />
              </div>

              {selectedClip.chromaKey.enabled && (
                <>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-400">Key Color:</span>
                    <input
                      type="color"
                      value={selectedClip.chromaKey.color}
                      onChange={(e) =>
                        handleUpdate({
                          chromaKey: { ...selectedClip.chromaKey, color: e.target.value },
                        })
                      }
                      className="w-8 h-8 rounded border border-slate-700 cursor-pointer"
                    />
                    <button
                      onClick={() => handleUpdate({ chromaKey: { ...selectedClip.chromaKey, color: '#00ff00' } })}
                      className="px-2 py-1 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px]"
                    >
                      Green
                    </button>
                    <button
                      onClick={() => handleUpdate({ chromaKey: { ...selectedClip.chromaKey, color: '#0000ff' } })}
                      className="px-2 py-1 rounded bg-blue-950 text-blue-300 border border-blue-800 text-[10px]"
                    >
                      Blue
                    </button>
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-400 mb-1">
                      <span>Similarity</span>
                      <span className="font-mono text-white">{selectedClip.chromaKey.similarity}%</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="100"
                      value={selectedClip.chromaKey.similarity}
                      onChange={(e) =>
                        handleUpdate({
                          chromaKey: { ...selectedClip.chromaKey, similarity: parseInt(e.target.value) },
                        })
                      }
                      className="w-full"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-400 mb-1">
                      <span>Edge Smoothness</span>
                      <span className="font-mono text-white">{selectedClip.chromaKey.smoothness}%</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="100"
                      value={selectedClip.chromaKey.smoothness}
                      onChange={(e) =>
                        handleUpdate({
                          chromaKey: { ...selectedClip.chromaKey, smoothness: parseInt(e.target.value) },
                        })
                      }
                      className="w-full"
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {/* Audio Volume Tab */}
          {activeTab === 'audio' && selectedClip && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Volume Level:</span>
                <span className="font-mono text-white font-semibold">{selectedClip.audio.volume}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="200"
                value={selectedClip.audio.volume}
                onChange={(e) =>
                  handleUpdate({
                    audio: { ...selectedClip.audio, volume: parseInt(e.target.value) },
                  })
                }
                className="w-full"
              />

              <div className="flex items-center justify-between pt-2">
                <span className="text-slate-400">Mute Audio:</span>
                <button
                  onClick={() =>
                    handleUpdate({
                      audio: { ...selectedClip.audio, muted: !selectedClip.audio.muted },
                    })
                  }
                  className={`px-3 py-1.5 rounded-lg border font-medium ${
                    selectedClip.audio.muted ? 'bg-rose-600 border-rose-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-300'
                  }`}
                >
                  {selectedClip.audio.muted ? 'Muted' : 'Unmuted'}
                </button>
              </div>
            </div>
          )}

          {/* Add Text Tab */}
          {activeTab === 'text' && (
            <div className="flex flex-col gap-3">
              <input
                type="text"
                value={newTextStr}
                onChange={(e) => setNewTextStr(e.target.value)}
                placeholder="Enter title or caption..."
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500"
              />

              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Color:</span>
                  <input
                    type="color"
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                    className="w-8 h-8 rounded border border-slate-700 cursor-pointer"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Stroke:</span>
                  <input
                    type="color"
                    value={strokeColor}
                    onChange={(e) => setStrokeColor(e.target.value)}
                    className="w-8 h-8 rounded border border-slate-700 cursor-pointer"
                  />
                </div>
              </div>

              {/* Text Animations */}
              <div>
                <span className="text-slate-400 mb-1.5 block">Text Animation:</span>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['none', 'pop', 'bounce', 'fade', 'slide', 'typewriter', 'shake', 'rotate', 'glitch'] as TextAnimation[]).map((anim) => (
                    <button
                      key={anim}
                      onClick={() => setTextAnim(anim)}
                      className={`py-1.5 rounded-lg border capitalize text-[11px] ${
                        textAnim === anim ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-slate-900 border-slate-800 text-slate-300'
                      }`}
                    >
                      {anim}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleCreateTextClip}
                className="w-full py-2.5 mt-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-md shadow-indigo-600/30 active:scale-98 transition-transform"
              >
                Add Text to Timeline
              </button>
            </div>
          )}

          {/* Royalty-Free Music & SFX Library */}
          {activeTab === 'music_library' && (
            <div className="flex flex-col gap-2">
              <span className="text-slate-400 text-[11px] mb-1">
                100% Royalty-Free Offline Audio Library:
              </span>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {STOCK_SOUNDS.map((sound) => (
                  <div
                    key={sound.id}
                    className="flex items-center justify-between p-2.5 bg-slate-900 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors"
                  >
                    <div>
                      <div className="font-medium text-white">{sound.name}</div>
                      <div className="text-[10px] text-slate-400">
                        {sound.category} · {sound.duration}s
                      </div>
                    </div>
                    <button
                      onClick={() => handleAddStockSound(sound)}
                      disabled={loadingAudioId === sound.id}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center gap-1 shadow transition-colors active:scale-95"
                    >
                      {loadingAudioId === sound.id ? (
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Play className="w-3 h-3 fill-white" />
                          Add
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
