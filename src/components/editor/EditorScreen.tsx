import React, { useState, useRef, useEffect } from 'react';
import { Project, Clip, TrackType, AspectRatio, CanvasSettings, SpeedCurvePoint, SpeedCurvePreset, NewsToolConfig } from '../../types/editor';
import {
  ChevronLeft, Undo2, Redo2, Download, Play, Pause,
  RotateCcw, SkipBack, SkipForward, Sparkles, Check,
  FolderOpen, Ratio, Maximize2, Minimize2, StepBack, StepForward
} from 'lucide-react';
import { t } from '../../utils/i18n';
import { renderFrame } from '../../engine/renderer';
import { saveProject } from '../../utils/storage';
import { Timeline } from './Timeline';
import { ToolPanels } from './ToolPanels';
import { ExportModal } from './ExportModal';
import { AiModal } from './AiModal';
import { RecordModal } from '../media/RecordModal';
import { MediaLibraryDrawer } from '../media/MediaLibraryDrawer';
import { CanvasSettingsModal } from './CanvasSettingsModal';
import { SpeedCurveModal } from './SpeedCurveModal';
import { AnimationDrawer } from './AnimationDrawer';
import { NewsToolsDrawer } from './NewsToolsDrawer';
import { StickerDrawer } from './StickerDrawer';
import { AudioAiDrawer } from './AudioAiDrawer';
import { TtsModal } from './TtsModal';

interface EditorScreenProps {
  project: Project;
  onBack: () => void;
  onProjectUpdated: (project: Project) => void;
}

export const EditorScreen: React.FC<EditorScreenProps> = ({
  project: initialProject,
  onBack,
  onProjectUpdated,
}) => {
  const [project, setProject] = useState<Project>(initialProject);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
  const [zoomScale, setZoomScale] = useState<number>(35);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');
  const [isFullscreenPreview, setIsFullscreenPreview] = useState(false);

  // Modals state
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [recordType, setRecordType] = useState<'video' | 'voice' | null>(null);
  const [isMediaLibraryOpen, setIsMediaLibraryOpen] = useState(false);
  const [isCanvasModalOpen, setIsCanvasModalOpen] = useState(false);
  const [isSpeedCurveOpen, setIsSpeedCurveOpen] = useState(false);
  const [isAnimationOpen, setIsAnimationOpen] = useState(false);
  const [isNewsToolsOpen, setIsNewsToolsOpen] = useState(false);
  const [isStickersOpen, setIsStickersOpen] = useState(false);
  const [isAudioAiOpen, setIsAudioAiOpen] = useState(false);
  const [isTtsOpen, setIsTtsOpen] = useState(false);

  // History stacks for Undo / Redo
  const historyRef = useRef<Project[]>([initialProject]);
  const historyIndexRef = useRef<number>(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());
  const playerContainerRef = useRef<HTMLDivElement>(null);

  // History push
  const pushHistory = (newProj: Project) => {
    const currentHist = historyRef.current.slice(0, historyIndexRef.current + 1);
    currentHist.push(newProj);
    if (currentHist.length > 30) currentHist.shift();
    historyRef.current = currentHist;
    historyIndexRef.current = currentHist.length - 1;
  };

  const handleUndo = () => {
    if (historyIndexRef.current > 0) {
      historyIndexRef.current--;
      const prev = historyRef.current[historyIndexRef.current];
      setProject(prev);
      onProjectUpdated(prev);
    }
  };

  const handleRedo = () => {
    if (historyIndexRef.current < historyRef.current.length - 1) {
      historyIndexRef.current++;
      const next = historyRef.current[historyIndexRef.current];
      setProject(next);
      onProjectUpdated(next);
    }
  };

  // Debounced auto-save
  useEffect(() => {
    setSaveStatus('saving');
    const timer = setTimeout(() => {
      saveProject(project);
      setSaveStatus('saved');
      onProjectUpdated(project);
    }, 1200);

    return () => clearTimeout(timer);
  }, [project]);

  // Recalculate duration
  const recalculateDuration = (clips: Clip[]) => {
    let maxEnd = 5;
    for (const c of clips) {
      const effectiveDuration = (c.duration - c.trimIn - c.trimOut) / c.speed;
      const end = c.startAt + effectiveDuration;
      if (end > maxEnd) maxEnd = end;
    }
    return Math.ceil(maxEnd);
  };

  const updateProjectWithClips = (clips: Clip[]) => {
    const newDur = recalculateDuration(clips);
    const updated: Project = {
      ...project,
      clips,
      duration: newDur,
      lastEdited: Date.now(),
    };
    setProject(updated);
    pushHistory(updated);
  };

  const handleUpdateClip = (updatedClip: Clip) => {
    const newClips = project.clips.map((c) => (c.id === updatedClip.id ? updatedClip : c));
    updateProjectWithClips(newClips);
  };

  const handleDeleteClip = (clipId: string) => {
    const newClips = project.clips.filter((c) => c.id !== clipId);
    setSelectedClipId(null);
    updateProjectWithClips(newClips);
  };

  const handleDuplicateClip = (clip: Clip) => {
    const effectiveDuration = (clip.duration - clip.trimIn - clip.trimOut) / clip.speed;
    const duplicated: Clip = {
      ...clip,
      id: `clip_${Date.now()}_dup`,
      name: `${clip.name} (Copy)`,
      startAt: clip.startAt + effectiveDuration + 0.2,
    };
    const newClips = [...project.clips, duplicated];
    updateProjectWithClips(newClips);
    setSelectedClipId(duplicated.id);
  };

  const handleSplitClip = (clipId: string, splitTime: number) => {
    const clip = project.clips.find((c) => c.id === clipId);
    if (!clip) return;

    const timeIntoClip = (splitTime - clip.startAt) * clip.speed;
    const firstTrimOut = clip.duration - clip.trimIn - timeIntoClip;
    const secondTrimIn = clip.trimIn + timeIntoClip;

    const firstHalf: Clip = {
      ...clip,
      id: `clip_${Date.now()}_a`,
      trimOut: Math.max(0, firstTrimOut),
    };

    const secondHalf: Clip = {
      ...clip,
      id: `clip_${Date.now()}_b`,
      startAt: splitTime,
      trimIn: Math.min(clip.duration, secondTrimIn),
    };

    const newClips = project.clips
      .filter((c) => c.id !== clipId)
      .concat([firstHalf, secondHalf])
      .sort((a, b) => a.startAt - b.startAt);

    updateProjectWithClips(newClips);
    setSelectedClipId(secondHalf.id);
  };

  const handleTrimClip = (clipId: string, trimIn: number, trimOut: number) => {
    const newClips = project.clips.map((c) => (c.id === clipId ? { ...c, trimIn, trimOut } : c));
    updateProjectWithClips(newClips);
  };

  const handleAddTextClip = (textStr: string) => {
    const newClip: Clip = {
      id: `clip_${Date.now()}_txt`,
      trackId: 'text',
      type: 'text',
      name: textStr.slice(0, 15),
      src: '',
      duration: 4,
      startAt: currentTime,
      trimIn: 0,
      trimOut: 0,
      speed: 1.0,
      transform: { x: 0, y: 0, scale: 1.0, rotation: 0, opacity: 1.0, flipH: false, flipV: false },
      keyframes: [],
      filter: { preset: 'none', intensity: 80 },
      colorAdjustment: { brightness: 0, contrast: 0, saturation: 0, exposure: 0, temperature: 0, tint: 0, highlights: 0, shadows: 0, sharpen: 0, vignette: 0, fade: 0, grain: 0 },
      effect: 'none',
      transition: { type: 'none', duration: 0 },
      chromaKey: { enabled: false, color: '#00ff00', similarity: 40, smoothness: 20 },
      mask: { type: 'none', feather: 0 },
      audio: { volume: 100, muted: false, fadeIn: 0, fadeOut: 0 },
      textConfig: {
        text: textStr,
        font: 'Plus Jakarta Sans',
        fontSize: 34,
        bold: true,
        italic: false,
        align: 'center',
        letterSpacing: 0,
        lineSpacing: 1.2,
        color: '#ffffff',
        strokeColor: '#000000',
        strokeWidth: 2,
        bgColor: 'rgba(0,0,0,0.65)',
        bgRadius: 8,
        shadowColor: 'rgba(0,0,0,0.8)',
        animation: 'pop',
      },
    };

    updateProjectWithClips([...project.clips, newClip]);
    setSelectedClipId(newClip.id);
  };

  const handleAddSticker = (src: string, name: string) => {
    const newClip: Clip = {
      id: `clip_${Date.now()}_stk`,
      trackId: 'sticker',
      type: 'sticker',
      name,
      src,
      duration: 4,
      startAt: currentTime,
      trimIn: 0,
      trimOut: 0,
      speed: 1.0,
      transform: { x: 0, y: 0, scale: 0.8, rotation: 0, opacity: 1.0, flipH: false, flipV: false },
      keyframes: [],
      inAnimation: { type: 'pop', duration: 0.5 },
      filter: { preset: 'none', intensity: 80 },
      colorAdjustment: { brightness: 0, contrast: 0, saturation: 0, exposure: 0, temperature: 0, tint: 0, highlights: 0, shadows: 0, sharpen: 0, vignette: 0, fade: 0, grain: 0 },
      effect: 'none',
      transition: { type: 'none', duration: 0 },
      chromaKey: { enabled: false, color: '#00ff00', similarity: 40, smoothness: 20 },
      mask: { type: 'none', feather: 0 },
      audio: { volume: 100, muted: false, fadeIn: 0, fadeOut: 0 },
    };

    updateProjectWithClips([...project.clips, newClip]);
    setSelectedClipId(newClip.id);
  };

  const handleAddNewsClip = (cfg: NewsToolConfig) => {
    const newClip: Clip = {
      id: `clip_${Date.now()}_news`,
      trackId: 'text',
      type: 'text',
      name: cfg.headline.slice(0, 16),
      src: '',
      duration: 6,
      startAt: currentTime,
      trimIn: 0,
      trimOut: 0,
      speed: 1.0,
      transform: { x: 0, y: 0, scale: 1.0, rotation: 0, opacity: 1.0, flipH: false, flipV: false },
      keyframes: [],
      filter: { preset: 'none', intensity: 80 },
      colorAdjustment: { brightness: 0, contrast: 0, saturation: 0, exposure: 0, temperature: 0, tint: 0, highlights: 0, shadows: 0, sharpen: 0, vignette: 0, fade: 0, grain: 0 },
      effect: 'none',
      transition: { type: 'none', duration: 0 },
      chromaKey: { enabled: false, color: '#00ff00', similarity: 40, smoothness: 20 },
      mask: { type: 'none', feather: 0 },
      audio: { volume: 100, muted: false, fadeIn: 0, fadeOut: 0 },
      newsConfig: cfg,
    };

    updateProjectWithClips([...project.clips, newClip]);
    setSelectedClipId(newClip.id);
  };

  const handleAddAudioClip = (audio: { name: string; url: string; duration: number; waveform: number[]; type: 'audio' }) => {
    const newClip: Clip = {
      id: `clip_${Date.now()}_aud`,
      trackId: 'audio',
      type: 'audio',
      name: audio.name,
      src: audio.url,
      duration: audio.duration,
      startAt: currentTime,
      trimIn: 0,
      trimOut: 0,
      speed: 1.0,
      transform: { x: 0, y: 0, scale: 1.0, rotation: 0, opacity: 1.0, flipH: false, flipV: false },
      keyframes: [],
      filter: { preset: 'none', intensity: 80 },
      colorAdjustment: { brightness: 0, contrast: 0, saturation: 0, exposure: 0, temperature: 0, tint: 0, highlights: 0, shadows: 0, sharpen: 0, vignette: 0, fade: 0, grain: 0 },
      effect: 'none',
      transition: { type: 'none', duration: 0 },
      chromaKey: { enabled: false, color: '#00ff00', similarity: 40, smoothness: 20 },
      mask: { type: 'none', feather: 0 },
      audio: { volume: 100, muted: false, fadeIn: 0.5, fadeOut: 0.5 },
      waveformData: audio.waveform,
    };

    updateProjectWithClips([...project.clips, newClip]);
    setSelectedClipId(newClip.id);
  };

  // Auto Reframe
  const handleAutoReframe = (targetRatio: AspectRatio) => {
    const updatedClips = project.clips.map((c) => {
      if (c.trackId === 'main') {
        const scaleVal = targetRatio === '9:16' ? 1.4 : 1.0;
        return {
          ...c,
          transform: { ...c.transform, scale: scaleVal, x: 0, y: 0 },
        };
      }
      return c;
    });

    const updated = { ...project, aspectRatio: targetRatio, clips: updatedClips };
    setProject(updated);
    pushHistory(updated);
  };

  // Step Frame (-1 or +1 frame at 30 FPS = ~0.033s)
  const handleStepFrame = (direction: 'prev' | 'next') => {
    const frameTime = 1 / (project.fps || 30);
    if (direction === 'prev') {
      setCurrentTime((t) => Math.max(0, Number((t - frameTime).toFixed(3))));
    } else {
      setCurrentTime((t) => Math.min(project.duration, Number((t + frameTime).toFixed(3))));
    }
  };

  // Continuous Canvas Frame Rendering Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let baseW = 540;
    let baseH = 960;
    if (project.aspectRatio === '16:9') {
      baseW = 960;
      baseH = 540;
    } else if (project.aspectRatio === '1:1') {
      baseW = 720;
      baseH = 720;
    } else if (project.aspectRatio === '4:3') {
      baseW = 800;
      baseH = 600;
    } else if (project.aspectRatio === '3:4') {
      baseW = 600;
      baseH = 800;
    } else if (project.aspectRatio === '21:9') {
      baseW = 1050;
      baseH = 450;
    }

    if (canvas.width !== baseW || canvas.height !== baseH) {
      canvas.width = baseW;
      canvas.height = baseH;
    }

    renderFrame(canvas, project, currentTime, selectedClipId);
  }, [project, currentTime, selectedClipId]);

  // Playback Loop
  useEffect(() => {
    if (!isPlaying) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    lastTimeRef.current = performance.now();

    const loop = (now: number) => {
      const deltaSec = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;

      setCurrentTime((prev) => {
        const next = prev + deltaSec;
        if (next >= project.duration) {
          setIsPlaying(false);
          return project.duration;
        }
        return next;
      });

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, project.duration]);

  const formatTimecode = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    const cs = Math.floor((sec % 1) * 100);
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${cs.toString().padStart(2, '0')}`;
  };

  const selectedClip = project.clips.find((c) => c.id === selectedClipId) || null;

  return (
    <div className="flex flex-col h-screen bg-[#090d16] text-slate-100 overflow-hidden select-none">
      {/* TOP BAR CONTRACT: 3 Zones */}
      <header className="flex items-center justify-between px-3 md:px-5 py-2.5 bg-slate-950 border-b border-slate-800/80 z-30 shrink-0">
        {/* Left: Back & Rename Project */}
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <input
            type="text"
            value={project.name}
            onChange={(e) => setProject({ ...project, name: e.target.value })}
            className="font-semibold text-xs md:text-sm text-white bg-transparent border-b border-transparent hover:border-slate-700 focus:border-indigo-500 focus:outline-none px-1 py-0.5 max-w-[130px] md:max-w-[200px] truncate"
          />
          <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <Check className="w-3 h-3" />
            {saveStatus === 'saved' ? t('save') : t('saving')}
          </span>
        </div>

        {/* Center: Undo / Redo & Media Library & Canvas Ratio */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleUndo}
            disabled={historyIndexRef.current <= 0}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={handleRedo}
            disabled={historyIndexRef.current >= historyRef.current.length - 1}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <Redo2 className="w-4 h-4" />
          </button>

          {/* Media Library Button */}
          <button
            onClick={() => setIsMediaLibraryOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 text-xs hover:text-white"
          >
            <FolderOpen className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Media</span>
          </button>

          {/* Canvas Settings Button (Section 5) */}
          <button
            onClick={() => setIsCanvasModalOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 text-xs font-mono font-medium hover:text-white"
          >
            <Ratio className="w-3.5 h-3.5 text-indigo-400" />
            <span>{project.aspectRatio}</span>
          </button>
        </div>

        {/* Right: AI Studio & Export CTA */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAiOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-indigo-500/40 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 text-xs font-medium transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">AI Studio</span>
          </button>

          <button
            onClick={() => setIsExportOpen(true)}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-semibold text-xs shadow-md shadow-indigo-500/20 active:scale-95 transition-transform"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t('export')}</span>
          </button>
        </div>
      </header>

      {/* CENTER: Canvas Player Viewport */}
      <div
        ref={playerContainerRef}
        className={`relative flex-1 flex flex-col items-center justify-center bg-[#070a12] p-2 overflow-hidden ${
          isFullscreenPreview ? 'fixed inset-0 z-50 p-0 bg-black' : ''
        }`}
      >
        {/* Canvas Ratio Wrapper */}
        <div
          style={{
            aspectRatio:
              project.aspectRatio === '9:16'
                ? '9/16'
                : project.aspectRatio === '16:9'
                ? '16/9'
                : project.aspectRatio === '1:1'
                ? '1/1'
                : project.aspectRatio === '4:3'
                ? '4/3'
                : project.aspectRatio === '3:4'
                ? '3/4'
                : '21/9',
          }}
          className="relative max-h-full max-w-full rounded-2xl overflow-hidden shadow-2xl border border-slate-800/80 bg-black flex items-center justify-center"
        >
          <canvas ref={canvasRef} className="w-full h-full object-contain" />
        </div>

        {/* Player Transport Bar (Play/Pause, Prev/Next Frame, Fullscreen) */}
        <div className="absolute bottom-2 flex items-center gap-2 sm:gap-3 px-3 py-1.5 rounded-2xl bg-black/75 backdrop-blur-md border border-white/10 text-white shadow-lg z-20">
          <button
            onClick={() => setCurrentTime(0)}
            title="Jump to Start"
            className="p-1 rounded text-slate-400 hover:text-white"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Previous Frame (-1 frame) */}
          <button
            onClick={() => handleStepFrame('prev')}
            title="Previous Frame (1/30s)"
            className="p-1 rounded text-slate-400 hover:text-white"
          >
            <StepBack className="w-3.5 h-3.5" />
          </button>

          {/* Play / Pause */}
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-2.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-md active:scale-95 transition-transform"
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white translate-x-0.5" />}
          </button>

          {/* Next Frame (+1 frame) */}
          <button
            onClick={() => handleStepFrame('next')}
            title="Next Frame (1/30s)"
            className="p-1 rounded text-slate-400 hover:text-white"
          >
            <StepForward className="w-3.5 h-3.5" />
          </button>

          <div className="h-4 w-[1px] bg-slate-700 mx-0.5" />

          {/* Timecode display */}
          <div className="font-mono text-xs font-semibold text-slate-200">
            {formatTimecode(currentTime)} <span className="text-slate-500">/ {formatTimecode(project.duration)}</span>
          </div>

          <div className="h-4 w-[1px] bg-slate-700 mx-0.5" />

          {/* Fullscreen Preview Toggle */}
          <button
            onClick={() => setIsFullscreenPreview(!isFullscreenPreview)}
            title="Fullscreen Preview"
            className="p-1 rounded text-slate-400 hover:text-white"
          >
            {isFullscreenPreview ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* BOTTOM SECTION: Timeline & Tool Panels */}
      <div className="flex flex-col shrink-0 z-20">
        <Timeline
          clips={project.clips}
          duration={project.duration}
          currentTime={currentTime}
          selectedClipId={selectedClipId}
          zoomScale={zoomScale}
          onSeek={(t) => setCurrentTime(t)}
          onSelectClip={(id) => setSelectedClipId(id)}
          onSplitClip={handleSplitClip}
          onTrimClip={handleTrimClip}
          onZoomChange={(z) => setZoomScale(z)}
          onAddMediaClick={(track) => {
            if (track === 'sticker') {
              setIsStickersOpen(true);
            } else if (track === 'voice') {
              setRecordType('voice');
            } else {
              setIsMediaLibraryOpen(true);
            }
          }}
        />

        <ToolPanels
          selectedClip={selectedClip}
          currentTime={currentTime}
          onUpdateClip={handleUpdateClip}
          onDeleteClip={handleDeleteClip}
          onDuplicateClip={handleDuplicateClip}
          onAddTextClip={handleAddTextClip}
          onAddAudioClip={handleAddAudioClip}
          onOpenSpeedCurve={() => setIsSpeedCurveOpen(true)}
          onOpenAnimation={() => setIsAnimationOpen(true)}
          onOpenNewsTools={() => setIsNewsToolsOpen(true)}
          onOpenStickers={() => setIsStickersOpen(true)}
          onOpenAudioAi={() => setIsAudioAiOpen(true)}
          onOpenTts={() => setIsTtsOpen(true)}
        />
      </div>

      {/* Media Library Drawer */}
      <MediaLibraryDrawer
        isOpen={isMediaLibraryOpen}
        onClose={() => setIsMediaLibraryOpen(false)}
        onInsertClips={(newClips) => updateProjectWithClips([...project.clips, ...newClips])}
        currentTime={currentTime}
      />

      {/* Canvas Settings Modal */}
      <CanvasSettingsModal
        currentRatio={project.aspectRatio}
        currentSettings={project.canvasSettings}
        isOpen={isCanvasModalOpen}
        onClose={() => setIsCanvasModalOpen(false)}
        onApply={(ratio, settings) => {
          const updated = { ...project, aspectRatio: ratio, canvasSettings: settings };
          setProject(updated);
          pushHistory(updated);
        }}
        onAutoReframe={handleAutoReframe}
      />

      {/* Speed Curve Modal */}
      {isSpeedCurveOpen && selectedClip && (
        <SpeedCurveModal
          clip={selectedClip}
          isOpen={isSpeedCurveOpen}
          onClose={() => setIsSpeedCurveOpen(false)}
          onApplyCurve={(preset, points) => {
            handleUpdateClip({
              ...selectedClip,
              speedCurve: { preset, points },
            });
          }}
        />
      )}

      {/* Animation Drawer */}
      {isAnimationOpen && selectedClip && (
        <AnimationDrawer
          clip={selectedClip}
          isOpen={isAnimationOpen}
          onClose={() => setIsAnimationOpen(false)}
          onUpdateClip={handleUpdateClip}
        />
      )}

      {/* News Tools Drawer */}
      <NewsToolsDrawer
        isOpen={isNewsToolsOpen}
        onClose={() => setIsNewsToolsOpen(false)}
        onAddNewsClip={handleAddNewsClip}
      />

      {/* Stickers Drawer */}
      <StickerDrawer
        isOpen={isStickersOpen}
        onClose={() => setIsStickersOpen(false)}
        onAddSticker={handleAddSticker}
      />

      {/* Audio AI & Voice Changer Drawer */}
      {isAudioAiOpen && selectedClip && (
        <AudioAiDrawer
          clip={selectedClip}
          isOpen={isAudioAiOpen}
          onClose={() => setIsAudioAiOpen(false)}
          onUpdateClip={handleUpdateClip}
        />
      )}

      {/* TTS Modal */}
      <TtsModal
        isOpen={isTtsOpen}
        onClose={() => setIsTtsOpen(false)}
        onAddTtsAudio={handleAddAudioClip}
      />

      {/* Export Modal */}
      {isExportOpen && (
        <ExportModal
          project={project}
          isOpen={isExportOpen}
          onClose={() => setIsExportOpen(false)}
        />
      )}

      {/* AI Studio Modal */}
      {isAiOpen && (
        <AiModal
          isOpen={isAiOpen}
          onClose={() => setIsAiOpen(false)}
          onAddSubtitles={(subs) => {
            const newClips: Clip[] = subs.map((sub, i) => ({
              id: `clip_${Date.now()}_sub_${i}`,
              trackId: 'text',
              type: 'text',
              name: sub.text.slice(0, 15),
              src: '',
              duration: Math.max(1, sub.end - sub.start),
              startAt: sub.start,
              trimIn: 0,
              trimOut: 0,
              speed: 1.0,
              transform: { x: 0, y: 120, scale: 1.0, rotation: 0, opacity: 1.0, flipH: false, flipV: false },
              keyframes: [],
              filter: { preset: 'none', intensity: 80 },
              colorAdjustment: { brightness: 0, contrast: 0, saturation: 0, exposure: 0, temperature: 0, tint: 0, highlights: 0, shadows: 0, sharpen: 0, vignette: 0, fade: 0, grain: 0 },
              effect: 'none',
              transition: { type: 'none', duration: 0 },
              chromaKey: { enabled: false, color: '#00ff00', similarity: 40, smoothness: 20 },
              mask: { type: 'none', feather: 0 },
              audio: { volume: 100, muted: false, fadeIn: 0, fadeOut: 0 },
              textConfig: {
                text: sub.text,
                font: 'Plus Jakarta Sans',
                fontSize: 30,
                bold: true,
                italic: false,
                align: 'center',
                letterSpacing: 0,
                lineSpacing: 1.2,
                color: '#facc15',
                strokeColor: '#000000',
                strokeWidth: 2.5,
                bgColor: 'rgba(0,0,0,0.7)',
                bgRadius: 6,
                shadowColor: 'rgba(0,0,0,0.9)',
                animation: 'pop',
              },
            }));
            updateProjectWithClips([...project.clips, ...newClips]);
          }}
        />
      )}

      {/* Camera / Voice Recorder Modal */}
      {recordType && (
        <RecordModal
          type={recordType}
          isOpen={!!recordType}
          onClose={() => setRecordType(null)}
          onSaveMedia={(media) => {
            const newClip: Clip = {
              id: `clip_${Date.now()}`,
              trackId: media.type === 'video' ? 'main' : 'voice',
              type: media.type,
              name: media.name,
              src: media.url,
              duration: media.duration,
              startAt: currentTime,
              trimIn: 0,
              trimOut: 0,
              speed: 1.0,
              transform: { x: 0, y: 0, scale: 1.0, rotation: 0, opacity: 1.0, flipH: false, flipV: false },
              keyframes: [],
              filter: { preset: 'none', intensity: 80 },
              colorAdjustment: { brightness: 0, contrast: 0, saturation: 0, exposure: 0, temperature: 0, tint: 0, highlights: 0, shadows: 0, sharpen: 0, vignette: 0, fade: 0, grain: 0 },
              effect: 'none',
              transition: { type: 'none', duration: 0.5 },
              chromaKey: { enabled: false, color: '#00ff00', similarity: 40, smoothness: 20 },
              mask: { type: 'none', feather: 0 },
              audio: { volume: 100, muted: false, fadeIn: 0, fadeOut: 0 },
            };
            updateProjectWithClips([...project.clips, newClip]);
            setSelectedClipId(newClip.id);
          }}
        />
      )}
    </div>
  );
};
