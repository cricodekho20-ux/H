import React, { useState, useRef } from 'react';
import { STICKER_CATALOG, StickerDef, svgToDataUrl } from '../../utils/stickers';
import { Smile, Upload, X, Search } from 'lucide-react';

interface StickerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSticker: (src: string, name: string) => void;
}

export const StickerDrawer: React.FC<StickerDrawerProps> = ({
  isOpen,
  onClose,
  onAddSticker,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const categories = ['All', 'Social', 'News', 'Reaction', 'Arrows', 'Shapes', 'Gaming'];

  const filtered = STICKER_CATALOG.filter((s) => {
    if (selectedCategory !== 'All' && s.category !== selectedCategory) return false;
    if (searchQuery && !s.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const handleCustomUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    const url = URL.createObjectURL(file);
    onAddSticker(url, file.name.replace(/\.[^/.]+$/, ''));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        <input
          type="file"
          ref={fileInputRef}
          accept="image/png,image/webp,image/svg+xml"
          className="hidden"
          onChange={handleCustomUpload}
        />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Smile className="w-5 h-5 text-indigo-400" />
            <h3 className="font-semibold text-white">Sticker Library</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Custom Upload */}
        <div className="p-4 bg-slate-950/60 border-b border-slate-800 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search stickers..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1 border border-slate-700"
          >
            <Upload className="w-3.5 h-3.5" />
            Custom PNG
          </button>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1 px-4 py-2 border-b border-slate-800 overflow-x-auto no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Sticker Grid */}
        <div className="p-4 flex-1 overflow-y-auto">
          <div className="grid grid-cols-3 gap-3">
            {filtered.map((sticker) => (
              <button
                key={sticker.id}
                onClick={() => {
                  onAddSticker(svgToDataUrl(sticker.svg), sticker.name);
                  onClose();
                }}
                className="p-3 rounded-2xl bg-slate-950 border border-slate-800 hover:border-indigo-500 hover:bg-slate-850 flex flex-col items-center justify-center gap-2 transition-all active:scale-95 aspect-square"
              >
                <div
                  className="w-16 h-12 flex items-center justify-center"
                  dangerouslySetInnerHTML={{ __html: sticker.svg }}
                />
                <span className="text-[10px] text-slate-300 font-medium truncate w-full text-center">
                  {sticker.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
