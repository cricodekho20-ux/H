import React, { useState } from 'react';
import { Settings, X, Globe, HardDrive, Trash2, Shield, Info, Check, Download, Package } from 'lucide-react';
import { getLanguage, setLanguage, t, Language } from '../../utils/i18n';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLanguageChange: (lang: Language) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onLanguageChange }) => {
  const [currentLang, setCurrentLang] = useState<Language>(getLanguage());
  const [defaultRes, setDefaultRes] = useState<'720p' | '1080p'>(
    (localStorage.getItem('editpro_def_res') as any) || '1080p'
  );
  const [defaultFps, setDefaultFps] = useState<30 | 60>(
    Number(localStorage.getItem('editpro_def_fps') || 30) as any
  );
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(
    localStorage.getItem('editpro_autosave') !== 'false'
  );
  const [cacheMessage, setCacheMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLangSelect = (lang: Language) => {
    setCurrentLang(lang);
    setLanguage(lang);
    onLanguageChange(lang);
  };

  const handleResSelect = (res: '720p' | '1080p') => {
    setDefaultRes(res);
    localStorage.setItem('editpro_def_res', res);
  };

  const handleFpsSelect = (f: 30 | 60) => {
    setDefaultFps(f);
    localStorage.setItem('editpro_def_fps', f.toString());
  };

  const handleToggleAutoSave = (val: boolean) => {
    setAutoSaveEnabled(val);
    localStorage.setItem('editpro_autosave', val ? 'true' : 'false');
  };

  const handleClearCache = () => {
    try {
      // Clear non-project temp items
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (k && k.startsWith('editpro_temp_')) {
          localStorage.removeItem(k);
        }
      }
      setCacheMessage(t('cache_cleared'));
      setTimeout(() => setCacheMessage(null), 3000);
    } catch (e) {
      console.warn(e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <Settings className="w-5 h-5 text-indigo-400" />
            <h3 className="font-semibold text-white text-base">{t('settings')}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs">
          {/* Language Selection */}
          <div>
            <div className="flex items-center gap-2 text-slate-300 font-semibold mb-2.5">
              <Globe className="w-4 h-4 text-indigo-400" />
              <span>{t('language')}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleLangSelect('en')}
                className={`py-3 px-3 rounded-xl border flex items-center justify-between font-medium transition-all ${
                  currentLang === 'en'
                    ? 'bg-indigo-600 border-indigo-400 text-white shadow-md'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600'
                }`}
              >
                <span>English</span>
                {currentLang === 'en' && <Check className="w-4 h-4" />}
              </button>
              <button
                onClick={() => handleLangSelect('hi')}
                className={`py-3 px-3 rounded-xl border flex items-center justify-between font-medium transition-all ${
                  currentLang === 'hi'
                    ? 'bg-indigo-600 border-indigo-400 text-white shadow-md'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600'
                }`}
              >
                <span>हिंदी (Hindi)</span>
                {currentLang === 'hi' && <Check className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Export Defaults */}
          <div>
            <span className="text-slate-300 font-semibold block mb-2.5">{t('default_resolution')}</span>
            <div className="grid grid-cols-2 gap-2">
              {(['720p', '1080p'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => handleResSelect(r)}
                  className={`py-2.5 rounded-xl border font-mono font-medium transition-all ${
                    defaultRes === r
                      ? 'bg-indigo-600 border-indigo-400 text-white'
                      : 'bg-slate-800 border-slate-700 text-slate-300'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* FPS Defaults */}
          <div>
            <span className="text-slate-300 font-semibold block mb-2.5">{t('default_fps')}</span>
            <div className="grid grid-cols-2 gap-2">
              {([30, 60] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => handleFpsSelect(f)}
                  className={`py-2.5 rounded-xl border font-mono font-medium transition-all ${
                    defaultFps === f
                      ? 'bg-indigo-600 border-indigo-400 text-white'
                      : 'bg-slate-800 border-slate-700 text-slate-300'
                  }`}
                >
                  {f} FPS
                </button>
              ))}
            </div>
          </div>

          {/* Auto Save Toggle */}
          <div className="flex items-center justify-between p-3.5 bg-slate-950 rounded-xl border border-slate-800">
            <div>
              <div className="font-semibold text-white">{t('auto_save')}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Saves timeline state periodically</div>
            </div>
            <input
              type="checkbox"
              checked={autoSaveEnabled}
              onChange={(e) => handleToggleAutoSave(e.target.checked)}
              className="w-5 h-5 rounded accent-indigo-600 cursor-pointer"
            />
          </div>

          {/* Download Complete Project ZIP */}
          <div className="p-4 bg-slate-950 rounded-2xl border border-indigo-500/30 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-indigo-400" />
                <span className="font-semibold text-white text-xs">Source Code & Android Project</span>
              </div>
              <span className="text-[10px] font-mono text-indigo-300 px-2 py-0.5 rounded bg-indigo-950/60 border border-indigo-500/30">
                .ZIP Archive
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Download the entire EditPro codebase including React web app, offline video engine, and native Android Studio project.
            </p>
            <a
              href="/api/download-zip"
              download="editpro-app.zip"
              className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-md transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Download editpro-app.zip</span>
            </a>
          </div>

          {/* Clear cache */}
          <div>
            <button
              onClick={handleClearCache}
              className="w-full py-3 px-4 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-750 text-slate-300 font-medium flex items-center justify-center gap-2 transition-colors"
            >
              <Trash2 className="w-4 h-4 text-rose-400" />
              {t('clear_cache')}
            </button>
            {cacheMessage && (
              <div className="text-emerald-400 text-center mt-2 font-medium">{cacheMessage}</div>
            )}
          </div>

          {/* Offline & Privacy Assurance */}
          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800/80 space-y-2">
            <div className="flex items-center gap-2 text-indigo-400 font-semibold">
              <Shield className="w-4 h-4" />
              <span>{t('storage_info')}</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              {t('about_desc')}
            </p>
            <div className="text-[10px] text-emerald-400 font-medium pt-1">
              ✓ {t('offline_guarantee')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
