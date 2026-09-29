import React, { useState, useEffect } from 'react';
import { Project, AspectRatio, Clip } from './types/editor';
import { getAllProjects, saveProject, deleteProject, getActiveProjectId, setActiveProjectId } from './utils/storage';
import { HomeScreen } from './components/home/HomeScreen';
import { EditorScreen } from './components/editor/EditorScreen';
import { Language, getLanguage } from './utils/i18n';
import { generateStockPhoto } from './utils/sampleMedia';

export default function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lang, setLang] = useState<Language>(getLanguage());

  // Load projects from IndexedDB / Storage on mount
  useEffect(() => {
    async function loadData() {
      try {
        let list = await getAllProjects();

        // If completely empty, seed a starter project for demonstration
        if (list.length === 0) {
          const sampleCover = generateStockPhoto('EditPro Starter', '#6366f1', '#ec4899', 'Welcome to EditPro Studio', '9:16');
          const sampleClip: Clip = {
            id: 'sample_clip_1',
            trackId: 'main',
            type: 'image',
            name: 'Welcome to EditPro',
            src: sampleCover.url,
            duration: 8,
            startAt: 0,
            trimIn: 0,
            trimOut: 0,
            speed: 1.0,
            transform: { x: 0, y: 0, scale: 1.0, rotation: 0, opacity: 1.0, flipH: false, flipV: false },
            keyframes: [
              { time: 0, scale: 1.0, opacity: 1.0 },
              { time: 4, scale: 1.15, opacity: 1.0 },
            ],
            photoAnimation: 'ken_burns',
            filter: { preset: 'warm', intensity: 80 },
            colorAdjustment: { brightness: 0, contrast: 10, saturation: 10, exposure: 0, temperature: 5, tint: 0, highlights: 0, shadows: 0, sharpen: 5, vignette: 20 },
            effect: 'none',
            transition: { type: 'dissolve', duration: 0.6 },
            chromaKey: { enabled: false, color: '#00ff00', similarity: 40, smoothness: 20 },
            mask: { type: 'none', feather: 0 },
            audio: { volume: 100, muted: false, fadeIn: 0, fadeOut: 0 },
          };

          const textClip: Clip = {
            id: 'sample_clip_text',
            trackId: 'text',
            type: 'text',
            name: 'Title Text',
            src: '',
            duration: 5,
            startAt: 0.5,
            trimIn: 0,
            trimOut: 0,
            speed: 1.0,
            transform: { x: 0, y: 80, scale: 1.0, rotation: 0, opacity: 1.0, flipH: false, flipV: false },
            keyframes: [],
            filter: { preset: 'none', intensity: 80 },
            colorAdjustment: { brightness: 0, contrast: 0, saturation: 0, exposure: 0, temperature: 0, tint: 0, highlights: 0, shadows: 0, sharpen: 0, vignette: 0 },
            effect: 'none',
            transition: { type: 'none', duration: 0 },
            chromaKey: { enabled: false, color: '#00ff00', similarity: 40, smoothness: 20 },
            mask: { type: 'none', feather: 0 },
            audio: { volume: 100, muted: false, fadeIn: 0, fadeOut: 0 },
            textConfig: {
              text: 'Tap any clip to Edit!',
              font: 'Plus Jakarta Sans',
              fontSize: 32,
              bold: true,
              italic: false,
              align: 'center',
              color: '#facc15',
              strokeColor: '#000000',
              strokeWidth: 2.5,
              bgColor: 'rgba(0,0,0,0.7)',
              bgRadius: 8,
              shadowColor: 'rgba(0,0,0,0.8)',
              animation: 'bounce',
            },
          };

          const starterProject: Project = {
            id: `proj_${Date.now()}`,
            name: 'Quick Demo Reel',
            aspectRatio: '9:16',
            duration: 8,
            resolution: '1080p',
            fps: 30,
            lastEdited: Date.now(),
            thumbnail: sampleCover.thumbnail,
            clips: [sampleClip, textClip],
          };

          await saveProject(starterProject);
          list = [starterProject];
        }

        setProjects(list);
      } catch (err) {
        console.warn('Failed to load projects from storage:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  // Open Project
  const handleOpenProject = (proj: Project) => {
    setActiveProject(proj);
    setActiveProjectId(proj.id);
  };

  // Create Project
  const handleCreateProject = async (name: string, ratio: AspectRatio, initialClips?: Clip[]) => {
    let thumbnail = '';
    const clips = initialClips || [];

    if (clips.length > 0 && clips[0].src) {
      thumbnail = clips[0].src;
    } else {
      const cover = generateStockPhoto(name, '#4338ca', '#7c3aed', 'EditPro Project', ratio);
      thumbnail = cover.thumbnail;
    }

    let dur = 5;
    for (const c of clips) {
      const end = c.startAt + (c.duration - c.trimIn - c.trimOut) / c.speed;
      if (end > dur) dur = Math.ceil(end);
    }

    const newProject: Project = {
      id: `proj_${Date.now()}`,
      name: name || 'Untitled Project',
      aspectRatio: ratio,
      duration: dur,
      resolution: '1080p',
      fps: 30,
      lastEdited: Date.now(),
      thumbnail,
      clips,
    };

    await saveProject(newProject);
    setProjects((prev) => [newProject, ...prev]);
    setActiveProject(newProject);
    setActiveProjectId(newProject.id);
  };

  // Delete Project
  const handleDeleteProject = async (projectId: string) => {
    await deleteProject(projectId);
    setProjects((prev) => prev.filter((p) => p.id !== projectId));
    if (activeProject?.id === projectId) {
      setActiveProject(null);
      setActiveProjectId(null);
    }
  };

  // Duplicate Project
  const handleDuplicateProject = async (proj: Project) => {
    const duplicated: Project = {
      ...proj,
      id: `proj_${Date.now()}`,
      name: `${proj.name} (Copy)`,
      lastEdited: Date.now(),
    };
    await saveProject(duplicated);
    setProjects((prev) => [duplicated, ...prev]);
  };

  // Rename Project
  const handleRenameProject = async (projectId: string, newName: string) => {
    const proj = projects.find((p) => p.id === projectId);
    if (!proj) return;
    const renamed = { ...proj, name: newName, lastEdited: Date.now() };
    await saveProject(renamed);
    setProjects((prev) => prev.map((p) => (p.id === projectId ? renamed : p)));
    if (activeProject?.id === projectId) {
      setActiveProject(renamed);
    }
  };

  // Update Project in memory and list
  const handleProjectUpdated = (updated: Project) => {
    setActiveProject(updated);
    setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  // Back to Home
  const handleBackToHome = () => {
    setActiveProject(null);
    setActiveProjectId(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#090d16] text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-mono text-slate-400">Loading EditPro Studio...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 antialiased font-sans">
      {activeProject ? (
        <EditorScreen
          key={activeProject.id}
          project={activeProject}
          onBack={handleBackToHome}
          onProjectUpdated={handleProjectUpdated}
        />
      ) : (
        <HomeScreen
          projects={projects}
          onOpenProject={handleOpenProject}
          onCreateProject={handleCreateProject}
          onDeleteProject={handleDeleteProject}
          onDuplicateProject={handleDuplicateProject}
          onRenameProject={handleRenameProject}
          onLanguageChange={(newLang) => setLang(newLang)}
        />
      )}
    </div>
  );
}
