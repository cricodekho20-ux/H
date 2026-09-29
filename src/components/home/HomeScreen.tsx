import React, { useState, useRef, useEffect } from 'react';
import { Project, AspectRatio, Clip } from '../../types/editor';
import {
  Plus, Video, Image as ImageIcon, Camera, Mic, Settings,
  Sparkles, Trash2, Clock, Ratio, Play, ArrowRight, Film, Copy, Edit2, Check, X,
  Smartphone, Download, FileVideo, Layers
} from 'lucide-react';
import { t, Language } from '../../utils/i18n';
import { TEMPLATES, TemplatePreset, generateStockPhoto, generateSyntheticVideoClip } from '../../utils/sampleMedia';
import { RecordModal } from '../media/RecordModal';
import { SettingsModal } from '../settings/SettingsModal';

interface HomeScreenProps {
  projects: Project[];
  onOpenProject: (project: Project) => void;
  onCreateProject: (name: string, ratio: AspectRatio, initialClips?: Clip[]) => void;
  onDeleteProject: (projectId: string) => void;
  onDuplicateProject: (project: Project) => void;
  onRenameProject: (projectId: string, newName: string) => void;
  onLanguageChange: (lang: Language) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  projects,
  onOpenProject,
  onCreateProject,
  onDeleteProject,
  onDuplicateProject,
  onRenameProject,
  onLanguageChange,
}) => {
  const [activeSection, setActiveSection] = useState<'recent' | 'drafts' | 'templates'>('recent');
  const [recordType, setRecordType] = useState<'video' | 'voice' | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isGeneratingSample, setIsGeneratingSample] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  const videoInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      alert('To install EditPro on Android: tap the browser menu (⋮) and select "Install app" or "Add to Home screen".');
    }
  };

  // Directly create new project without modal (Req 5: Aspect ratio inside canvas settings)
  const handleStartNewProject = () => {
    const defaultRatio: AspectRatio =
      (localStorage.getItem('editpro_def_ratio') as AspectRatio) || '9:16';
    onCreateProject('Untitled Project', defaultRatio);
  };

  // Handle local file import (video or photo)
  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>, mediaType: 'video' | 'image') => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const url = URL.createObjectURL(file);

    const initialClip: Clip = {
      id: `clip_${Date.now()}`,
      trackId: 'main',
      type: mediaType,
      name: file.name.slice(0, 20),
      src: url,
      duration: mediaType === 'video' ? 10 : 5,
      startAt: 0,
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

    onCreateProject(file.name.replace(/\.[^/.]+$/, ''), '9:16', [initialClip]);
    e.target.value = '';
  };

  // Create Project from Template
  const handleApplyTemplate = async (template: TemplatePreset) => {
    setIsGeneratingSample(true);
    try {
      const theme = template.id === 'tpl_shorts_hook'
        ? 'neon_grid'
        : template.id === 'tpl_reel_cinematic'
        ? 'mumbai_sunset'
        : template.id === 'tpl_vlog_travel'
        ? 'himalayas'
        : 'creator_studio';

      const vid = await generateSyntheticVideoClip(theme, 8, template.aspectRatio);

      const mainClip: Clip = {
        id: `clip_${Date.now()}_1`,
        trackId: 'main',
        type: 'video',
        name: `${template.name} Background`,
        src: vid.url,
        duration: 8,
        startAt: 0,
        trimIn: 0,
        trimOut: 0,
        speed: 1.0,
        transform: { x: 0, y: 0, scale: 1.0, rotation: 0, opacity: 1.0, flipH: false, flipV: false },
        keyframes: [
          { time: 0, scaleX: 1.0, scaleY: 1.0, opacity: 1.0 },
          { time: 4, scaleX: 1.15, scaleY: 1.15, opacity: 1.0 },
        ],
        filter: { preset: template.id === 'tpl_reel_cinematic' ? 'cinematic' : 'warm', intensity: 85 },
        colorAdjustment: { brightness: 5, contrast: 15, saturation: 10, exposure: 0, temperature: 10, tint: 0, highlights: 0, shadows: 0, sharpen: 10, vignette: 30, fade: 0, grain: 0 },
        effect: template.id === 'tpl_shorts_hook' ? 'zoom' : 'none',
        transition: { type: 'dissolve', duration: 0.8 },
        chromaKey: { enabled: false, color: '#00ff00', similarity: 40, smoothness: 20 },
        mask: { type: 'none', feather: 0 },
        audio: { volume: 100, muted: false, fadeIn: 0.5, fadeOut: 0.8 },
      };

      const titleClip: Clip = {
        id: `clip_${Date.now()}_2`,
        trackId: 'text',
        type: 'text',
        name: 'Main Title',
        src: '',
        duration: 4,
        startAt: 0.5,
        trimIn: 0,
        trimOut: 0,
        speed: 1.0,
        transform: { x: 0, y: -60, scale: 1.0, rotation: 0, opacity: 1.0, flipH: false, flipV: false },
        keyframes: [],
        filter: { preset: 'none', intensity: 80 },
        colorAdjustment: { brightness: 0, contrast: 0, saturation: 0, exposure: 0, temperature: 0, tint: 0, highlights: 0, shadows: 0, sharpen: 0, vignette: 0, fade: 0, grain: 0 },
        effect: 'none',
        transition: { type: 'none', duration: 0 },
        chromaKey: { enabled: false, color: '#00ff00', similarity: 40, smoothness: 20 },
        mask: { type: 'none', feather: 0 },
        audio: { volume: 100, muted: false, fadeIn: 0, fadeOut: 0 },
        textConfig: {
          text: template.name,
          font: 'Syne',
          fontSize: 34,
          bold: true,
          italic: false,
          align: 'center',
          letterSpacing: 0,
          lineSpacing: 1.2,
          color: '#ffffff',
          strokeColor: '#000000',
          strokeWidth: 3,
          bgColor: 'rgba(0,0,0,0.65)',
          bgRadius: 10,
          shadowColor: 'rgba(0,0,0,0.9)',
          animation: 'pop',
        },
      };

      onCreateProject(template.name, template.aspectRatio, [mainClip, titleClip]);
    } catch (err) {
      console.error('Failed to instantiate template:', err);
    } finally {
      setIsGeneratingSample(false);
    }
  };

  // Instant Sample Project
  const handleCreateSampleProject = async () => {
    setIsGeneratingSample(true);
    try {
      const vid = await generateSyntheticVideoClip('mumbai_sunset', 8, '9:16');
      const photo = generateStockPhoto('Creator Studio India', '#4f46e5', '#ec4899', 'Shot on EditPro Mobile', '9:16');

      const clip1: Clip = {
        id: `clip_${Date.now()}_1`,
        trackId: 'main',
        type: 'video',
        name: 'Mumbai Marine Sunset',
        src: vid.url,
        duration: 8,
        startAt: 0,
        trimIn: 0,
        trimOut: 0,
        speed: 1.0,
        transform: { x: 0, y: 0, scale: 1.0, rotation: 0, opacity: 1.0, flipH: false, flipV: false },
        keyframes: [],
        filter: { preset: 'warm', intensity: 80 },
        colorAdjustment: { brightness: 5, contrast: 15, saturation: 10, exposure: 0, temperature: 15, tint: 0, highlights: 0, shadows: 0, sharpen: 10, vignette: 25, fade: 0, grain: 0 },
        effect: 'none',
        transition: { type: 'dissolve', duration: 0.6 },
        chromaKey: { enabled: false, color: '#00ff00', similarity: 40, smoothness: 20 },
        mask: { type: 'none', feather: 0 },
        audio: { volume: 100, muted: false, fadeIn: 0, fadeOut: 0 },
      };

      const clip2: Clip = {
        id: `clip_${Date.now()}_2`,
        trackId: 'main',
        type: 'image',
        name: 'Creator Studio Card',
        src: photo.url,
        duration: 5,
        startAt: 8,
        trimIn: 0,
        trimOut: 0,
        speed: 1.0,
        transform: { x: 0, y: 0, scale: 1.0, rotation: 0, opacity: 1.0, flipH: false, flipV: false },
        keyframes: [],
        photoAnimation: 'ken_burns',
        filter: { preset: 'cinematic', intensity: 90 },
        colorAdjustment: { brightness: 0, contrast: 10, saturation: 10, exposure: 0, temperature: 0, tint: 0, highlights: 0, shadows: 0, sharpen: 5, vignette: 20, fade: 0, grain: 0 },
        effect: 'none',
        transition: { type: 'slide_left', duration: 0.6 },
        chromaKey: { enabled: false, color: '#00ff00', similarity: 40, smoothness: 20 },
        mask: { type: 'none', feather: 0 },
        audio: { volume: 100, muted: false, fadeIn: 0, fadeOut: 0 },
      };

      const textClip: Clip = {
        id: `clip_${Date.now()}_3`,
        trackId: 'text',
        type: 'text',
        name: 'Subtitle',
        src: '',
        duration: 4,
        startAt: 1,
        trimIn: 0,
        trimOut: 0,
        speed: 1.0,
        transform: { x: 0, y: 80, scale: 1.0, rotation: 0, opacity: 1.0, flipH: false, flipV: false },
        keyframes: [],
        filter: { preset: 'none', intensity: 80 },
        colorAdjustment: { brightness: 0, contrast: 0, saturation: 0, exposure: 0, temperature: 0, tint: 0, highlights: 0, shadows: 0, sharpen: 0, vignette: 0, fade: 0, grain: 0 },
        effect: 'none',
        transition: { type: 'none', duration: 0 },
        chromaKey: { enabled: false, color: '#00ff00', similarity: 40, smoothness: 20 },
        mask: { type: 'none', feather: 0 },
        audio: { volume: 100, muted: false, fadeIn: 0, fadeOut: 0 },
        textConfig: {
          text: 'Made with EditPro Studio',
          font: 'Plus Jakarta Sans',
          fontSize: 28,
          bold: true,
          italic: false,
          align: 'center',
          letterSpacing: 0,
          lineSpacing: 1.2,
          color: '#ffffff',
          strokeColor: '#000000',
          strokeWidth: 2,
          bgColor: 'rgba(0,0,0,0.7)',
          bgRadius: 8,
          shadowColor: 'rgba(0,0,0,0.8)',
          animation: 'bounce',
        },
      };

      onCreateProject('Mumbai Vlog Sample', '9:16', [clip1, clip2, textClip]);
    } catch (err) {
      console.error('Failed to create sample project:', err);
    } finally {
      setIsGeneratingSample(false);
    }
  };

  const handleStartRename = (proj: Project) => {
    setRenamingId(proj.id);
    setRenameValue(proj.name);
  };

  const handleConfirmRename = (id: string) => {
    if (renameValue.trim()) {
      onRenameProject(id, renameValue.trim());
    }
    setRenamingId(null);
  };

  const formatSec = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = Math.round(sec % 60);
    return `${mins}:${s.toString().padStart(2, '0')}`;
  };

  const formatTimeAgo = (timestamp: number) => {
    const diff = (Date.now() - timestamp) / 1000;
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col justify-between max-w-5xl mx-auto px-4 py-6 md:px-8">
      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={videoInputRef}
        accept="video/*"
        className="hidden"
        onChange={(e) => handleFileImport(e, 'video')}
      />
      <input
        type="file"
        ref={photoInputRef}
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFileImport(e, 'image')}
      />

      {/* Top Header Bar */}
      <header className="flex items-center justify-between pb-6 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <Film className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-display font-extrabold text-2xl tracking-tight text-white">
              EDIT<span className="text-indigo-400">PRO</span>
            </h1>
            <span className="text-[11px] text-slate-400 font-medium">Video Studio for Creators</span>
          </div>
        </div>

        <button
          onClick={() => setIsSettingsOpen(true)}
          className="p-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
        >
          <Settings className="w-5 h-5" />
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 py-6 flex flex-col gap-8">
        {/* Hero Action: + New Project (Direct tap opens project, Aspect Ratio in Canvas Settings) */}
        <div className="flex flex-col gap-4">
          <button
            onClick={handleStartNewProject}
            className="group relative w-full p-6 md:p-8 rounded-3xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-xl shadow-indigo-600/20 active:scale-[0.99] transition-all flex items-center justify-between overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20">
                <Plus className="w-8 h-8 text-white stroke-[2.5]" />
              </div>
              <div className="text-left">
                <h2 className="font-display font-bold text-xl md:text-2xl tracking-tight">
                  {t('new_project')}
                </h2>
                <p className="text-xs md:text-sm text-indigo-100/90 font-medium mt-0.5">
                  Start fresh with timeline, keyframes, speed curves & filters
                </p>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/20 font-medium text-xs backdrop-blur-md">
              <span>Create</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </button>

          {/* Quick Actions Bar */}
          <div className="grid grid-cols-4 gap-2.5 md:gap-4">
            <button
              onClick={() => videoInputRef.current?.click()}
              className="p-3 md:p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-850 active:scale-95 transition-all flex flex-col items-center gap-2 text-center"
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                <Video className="w-5 h-5" />
              </div>
              <span className="text-[11px] md:text-xs font-semibold text-slate-200">
                {t('import_video')}
              </span>
            </button>

            <button
              onClick={() => photoInputRef.current?.click()}
              className="p-3 md:p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-850 active:scale-95 transition-all flex flex-col items-center gap-2 text-center"
            >
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                <ImageIcon className="w-5 h-5" />
              </div>
              <span className="text-[11px] md:text-xs font-semibold text-slate-200">
                {t('import_photo')}
              </span>
            </button>

            <button
              onClick={() => setRecordType('video')}
              className="p-3 md:p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-850 active:scale-95 transition-all flex flex-col items-center gap-2 text-center"
            >
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
                <Camera className="w-5 h-5" />
              </div>
              <span className="text-[11px] md:text-xs font-semibold text-slate-200">
                {t('record_video')}
              </span>
            </button>

            <button
              onClick={() => setRecordType('voice')}
              className="p-3 md:p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-850 active:scale-95 transition-all flex flex-col items-center gap-2 text-center"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <Mic className="w-5 h-5" />
              </div>
              <span className="text-[11px] md:text-xs font-semibold text-slate-200">
                {t('record_voice')}
              </span>
            </button>
          </div>

          {/* Android Native Install Banner */}
          {!isInstalled && (
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Install EditPro Native App</h4>
                  <p className="text-[11px] text-slate-400">100% offline editing, zero VPN needed</p>
                </div>
              </div>
              <button
                onClick={handleInstallClick}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Install</span>
              </button>
            </div>
          )}
        </div>

        {/* Section Navigation Tabs: Recent Projects, Drafts, Templates, Settings */}
        <div className="flex items-center gap-1 sm:gap-2 border-b border-slate-800 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveSection('recent')}
            className={`pb-2.5 px-2 text-xs md:text-sm font-semibold transition-colors relative whitespace-nowrap ${
              activeSection === 'recent' ? 'text-white' : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            {t('recent_projects')} ({projects.length})
            {activeSection === 'recent' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-full" />
            )}
          </button>

          <button
            onClick={() => setActiveSection('drafts')}
            className={`pb-2.5 px-2 text-xs md:text-sm font-semibold transition-colors relative whitespace-nowrap ${
              activeSection === 'drafts' ? 'text-white' : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            Drafts ({projects.length})
            {activeSection === 'drafts' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500 rounded-full" />
            )}
          </button>

          <button
            onClick={() => setActiveSection('templates')}
            className={`pb-2.5 px-2 text-xs md:text-sm font-semibold transition-colors relative whitespace-nowrap ${
              activeSection === 'templates' ? 'text-white' : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            {t('templates')}
            {activeSection === 'templates' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-full" />
            )}
          </button>

          <button
            onClick={() => setIsSettingsOpen(true)}
            className="pb-2.5 px-2 text-xs md:text-sm font-semibold text-slate-400 hover:text-slate-300 transition-colors ml-auto flex items-center gap-1.5 whitespace-nowrap"
          >
            <Settings className="w-3.5 h-3.5 text-slate-400" />
            <span>{t('settings')}</span>
          </button>
        </div>

        {/* Section Content */}
        {activeSection === 'recent' ? (
          <div>
            {projects.length === 0 ? (
              <div className="py-12 px-4 rounded-3xl bg-slate-900/50 border border-slate-800/80 text-center flex flex-col items-center justify-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                  <Film className="w-7 h-7" />
                </div>
                <div className="max-w-sm">
                  <h3 className="font-semibold text-white text-base">No projects yet</h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Create a new project from your photos/videos or test with our ready-to-use sample project!
                  </p>
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={handleStartNewProject}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-md transition-colors"
                  >
                    + New Project
                  </button>
                  <button
                    onClick={handleCreateSampleProject}
                    disabled={isGeneratingSample}
                    className="px-5 py-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-750 text-slate-200 font-medium text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    {isGeneratingSample ? 'Creating Sample...' : 'Try Sample Project'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {projects.map((proj) => (
                  <div
                    key={proj.id}
                    onClick={() => onOpenProject(proj)}
                    className="group relative flex flex-col rounded-2xl bg-slate-900 border border-slate-800/80 hover:border-slate-700 overflow-hidden cursor-pointer shadow-md transition-all active:scale-[0.98]"
                  >
                    {/* Thumbnail */}
                    <div className="relative aspect-video bg-slate-950 flex items-center justify-center overflow-hidden">
                      {proj.thumbnail ? (
                        <img
                          src={proj.thumbnail}
                          alt={proj.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <Film className="w-8 h-8 text-slate-700" />
                      )}

                      {/* Aspect Ratio Badge */}
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-[10px] font-mono font-medium text-white border border-white/10">
                        {proj.aspectRatio}
                      </span>

                      {/* Duration */}
                      <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-[10px] font-mono text-white border border-white/10">
                        {formatSec(proj.duration)}
                      </span>
                    </div>

                    {/* Metadata Card Footer */}
                    <div className="p-3 flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        {renamingId === proj.id ? (
                          <div className="flex items-center gap-1 w-full" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="text"
                              value={renameValue}
                              onChange={(e) => setRenameValue(e.target.value)}
                              className="px-1.5 py-0.5 bg-slate-950 border border-indigo-500 rounded text-xs text-white flex-1"
                              autoFocus
                            />
                            <button
                              onClick={() => handleConfirmRename(proj.id)}
                              className="p-1 text-emerald-400"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setRenamingId(null)}
                              className="p-1 text-slate-400"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <h4 className="font-semibold text-white text-xs truncate max-w-[110px]">
                              {proj.name}
                            </h4>
                            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => handleStartRename(proj)}
                                title="Rename Project"
                                className="p-1 text-slate-500 hover:text-slate-300 rounded"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => onDuplicateProject(proj)}
                                title="Duplicate"
                                className="p-1 text-slate-500 hover:text-slate-300 rounded"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => onDeleteProject(proj.id)}
                                title="Delete"
                                className="p-1 text-slate-500 hover:text-rose-400 rounded"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-[10px] text-slate-500">
                        <Clock className="w-3 h-3" />
                        <span>{formatTimeAgo(proj.lastEdited)}</span>
                        <span>·</span>
                        <span className="uppercase">{proj.resolution || '1080p'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : activeSection === 'drafts' ? (
          /* Drafts Section */
          <div>
            {projects.length === 0 ? (
              <div className="py-12 px-4 rounded-3xl bg-slate-900/50 border border-slate-800/80 text-center flex flex-col items-center justify-center gap-3">
                <FileVideo className="w-10 h-10 text-amber-500/50" />
                <h3 className="font-semibold text-white text-base">No active drafts</h3>
                <p className="text-xs text-slate-400 max-w-xs">
                  All your work-in-progress edits are automatically saved locally as drafts.
                </p>
                <button
                  onClick={handleStartNewProject}
                  className="mt-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition-colors"
                >
                  Start New Draft
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {projects.map((proj) => (
                  <div
                    key={proj.id}
                    onClick={() => onOpenProject(proj)}
                    className="p-4 rounded-2xl bg-slate-900 border border-slate-800/80 hover:border-amber-500/40 flex flex-col justify-between gap-3 cursor-pointer transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative w-20 h-14 rounded-lg bg-black overflow-hidden shrink-0 border border-slate-800">
                        {proj.thumbnail ? (
                          <img src={proj.thumbnail} alt={proj.name} className="w-full h-full object-cover" />
                        ) : (
                          <Film className="w-6 h-6 text-slate-600 m-auto mt-4" />
                        )}
                        <span className="absolute bottom-1 right-1 px-1 py-0.2 rounded bg-black/80 text-[9px] font-mono text-white">
                          {formatSec(proj.duration)}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold text-[9px] uppercase tracking-wider">
                            Draft
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {proj.aspectRatio}
                          </span>
                        </div>
                        <h4 className="font-semibold text-white text-xs truncate">
                          {proj.name}
                        </h4>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1">
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span>{formatTimeAgo(proj.lastEdited)}</span>
                          <span>·</span>
                          <span>{proj.clips.length} clip(s)</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleStartRename(proj)}
                          title="Rename"
                          className="p-1 text-slate-400 hover:text-white"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => onDuplicateProject(proj)}
                          title="Duplicate"
                          className="p-1 text-slate-400 hover:text-white"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => onDeleteProject(proj.id)}
                          title="Delete Draft"
                          className="p-1 text-slate-400 hover:text-rose-400"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>

                      <button
                        onClick={() => onOpenProject(proj)}
                        className="px-3 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 font-medium text-[11px] flex items-center gap-1 transition-colors"
                      >
                        <Play className="w-3 h-3 fill-amber-300" />
                        <span>Resume</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Templates Section */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-4">
            {TEMPLATES.map((tpl) => (
              <div
                key={tpl.id}
                className="p-5 rounded-3xl bg-slate-900 border border-slate-800 hover:border-slate-700 flex flex-col justify-between gap-4 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span
                      style={{ color: tpl.color }}
                      className="text-xs font-semibold uppercase tracking-wider"
                    >
                      {tpl.category}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400 px-2 py-0.5 rounded-full bg-slate-800">
                      {tpl.aspectRatio} · {tpl.duration}s
                    </span>
                  </div>
                  <h3 className="font-bold text-white text-base">{tpl.name}</h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    {tpl.description}
                  </p>
                </div>

                <button
                  onClick={() => handleApplyTemplate(tpl)}
                  disabled={isGeneratingSample}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium text-xs flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/20 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {isGeneratingSample ? 'Preparing Template...' : t('use_template')}
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer / Copyright */}
      <footer className="pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
        <div>EDITPRO © 2026 · Offline Video & Photo Studio for Indian Creators</div>
        <div className="flex items-center gap-4">
          <button onClick={() => setIsSettingsOpen(true)} className="hover:text-slate-300">
            {t('settings')}
          </button>
          <span>·</span>
          <span>100% Private Local Storage</span>
        </div>
      </footer>

      {/* Camera / Voice Recorder Modal */}
      {recordType && (
        <RecordModal
          type={recordType}
          isOpen={!!recordType}
          onClose={() => setRecordType(null)}
          onSaveMedia={(media) => {
            const clip: Clip = {
              id: `clip_${Date.now()}`,
              trackId: media.type === 'video' ? 'main' : 'voice',
              type: media.type,
              name: media.name,
              src: media.url,
              duration: media.duration,
              startAt: 0,
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
            onCreateProject(media.name, '9:16', [clip]);
          }}
        />
      )}

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onLanguageChange={onLanguageChange}
      />
    </div>
  );
};
