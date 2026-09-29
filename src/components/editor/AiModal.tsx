import React, { useState } from 'react';
import { Sparkles, X, Languages, FileText, Check, AlertCircle } from 'lucide-react';
import { t } from '../../utils/i18n';

interface AiModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSubtitles: (subtitles: { text: string; start: number; end: number }[]) => void;
}

export const AiModal: React.FC<AiModalProps> = ({ isOpen, onClose, onAddSubtitles }) => {
  const [activeTab, setActiveTab] = useState<'captions' | 'script'>('captions');
  const [language, setLanguage] = useState<'English' | 'Hindi' | 'Hinglish'>('Hinglish');
  const [topicInput, setTopicInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [scriptResult, setScriptResult] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerateCaptions = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/ai/captions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: topicInput || 'Epic viral lifestyle video showcase with vibrant transitions',
          language,
        }),
      });

      const data = await res.json();
      if (data.captions && data.captions.length > 0) {
        onAddSubtitles(data.captions);
        onClose();
      } else if (data.fallback) {
        // Fallback subtitles if AI unavailable
        onAddSubtitles(data.fallback);
        onClose();
      } else {
        setErrorMsg('AI service is temporarily unavailable.');
      }
    } catch (err) {
      console.warn('AI caption request error:', err);
      // PRD exact error requirement
      setErrorMsg('AI service is temporarily unavailable.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateScript = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    setScriptResult(null);
    try {
      const res = await fetch('/api/ai/script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topicInput || 'Travel vlog through India',
          language,
          platform: 'Shorts & Reels',
        }),
      });

      const data = await res.json();
      if (data.script) {
        setScriptResult(data.script);
      } else {
        setErrorMsg('AI service is temporarily unavailable.');
      }
    } catch (err) {
      setErrorMsg('AI service is temporarily unavailable.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <h3 className="font-semibold text-white">EditPro AI Studio</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="grid grid-cols-2 p-1 m-4 bg-slate-950 rounded-xl border border-slate-800/80">
          <button
            onClick={() => setActiveTab('captions')}
            className={`py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
              activeTab === 'captions' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Languages className="w-3.5 h-3.5" />
            {t('auto_captions')}
          </button>
          <button
            onClick={() => setActiveTab('script')}
            className={`py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
              activeTab === 'script' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            {t('generate_script')}
          </button>
        </div>

        {/* Body */}
        <div className="px-6 pb-6 flex flex-col gap-4">
          {errorMsg && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center gap-2.5 text-amber-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Language selector */}
          <div>
            <span className="text-xs font-semibold text-slate-400 block mb-2">Target Language:</span>
            <div className="grid grid-cols-3 gap-2">
              {(['English', 'Hindi', 'Hinglish'] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setLanguage(lang)}
                  className={`py-2 rounded-xl border text-xs font-medium transition-all ${
                    language === lang
                      ? 'bg-indigo-600 border-indigo-400 text-white'
                      : 'bg-slate-800 border-slate-700 text-slate-300'
                  }`}
                >
                  {lang === 'Hindi' ? 'हिंदी (Hindi)' : lang}
                </button>
              ))}
            </div>
          </div>

          {/* Prompt / Context input */}
          <div>
            <span className="text-xs font-semibold text-slate-400 block mb-1.5">
              {activeTab === 'captions' ? 'Video Topic / Speech Context:' : 'Script Topic / Video Concept:'}
            </span>
            <textarea
              rows={3}
              value={topicInput}
              onChange={(e) => setTopicInput(e.target.value)}
              placeholder={
                activeTab === 'captions'
                  ? 'e.g. Best 5 street foods of Mumbai, quick review...'
                  : 'e.g. 10 second mystery hook for Instagram Reel...'
              }
              className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>

          {/* Action button */}
          {activeTab === 'captions' ? (
            <button
              onClick={handleGenerateCaptions}
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-transform active:scale-98"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate Auto Captions ({language})
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleGenerateScript}
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-transform active:scale-98"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate Viral Script
                </>
              )}
            </button>
          )}

          {/* Script results */}
          {scriptResult && (
            <div className="mt-2 p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-200 max-h-40 overflow-y-auto whitespace-pre-wrap leading-relaxed">
              {scriptResult}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
