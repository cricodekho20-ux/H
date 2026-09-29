import React, { useState, useRef } from 'react';
import { Project } from '../../types/editor';
import { VideoExporter, ExportProgress, ExportOptions } from '../../engine/exporter';
import { Download, Share2, X, CheckCircle2, Film, AlertCircle, RefreshCw } from 'lucide-react';
import { t } from '../../utils/i18n';

interface ExportModalProps {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ project, isOpen, onClose }) => {
  const [resolution, setResolution] = useState<'480p' | '720p' | '1080p'>('1080p');
  const [fps, setFps] = useState<24 | 30 | 60>(30);
  const [quality, setQuality] = useState<'low' | 'medium' | 'high'>('high');
  const [format, setFormat] = useState<'mp4' | 'webm'>('mp4');

  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState<ExportProgress | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadBlob, setDownloadBlob] = useState<Blob | null>(null);

  const exporterRef = useRef<VideoExporter | null>(null);

  if (!isOpen) return null;

  const handleStartExport = async () => {
    setIsExporting(true);
    setProgress({
      currentFrame: 0,
      totalFrames: Math.ceil(project.duration * fps),
      percentage: 0,
      estimatedRemainingSec: Math.ceil(project.duration * 1.5),
      status: 'rendering',
    });

    const exporter = new VideoExporter();
    exporterRef.current = exporter;

    try {
      const options: ExportOptions = { resolution, fps, quality, format };
      const res = await exporter.exportProject(project, options, (p) => {
        setProgress(p);
      });

      setDownloadBlob(res.blob);
      setDownloadUrl(res.url);

      // Auto-trigger download
      triggerDownload(res.url, `${project.name || 'EditPro_Video'}.${format}`);
    } catch (err: any) {
      if (err.message !== 'Export cancelled by user.') {
        console.error('Export error:', err);
        setProgress((prev) => (prev ? { ...prev, status: 'error', error: 'Export failed. Please try again.' } : null));
      }
    } finally {
      setIsExporting(false);
    }
  };

  const handleCancelExport = () => {
    if (exporterRef.current) {
      exporterRef.current.cancel();
    }
    setIsExporting(false);
  };

  const triggerDownload = (url: string, filename: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleShare = async () => {
    if (!downloadBlob) return;
    try {
      const file = new File([downloadBlob], `${project.name || 'EditPro_Video'}.${format}`, {
        type: downloadBlob.type,
      });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: project.name || 'EditPro Video',
          text: 'Edited with EditPro Studio',
        });
      } else if (navigator.share) {
        await navigator.share({
          title: project.name || 'EditPro Video',
          text: 'Edited with EditPro Studio',
          url: window.location.href,
        });
      } else {
        triggerDownload(downloadUrl!, `${project.name || 'EditPro_Video'}.${format}`);
      }
    } catch (err) {
      console.warn('Share not supported or dismissed:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <Film className="w-5 h-5 text-indigo-400" />
            <h3 className="font-semibold text-white text-base">{t('export_video')}</h3>
          </div>
          {!isExporting && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="p-6 flex flex-col gap-5">
          {!isExporting && !downloadUrl ? (
            <>
              {/* Resolution */}
              <div>
                <span className="text-xs font-semibold text-slate-400 block mb-2">{t('resolution')}</span>
                <div className="grid grid-cols-3 gap-2">
                  {(['480p', '720p', '1080p'] as const).map((r) => (
                    <button
                      key={r}
                      onClick={() => setResolution(r)}
                      className={`py-2.5 rounded-xl border font-semibold text-xs transition-all ${
                        resolution === r
                          ? 'bg-indigo-600 border-indigo-400 text-white shadow-md'
                          : 'bg-slate-800/80 border-slate-700/60 text-slate-300 hover:border-slate-600'
                      }`}
                    >
                      {r} {r === '1080p' && '★ Full HD'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Frame Rate */}
              <div>
                <span className="text-xs font-semibold text-slate-400 block mb-2">{t('frame_rate')}</span>
                <div className="grid grid-cols-3 gap-2">
                  {([24, 30, 60] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setFps(f)}
                      className={`py-2.5 rounded-xl border font-semibold text-xs transition-all ${
                        fps === f
                          ? 'bg-indigo-600 border-indigo-400 text-white shadow-md'
                          : 'bg-slate-800/80 border-slate-700/60 text-slate-300 hover:border-slate-600'
                      }`}
                    >
                      {f} FPS
                    </button>
                  ))}
                </div>
              </div>

              {/* Quality */}
              <div>
                <span className="text-xs font-semibold text-slate-400 block mb-2">{t('quality')}</span>
                <div className="grid grid-cols-3 gap-2">
                  {(['low', 'medium', 'high'] as const).map((q) => (
                    <button
                      key={q}
                      onClick={() => setQuality(q)}
                      className={`py-2.5 rounded-xl border font-semibold text-xs capitalize transition-all ${
                        quality === q
                          ? 'bg-indigo-600 border-indigo-400 text-white shadow-md'
                          : 'bg-slate-800/80 border-slate-700/60 text-slate-300 hover:border-slate-600'
                      }`}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>

              {/* Format selection */}
              <div>
                <span className="text-xs font-semibold text-slate-400 block mb-2">Format</span>
                <div className="grid grid-cols-2 gap-2">
                  {(['mp4', 'webm'] as const).map((fmt) => (
                    <button
                      key={fmt}
                      onClick={() => setFormat(fmt)}
                      className={`py-2 rounded-xl border font-mono uppercase text-xs transition-all ${
                        format === fmt
                          ? 'bg-indigo-600 border-indigo-400 text-white shadow-md'
                          : 'bg-slate-800/80 border-slate-700/60 text-slate-300'
                      }`}
                    >
                      {fmt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Start Export Button */}
              <button
                onClick={handleStartExport}
                className="w-full py-3.5 mt-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 active:scale-[0.98] transition-transform"
              >
                Export Video ({resolution} · {fps}fps)
              </button>
            </>
          ) : isExporting ? (
            /* Live Export Progress Screen */
            <div className="flex flex-col items-center justify-center py-6 gap-5">
              <div className="relative w-28 h-28 flex items-center justify-center">
                {/* SVG Progress Circle */}
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    className="text-slate-800 stroke-current"
                    strokeWidth="8"
                    fill="transparent"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    className="text-indigo-500 stroke-current transition-all duration-300"
                    strokeWidth="8"
                    strokeDasharray={251.2}
                    strokeDashoffset={251.2 - (251.2 * (progress?.percentage || 0)) / 100}
                    strokeLinecap="round"
                    fill="transparent"
                  />
                </svg>
                <span className="absolute font-mono text-xl font-bold text-white">
                  {progress?.percentage || 0}%
                </span>
              </div>

              <div className="text-center space-y-1">
                <div className="font-semibold text-white">
                  {progress?.status === 'encoding' ? t('encoding_video') : t('rendering_frames')}
                </div>
                <div className="text-xs text-slate-400 font-mono">
                  Frame {progress?.currentFrame} / {progress?.totalFrames} · ~{progress?.estimatedRemainingSec}s left
                </div>
              </div>

              <button
                onClick={handleCancelExport}
                className="px-6 py-2 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-medium transition-colors"
              >
                {t('cancel')}
              </button>
            </div>
          ) : (
            /* Post-Export Success Screen */
            <div className="flex flex-col items-center justify-center py-4 gap-5">
              <div className="p-3 bg-emerald-500/10 rounded-full text-emerald-400">
                <CheckCircle2 className="w-12 h-12" />
              </div>
              <div className="text-center">
                <h4 className="font-bold text-white text-lg">Video Ready!</h4>
                <p className="text-xs text-slate-400 mt-1">Saved automatically to your device download folder.</p>
              </div>

              {/* Video Preview */}
              {downloadUrl && (
                <div className="w-full max-h-48 rounded-xl overflow-hidden bg-black border border-slate-800 flex items-center justify-center">
                  <video src={downloadUrl} controls playsInline className="max-h-48 object-contain" />
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col gap-2.5 w-full">
                <button
                  onClick={() => triggerDownload(downloadUrl!, `${project.name || 'EditPro_Video'}.${format}`)}
                  className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-md shadow-indigo-600/30 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  {t('download_to_gallery')}
                </button>

                <button
                  onClick={handleShare}
                  className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-sm flex items-center justify-center gap-2 border border-slate-700 transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                  {t('share_video')} (WhatsApp / Insta)
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
