import { SpeedCurvePoint, SpeedCurvePreset } from '../types/editor';

export const SPEED_PRESETS: Record<SpeedCurvePreset, SpeedCurvePoint[]> = {
  none: [
    { x: 0, y: 1.0 },
    { x: 1, y: 1.0 },
  ],
  montage: [
    { x: 0, y: 2.5 },
    { x: 0.2, y: 1.8 },
    { x: 0.5, y: 0.4 },
    { x: 0.8, y: 1.6 },
    { x: 1, y: 2.5 },
  ],
  bullet: [
    { x: 0, y: 3.0 },
    { x: 0.25, y: 0.3 },
    { x: 0.6, y: 0.2 },
    { x: 0.8, y: 2.0 },
    { x: 1, y: 3.5 },
  ],
  jump_cut: [
    { x: 0, y: 1.0 },
    { x: 0.2, y: 3.2 },
    { x: 0.4, y: 0.5 },
    { x: 0.7, y: 2.8 },
    { x: 1, y: 1.0 },
  ],
  hero: [
    { x: 0, y: 0.6 },
    { x: 0.3, y: 0.3 },
    { x: 0.5, y: 2.4 },
    { x: 0.8, y: 0.5 },
    { x: 1, y: 1.8 },
  ],
  flash_in: [
    { x: 0, y: 4.0 },
    { x: 0.2, y: 2.2 },
    { x: 0.4, y: 1.0 },
    { x: 1, y: 1.0 },
  ],
  flash_out: [
    { x: 0, y: 1.0 },
    { x: 0.6, y: 1.0 },
    { x: 0.8, y: 2.5 },
    { x: 1, y: 4.0 },
  ],
  custom: [
    { x: 0, y: 1.0 },
    { x: 0.3, y: 2.0 },
    { x: 0.7, y: 0.5 },
    { x: 1, y: 1.5 },
  ],
};

// Smooth cubic easing between two speed points
function smoothLerp(p0: number, p1: number, t: number): number {
  const eased = t * t * (3 - 2 * t);
  return p0 + (p1 - p0) * eased;
}

// Calculate the speed multiplier at a normalized time `t` (0 to 1) along the clip
export function getSpeedAtNormalizedTime(points: SpeedCurvePoint[], progress: number): number {
  if (!points || points.length === 0) return 1.0;
  if (points.length === 1) return points[0].y;

  const sorted = [...points].sort((a, b) => a.x - b.x);

  if (progress <= sorted[0].x) return sorted[0].y;
  if (progress >= sorted[sorted.length - 1].x) return sorted[sorted.length - 1].y;

  for (let i = 0; i < sorted.length - 1; i++) {
    const p1 = sorted[i];
    const p2 = sorted[i + 1];
    if (progress >= p1.x && progress <= p2.x) {
      const span = p2.x - p1.x;
      const factor = span > 0 ? (progress - p1.x) / span : 0;
      return smoothLerp(p1.y, p2.y, factor);
    }
  }

  return 1.0;
}
