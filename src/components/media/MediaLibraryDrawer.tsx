import React, { useState, useRef } from 'react';
import { MediaItem, Clip, TrackType } from '../../types/editor';
import { Search, Plus, Trash2, Video, Image as ImageIcon, Music, Check, X, ArrowUpDown, Play, Eye, Volume2, CheckSquare, Square } from 'lucide-react';
import { t } from '../../utils/i18n';

interface MediaLibraryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertClips: (clips: Clip[]) => void;
  currentTime: number;
}

export const MediaLibraryDrawer: React.FC<MediaLibraryDrawerProps> = ({
  isOpen,
  onClose,
  onInsertClips,
  currentTime,
}) => {
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'video' | 'image' | 'audio'>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'duration'>('date');
  const [previewingItem, setPreviewingItem] = useState<MediaItem | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newItems: MediaItem[] = Array.from(files).map((file, i) => {
      const isVideo = file.type.startsWith('video');
      const isImage = file.type.startsWith('image');
      const url = URL.createObjectURL(file);

      return {
        id: `media_${Date.now()}_${i}`,
        name: file.name,
        type: isVideo ? 'video' : isImage ? 'image' : 'audio',
        src: url,
        duration: isVideo ? 10 : isImage ? 5 : 15,
        size: file.size,
        thumbnail: isImage ? url : undefined,
        addedAt: Date.now(),
      };
    });

    setMediaList((prev) => [...newItems, ...prev]);
    e.target.value = '';
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filtered.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map((m) => m.id));
    }
  };

  const handleDeleteSelected = () => {
    setMediaList((prev) => prev.filter((m) => !selectedIds.includes(m.id)));
    setSelectedIds([]);
  };

  const handleAddSelectedToTimeline = () => {
    const items = mediaList.filter((m) => selectedIds.includes(m.id));
    if (items.length === 0) return;

    let offset = currentTime;
    const newClips: Clip[] = items.map((item, idx) => {
      const clip: Clip = {
        id: `clip_${Date.now()}_${idx}`,
        trackId: item.type === 'audio' ? 'audio' : 'main',
        type: item.type,
        name: item.name.replace(/\.[^/.]+$/, ''),
        src: item.src,
        duration: item.duration,
        startAt: offset,
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

      if (item.type !== 'audio') {
        offset += item.duration;
      }

      return clip;
    });

    onInsertClips(newClips);
    setSelectedIds([]);
    onClose();
  };

  const handleAddSingleItem = (item: MediaItem) => {
    const clip: Clip = {
      id: `clip_${Date.now()}`,
      trackId: item.type === 'audio' ? 'audio' : 'main',
      type: item.type,
      name: item.name.replace(/\.[^/.]+$/, ''),
      src: item.src,
      duration: item.duration,
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
    onInsertClips([clip]);
    setPreviewingItem(null);
    onClose();
  };

  // Filter & Search
  const filtered = mediaList
    .filter((m) => (filterType === 'all' ? true : m.type === filterType))
    .filter((m) => m.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'duration') return b.duration - a.duration;
      return b.addedAt - a.addedAt;
    });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        <input
          type="file"
          ref={fileInputRef}
          multiple
          accept="video/*,image/*,audio/*,.gif"
          className="hidden"
          onChange={handleFileUpload}
        />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-white text-base">Project Media Library</h3>
            <span className="text-xs text-slate-400 font-mono">({mediaList.length} files)</span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search, Filter & Upload Toolbar */}
        <div className="p-4 bg-slate-950/60 border-b border-slate-800/80 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search imported media..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center gap-1.5 shadow"
            >
              <Plus className="w-3.5 h-3.5" />
              Import Media
            </button>
          </div>

          <div className="flex items-center justify-between">
            {/* Filter buttons */}
            <div className="flex items-center gap-1">
              {(['all', 'video', 'image', 'audio'] as const).map((ft) => (
                <button
                  key={ft}
                  onClick={() => setFilterType(ft)}
                  className={`px-2.5 py-1 rounded-lg text-xs capitalize font-medium transition-colors ${
                    filterType === ft ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {ft}
                </button>
              ))}
            </div>

            {/* Sort Toggle & Select All */}
            <div className="flex items-center gap-2">
              {filtered.length > 0 && (
                <button
                  onClick={handleSelectAll}
                  className="flex items-center gap-1 text-[11px] text-slate-300 hover:text-white px-2 py-0.5 rounded bg-slate-800"
                >
                  {selectedIds.length === filtered.length ? (
                    <>
                      <CheckSquare className="w-3 h-3 text-indigo-400" />
                      <span>Deselect All</span>
                    </>
                  ) : (
                    <>
                      <Square className="w-3 h-3 text-slate-400" />
                      <span>Select All</span>
                    </>
                  )}
                </button>
              )}

              <button
                onClick={() => setSortBy(sortBy === 'date' ? 'name' : sortBy === 'name' ? 'duration' : 'date')}
                className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white"
              >
                <ArrowUpDown className="w-3 h-3" />
                <span>Sort: {sortBy}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Media Grid */}
        <div className="p-4 flex-1 overflow-y-auto min-h-[220px]">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-slate-500 gap-2">
              <Video className="w-8 h-8 opacity-40" />
              <span className="text-xs">No media files imported yet.</span>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="mt-2 text-indigo-400 hover:text-indigo-300 text-xs font-semibold"
              >
                + Choose videos & photos from device
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {filtered.map((item) => {
                const isSelected = selectedIds.includes(item.id);
                return (
                  <div
                    key={item.id}
                    onClick={() => toggleSelect(item.id)}
                    className={`group relative rounded-xl overflow-hidden border cursor-pointer aspect-video bg-slate-950 flex items-center justify-center transition-all ${
                      isSelected
                        ? 'ring-2 ring-indigo-500 border-indigo-400 shadow-md'
                        : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {item.type === 'image' ? (
                      <img src={item.src} alt={item.name} className="w-full h-full object-cover" />
                    ) : item.type === 'video' ? (
                      <video src={item.src} className="w-full h-full object-cover" />
                    ) : (
                      <Music className="w-8 h-8 text-emerald-400" />
                    )}

                    {/* Preview Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewingItem(item);
                      }}
                      title="Preview Media"
                      className="absolute top-1.5 left-1.5 p-1 rounded-full bg-black/60 text-slate-300 hover:text-white hover:bg-black/90 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>

                    {/* Selected badge */}
                    {isSelected && (
                      <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center shadow">
                        <Check className="w-3 h-3 text-white stroke-[3]" />
                      </div>
                    )}

                    {/* Duration / Name bar */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-1.5 text-[10px] text-white flex items-center justify-between truncate">
                      <span className="truncate max-w-[80px]">{item.name}</span>
                      <span className="font-mono text-slate-300">{item.duration}s</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            {selectedIds.length} item(s) selected
          </div>

          <div className="flex items-center gap-2">
            {selectedIds.length > 0 && (
              <button
                onClick={handleDeleteSelected}
                className="p-2 rounded-xl text-rose-400 hover:bg-rose-500/10"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={handleAddSelectedToTimeline}
              disabled={selectedIds.length === 0}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-semibold text-xs shadow-md transition-all active:scale-95"
            >
              Add to Timeline ({selectedIds.length})
            </button>
          </div>
        </div>

        {/* Media Preview Modal Overlay */}
        {previewingItem && (
          <div className="absolute inset-0 z-50 bg-black/95 flex flex-col p-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-white truncate max-w-[200px]">
                  {previewingItem.name}
                </span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-indigo-300">
                  {previewingItem.type}
                </span>
              </div>
              <button
                onClick={() => setPreviewingItem(null)}
                className="p-1 rounded-full text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 flex items-center justify-center py-4 overflow-hidden">
              {previewingItem.type === 'video' ? (
                <video
                  src={previewingItem.src}
                  controls
                  autoPlay
                  className="max-h-full max-w-full rounded-xl object-contain shadow-lg"
                />
              ) : previewingItem.type === 'image' ? (
                <img
                  src={previewingItem.src}
                  alt={previewingItem.name}
                  className="max-h-full max-w-full rounded-xl object-contain shadow-lg"
                />
              ) : (
                <div className="flex flex-col items-center gap-4 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                    <Volume2 className="w-8 h-8" />
                  </div>
                  <span className="text-sm font-semibold text-white">{previewingItem.name}</span>
                  <audio src={previewingItem.src} controls autoPlay className="w-72" />
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <span className="text-xs text-slate-400 font-mono">
                Duration: {previewingItem.duration}s
              </span>
              <button
                onClick={() => handleAddSingleItem(previewingItem)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow"
              >
                <Plus className="w-3.5 h-3.5" />
                Add to Timeline
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
