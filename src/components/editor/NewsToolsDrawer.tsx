import React, { useState } from 'react';
import { Clip, NewsToolConfig } from '../../types/editor';
import { NEWS_PRESETS, NewsPresetDef } from '../../utils/newsPresets';
import { Newspaper, X, Plus, Check } from 'lucide-react';
import { t } from '../../utils/i18n';

interface NewsToolsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onAddNewsClip: (cfg: NewsToolConfig) => void;
}

export const NewsToolsDrawer: React.FC<NewsToolsDrawerProps> = ({
  isOpen,
  onClose,
  onAddNewsClip,
}) => {
  const [selectedPreset, setSelectedPreset] = useState<NewsPresetDef>(NEWS_PRESETS[0]);
  const [headline, setHeadline] = useState(selectedPreset.defaultConfig.headline);
  const [subtext, setSubtext] = useState(selectedPreset.defaultConfig.subtext || '');
  const [location, setLocation] = useState(selectedPreset.defaultConfig.location || '');
  const [bannerColor, setBannerColor] = useState(selectedPreset.defaultConfig.bannerColor);
  const [accentColor, setAccentColor] = useState(selectedPreset.defaultConfig.accentColor);

  if (!isOpen) return null;

  const handleSelectPreset = (p: NewsPresetDef) => {
    setSelectedPreset(p);
    setHeadline(p.defaultConfig.headline);
    setSubtext(p.defaultConfig.subtext || '');
    setLocation(p.defaultConfig.location || '');
    setBannerColor(p.defaultConfig.bannerColor);
    setAccentColor(p.defaultConfig.accentColor);
  };

  const handleAdd = () => {
    const cfg: NewsToolConfig = {
      type: selectedPreset.type,
      headline,
      subtext,
      location,
      bannerColor,
      accentColor,
      scrollSpeed: 1.5,
    };
    onAddNewsClip(cfg);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Newspaper className="w-5 h-5 text-indigo-400" />
            <h3 className="font-semibold text-white">News Creator Tools</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col gap-4 overflow-y-auto">
          {/* Preset Selector */}
          <div>
            <span className="text-xs font-semibold text-slate-400 block mb-2">Preset Format:</span>
            <div className="grid grid-cols-2 gap-2">
              {NEWS_PRESETS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleSelectPreset(p)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    selectedPreset.id === p.id
                      ? 'bg-indigo-600 border-indigo-400 text-white shadow-md'
                      : 'bg-slate-800 border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="font-semibold text-xs truncate">{p.name}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Headline Input */}
          <div>
            <span className="text-xs font-semibold text-slate-400 block mb-1">Headline Text:</span>
            <input
              type="text"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Subtext */}
          <div>
            <span className="text-xs font-semibold text-slate-400 block mb-1">Subtext / Details:</span>
            <input
              type="text"
              value={subtext}
              onChange={(e) => setSubtext(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Location */}
          {selectedPreset.type === 'lower_third' && (
            <div>
              <span className="text-xs font-semibold text-slate-400 block mb-1">Location Tag:</span>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. New Delhi, India"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>
          )}

          {/* Colors */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Banner:</span>
              <input
                type="color"
                value={bannerColor}
                onChange={(e) => setBannerColor(e.target.value)}
                className="w-8 h-8 rounded border border-slate-700 cursor-pointer"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Accent:</span>
              <input
                type="color"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                className="w-8 h-8 rounded border border-slate-700 cursor-pointer"
              />
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={handleAdd}
            className="w-full py-3 mt-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/30 transition-colors"
          >
            Add News Overlay to Timeline
          </button>
        </div>
      </div>
    </div>
  );
};
