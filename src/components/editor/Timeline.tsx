import React, { useRef, useEffect } from 'react';
import { Clip, TrackType } from '../../types/editor';
import { Scissors, ZoomIn, ZoomOut, Plus, Volume2, Type, Layers, Film, Mic, Smile } from 'lucide-react';
import { t } from '../../utils/i18n';

interface TimelineProps {
  clips: Clip[];
  duration: number;
  currentTime: number;
  selectedClipId: string | null;
  zoomScale: number; // pixels per second
  onSeek: (time: number) => void;
  onSelectClip: (clipId: string | null) => void;
  onSplitClip: (clipId: string, time: number) => void;
  onTrimClip: (clipId: string, trimIn: number, trimOut: number) => void;
  onZoomChange: (scale: number) => void;
  onAddMediaClick: (track: TrackType) => void;
}

export const Timeline: React.FC<TimelineProps> = ({
  clips,
  duration,
  currentTime,
  selectedClipId,
  zoomScale,
  onSeek,
  onSelectClip,
  onSplitClip,
  onTrimClip,
  onZoomChange,
  onAddMediaClick,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingPlayhead = useRef(false);

  // Time ruler marks calculation
  const totalWidth = Math.max(800, (duration + 5) * zoomScale);
  const stepSeconds = zoomScale > 40 ? 1 : zoomScale > 20 ? 2 : 5;
  const numMarks = Math.ceil((duration + 5) / stepSeconds);

  // Auto-scroll timeline to follow playhead if playing
  useEffect(() => {
    if (isDraggingPlayhead.current || !containerRef.current) return;
    const playheadPx = currentTime * zoomScale;
    const container = containerRef.current;
    const scrollLeft = container.scrollLeft;
    const viewWidth = container.clientWidth;

    if (playheadPx > scrollLeft + viewWidth - 80) {
      container.scrollLeft = playheadPx - viewWidth / 2;
    } else if (playheadPx < scrollLeft) {
      container.scrollLeft = Math.max(0, playheadPx - 60);
    }
  }, [currentTime, zoomScale]);

  // Handle playhead scrubbing
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    isDraggingPlayhead.current = true;
    updateTimeFromPointer(e);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  const handlePointerMove = (e: PointerEvent) => {
    if (!isDraggingPlayhead.current) return;
    updateTimeFromClientX(e.clientX);
  };

  const handlePointerUp = () => {
    isDraggingPlayhead.current = false;
    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('pointerup', handlePointerUp);
  };

  const updateTimeFromPointer = (e: React.PointerEvent<HTMLDivElement>) => {
    updateTimeFromClientX(e.clientX);
  };

  const updateTimeFromClientX = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const scrollLeft = containerRef.current.scrollLeft;
    const x = clientX - rect.left + scrollLeft - 64; // 64px track label offset
    const time = Math.max(0, Math.min(duration, x / zoomScale));
    onSeek(Number(time.toFixed(2)));
  };

  // Split selected clip at current playhead
  const handleSplitCurrent = () => {
    if (!selectedClipId) return;
    const clip = clips.find((c) => c.id === selectedClipId);
    if (!clip) return;
    const effectiveDuration = (clip.duration - clip.trimIn - clip.trimOut) / clip.speed;
    if (currentTime > clip.startAt + 0.1 && currentTime < clip.startAt + effectiveDuration - 0.1) {
      onSplitClip(clip.id, currentTime);
    }
  };

  const tracks: { id: TrackType; label: string; icon: React.ReactNode; color: string }[] = [
    { id: 'text', label: 'Text', icon: <Type className="w-3.5 h-3.5" />, color: 'bg-amber-600/30 border-amber-500/50' },
    { id: 'sticker', label: 'Stickers', icon: <Smile className="w-3.5 h-3.5" />, color: 'bg-pink-600/30 border-pink-500/50' },
    { id: 'overlay', label: 'PIP', icon: <Layers className="w-3.5 h-3.5" />, color: 'bg-purple-600/30 border-purple-500/50' },
    { id: 'main', label: 'Video', icon: <Film className="w-3.5 h-3.5" />, color: 'bg-indigo-600/30 border-indigo-500/50' },
    { id: 'audio', label: 'Audio', icon: <Volume2 className="w-3.5 h-3.5" />, color: 'bg-emerald-600/30 border-emerald-500/50' },
    { id: 'voice', label: 'Voice', icon: <Mic className="w-3.5 h-3.5" />, color: 'bg-rose-600/30 border-rose-500/50' },
  ];

  const formatRulerTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col bg-slate-950 border-t border-slate-800/80 select-none">
      {/* Timeline Quick Action Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900/90 border-b border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          {/* Split button */}
          <button
            onClick={handleSplitCurrent}
            disabled={!selectedClipId}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border font-medium transition-colors ${
              selectedClipId
                ? 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700 active:scale-95'
                : 'text-slate-600 border-slate-800 cursor-not-allowed opacity-50'
            }`}
          >
            <Scissors className="w-3.5 h-3.5 text-indigo-400" />
            <span>{t('split')}</span>
          </button>
        </div>

        {/* Zoom controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onZoomChange(Math.max(15, zoomScale - 10))}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-[11px] text-slate-500 font-mono w-10 text-center">
            {Math.round((zoomScale / 35) * 100)}%
          </span>
          <button
            onClick={() => onZoomChange(Math.min(90, zoomScale + 10))}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Tracks Container with Scroll */}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        className="relative overflow-x-auto overflow-y-hidden h-56 touch-pan-x cursor-pointer"
      >
        <div style={{ width: `${totalWidth + 120}px` }} className="relative min-h-full">
          {/* Time Ruler */}
          <div className="sticky top-0 z-20 flex h-7 bg-slate-950/95 border-b border-slate-800 pl-16">
            {Array.from({ length: numMarks }).map((_, idx) => {
              const markSec = idx * stepSeconds;
              const leftPx = markSec * zoomScale;
              return (
                <div
                  key={idx}
                  style={{ left: `${leftPx + 64}px` }}
                  className="absolute top-0 bottom-0 flex flex-col justify-end text-[9px] font-mono text-slate-500"
                >
                  <span className="translate-x-1 mb-1">{formatRulerTime(markSec)}</span>
                  <div className="w-[1px] h-2 bg-slate-700" />
                </div>
              );
            })}
          </div>

          {/* Tracks Stack */}
          <div className="flex flex-col py-1 space-y-1">
            {tracks.map((track) => {
              const trackClips = clips.filter((c) => c.trackId === track.id);

              return (
                <div key={track.id} className="relative flex items-center h-7.5">
                  {/* Fixed left Track label */}
                  <div className="sticky left-0 z-10 w-16 h-full flex items-center justify-between px-2 bg-slate-900/90 border-r border-slate-800 text-[10px] text-slate-400 font-medium shrink-0">
                    <span className="flex items-center gap-1">
                      {track.icon}
                      {track.label}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddMediaClick(track.id);
                      }}
                      className="p-0.5 rounded text-slate-400 hover:text-white hover:bg-slate-800"
                    >
                      <Plus className="w-2.5 h-2.5" />
                    </button>
                  </div>

                  {/* Clip Items on this track */}
                  <div className="relative flex-1 h-full">
                    {trackClips.map((clip) => {
                      const effectiveDuration = (clip.duration - clip.trimIn - clip.trimOut) / clip.speed;
                      const leftPx = clip.startAt * zoomScale;
                      const widthPx = Math.max(18, effectiveDuration * zoomScale);
                      const isSelected = selectedClipId === clip.id;

                      return (
                        <div
                          key={clip.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectClip(clip.id);
                          }}
                          style={{
                            left: `${leftPx + 4}px`,
                            width: `${widthPx}px`,
                          }}
                          className={`absolute top-0.5 bottom-0.5 rounded-md border flex items-center px-2 text-[10px] font-medium text-white truncate transition-all ${
                            isSelected
                              ? 'ring-2 ring-indigo-400 border-white bg-indigo-600/60 shadow-md z-10'
                              : `${track.color} hover:brightness-110`
                          }`}
                        >
                          <span className="truncate">{clip.name}</span>

                          {/* Audio Waveform visualization */}
                          {(track.id === 'audio' || track.id === 'voice') && clip.waveformData && (
                            <div className="absolute inset-0 flex items-center justify-between px-1 opacity-40 pointer-events-none">
                              {clip.waveformData.slice(0, Math.min(40, Math.floor(widthPx / 3))).map((val, i) => (
                                <div
                                  key={i}
                                  style={{ height: `${val * 100}%` }}
                                  className="w-[1.5px] bg-white rounded-full"
                                />
                              ))}
                            </div>
                          )}

                          {/* Beat Markers */}
                          {clip.beatMarkers && clip.beatMarkers.length > 0 && (
                            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                              {clip.beatMarkers.map((bTime, i) => {
                                const bPx = bTime * zoomScale;
                                return (
                                  <div
                                    key={i}
                                    style={{ left: `${bPx}px` }}
                                    className="absolute top-0 bottom-0 w-[2px] bg-amber-400 opacity-80"
                                  />
                                );
                              })}
                            </div>
                          )}

                          {/* Keyframe Visual Dots */}
                          {clip.keyframes && clip.keyframes.length > 0 && (
                            <div className="absolute bottom-0.5 left-0 right-0 flex items-center gap-1 px-1 pointer-events-none">
                              {clip.keyframes.map((kf, i) => (
                                <div
                                  key={i}
                                  style={{ left: `${kf.time * zoomScale}px` }}
                                  className="w-1.5 h-1.5 bg-yellow-300 rounded-full shadow"
                                />
                              ))}
                            </div>
                          )}

                          {/* Left Trim Handle */}
                          {isSelected && (
                            <div
                              onPointerDown={(e) => {
                                e.stopPropagation();
                                const startX = e.clientX;
                                const initialTrimIn = clip.trimIn;
                                const onMove = (me: PointerEvent) => {
                                  const deltaSec = (me.clientX - startX) / zoomScale;
                                  const newTrimIn = Math.max(0, Math.min(clip.duration - clip.trimOut - 0.2, initialTrimIn + deltaSec));
                                  onTrimClip(clip.id, Number(newTrimIn.toFixed(2)), clip.trimOut);
                                };
                                const onUp = () => {
                                  window.removeEventListener('pointermove', onMove);
                                  window.removeEventListener('pointerup', onUp);
                                };
                                window.addEventListener('pointermove', onMove);
                                window.addEventListener('pointerup', onUp);
                              }}
                              className="absolute left-0 top-0 bottom-0 w-2.5 bg-white rounded-l-md cursor-ew-resize flex items-center justify-center hover:bg-indigo-300"
                            >
                              <div className="w-0.5 h-3 bg-slate-900 rounded-full" />
                            </div>
                          )}

                          {/* Right Trim Handle */}
                          {isSelected && (
                            <div
                              onPointerDown={(e) => {
                                e.stopPropagation();
                                const startX = e.clientX;
                                const initialTrimOut = clip.trimOut;
                                const onMove = (me: PointerEvent) => {
                                  const deltaSec = (startX - me.clientX) / zoomScale;
                                  const newTrimOut = Math.max(0, Math.min(clip.duration - clip.trimIn - 0.2, initialTrimOut + deltaSec));
                                  onTrimClip(clip.id, clip.trimIn, Number(newTrimOut.toFixed(2)));
                                };
                                const onUp = () => {
                                  window.removeEventListener('pointermove', onMove);
                                  window.removeEventListener('pointerup', onUp);
                                };
                                window.addEventListener('pointermove', onMove);
                                window.addEventListener('pointerup', onUp);
                              }}
                              className="absolute right-0 top-0 bottom-0 w-2.5 bg-white rounded-r-md cursor-ew-resize flex items-center justify-center hover:bg-indigo-300"
                            >
                              <div className="w-0.5 h-3 bg-slate-900 rounded-full" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Draggable Red Playhead Line */}
          <div
            style={{ left: `${currentTime * zoomScale + 64}px` }}
            className="absolute top-0 bottom-0 z-30 pointer-events-none flex flex-col items-center"
          >
            <div className="w-3.5 h-3.5 bg-rose-500 rounded-t-sm rotate-45 -translate-y-1 shadow-md shadow-rose-500/50" />
            <div className="w-[1.5px] flex-1 bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
          </div>
        </div>
      </div>
    </div>
  );
};
