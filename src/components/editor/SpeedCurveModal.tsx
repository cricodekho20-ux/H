import React, { useState } from 'react';
import { Clip, SpeedCurvePoint, SpeedCurvePreset } from '../../types/editor';
import { SPEED_PRESETS } from '../../engine/speedCurve';
import { X, Check, Gauge, RotateCcw, Plus } from 'lucide-react';
import { t } from '../../utils/i18n';

interface SpeedCurveModalProps {
  clip: Clip;
  isOpen: boolean;
  onClose: () => void;
  onApplyCurve: (preset: SpeedCurvePreset, points: SpeedCurvePoint[]) => void;
}

export const SpeedCurveModal: React.FC<SpeedCurveModalProps> = ({
  clip,
  isOpen,
  onClose,
  onApplyCurve,
}) => {
  const [selectedPreset, setSelectedPreset] = useState<SpeedCurvePreset>(
    clip.speedCurve?.preset || 'none'
  );
  const [points, setPoints] = useState<SpeedCurvePoint[]>(
    clip.speedCurve?.points && clip.speedCurve.points.length > 0
      ? clip.speedCurve.points
      : SPEED_PRESETS.montage
  );

  const [activePointIndex, setActivePointIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleSelectPreset = (p: SpeedCurvePreset) => {
    setSelectedPreset(p);
    setPoints(SPEED_PRESETS[p]);
  };

  // Dragging point on SVG graph
  const handleGraphPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (activePointIndex === null) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    // Y inverted: 0 at bottom = 0.1x, top = 5.0x
    const ny = Math.max(0.1, Math.min(5.0, (1 - (e.clientY - rect.top) / rect.height) * 5.0));

    setPoints((prev) => {
      const copy = [...prev];
      copy[activePointIndex] = {
        x: activePointIndex === 0 ? 0 : activePointIndex === copy.length - 1 ? 1 : Number(nx.toFixed(2)),
        y: Number(ny.toFixed(2)),
      };
      return copy.sort((a, b) => a.x - b.x);
    });
    setSelectedPreset('custom');
  };

  const handleSave = () => {
    onApplyCurve(selectedPreset, points);
    onClose();
  };

  const presetsList: { id: SpeedCurvePreset; label: string; desc: string }[] = [
    { id: 'montage', label: 'Montage', desc: 'Fast → Slow → Fast' },
    { id: 'bullet', label: 'Bullet Time', desc: 'Freeze focus acceleration' },
    { id: 'jump_cut', label: 'Jump Cut', desc: 'Fast beat bursts' },
    { id: 'hero', label: 'Hero', desc: 'Cinematic dramatic slow-mo' },
    { id: 'flash_in', label: 'Flash In', desc: 'High speed entry' },
    { id: 'flash_out', label: 'Flash Out', desc: 'High speed exit' },
    { id: 'custom', label: 'Custom', desc: 'User curve points' },
  ];

  // SVG Curve Path generation
  const width = 320;
  const height = 140;

  const sorted = [...points].sort((a, b) => a.x - b.x);
  const pathD = sorted
    .map((p, idx) => {
      const px = p.x * width;
      const py = height - (p.y / 5.0) * height;
      return `${idx === 0 ? 'M' : 'L'} ${px} ${py}`;
    })
    .join(' ');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Gauge className="w-5 h-5 text-indigo-400" />
            <h3 className="font-semibold text-white">Speed Curve Editor</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col gap-5">
          {/* Interactive Graph */}
          <div className="relative p-3 bg-slate-950 rounded-2xl border border-slate-800 select-none">
            <div className="flex justify-between text-[10px] font-mono text-slate-500 mb-1">
              <span>5.0x Fast</span>
              <span>1.0x Normal</span>
              <span>0.1x Slow</span>
            </div>

            <svg
              viewBox={`0 0 ${width} ${height}`}
              onPointerMove={handleGraphPointerMove}
              onPointerUp={() => setActivePointIndex(null)}
              className="w-full h-36 overflow-visible cursor-crosshair"
            >
              {/* Reference Grid lines */}
              <line x1="0" y1={height - (1.0 / 5.0) * height} x2={width} y2={height - (1.0 / 5.0) * height} stroke="#334155" strokeDasharray="4 4" />
              <line x1="0" y1={height - (3.0 / 5.0) * height} x2={width} y2={height - (3.0 / 5.0) * height} stroke="#1e293b" />

              {/* Area fill */}
              <path d={`${pathD} L ${width} ${height} L 0 ${height} Z`} fill="rgba(99, 102, 241, 0.15)" />

              {/* Curve Stroke */}
              <path d={pathD} fill="none" stroke="#6366f1" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

              {/* Draggable control points */}
              {sorted.map((p, i) => {
                const cx = p.x * width;
                const cy = height - (p.y / 5.0) * height;
                const isDrag = activePointIndex === i;

                return (
                  <circle
                    key={i}
                    cx={cx}
                    cy={cy}
                    r={isDrag ? 8 : 6}
                    fill={isDrag ? '#a855f7' : '#ffffff'}
                    stroke="#6366f1"
                    strokeWidth="2.5"
                    className="cursor-grab active:cursor-grabbing hover:scale-125 transition-transform"
                    onPointerDown={() => setActivePointIndex(i)}
                  />
                );
              })}
            </svg>

            <div className="text-center text-[10px] text-slate-400 mt-2">
              Drag points to adjust speed change across the clip timeline.
            </div>
          </div>

          {/* Presets Grid */}
          <div>
            <span className="text-xs font-semibold text-slate-400 block mb-2">Speed Curve Presets:</span>
            <div className="grid grid-cols-3 gap-2">
              {presetsList.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handleSelectPreset(preset.id)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    selectedPreset === preset.id
                      ? 'bg-indigo-600 border-indigo-400 text-white shadow-md'
                      : 'bg-slate-800/80 border-slate-700/60 text-slate-300 hover:border-slate-600'
                  }`}
                >
                  <div className="font-semibold text-xs">{preset.label}</div>
                  <div className="text-[9px] opacity-75 truncate">{preset.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setSelectedPreset('none');
                setPoints(SPEED_PRESETS.none);
              }}
              className="py-2.5 px-4 rounded-xl border border-slate-700 text-slate-300 hover:text-white text-xs font-medium"
            >
              Reset 1x
            </button>
            <button
              onClick={handleSave}
              className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md transition-colors"
            >
              Apply Speed Curve
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
