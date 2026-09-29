import { Clip, Keyframe, Project, TextConfig, NewsToolConfig } from '../types/editor';
import { getSpeedAtNormalizedTime } from './speedCurve';

// Easing calculations
function applyEasing(factor: number, mode?: string): number {
  if (mode === 'ease_in') {
    return factor * factor;
  }
  if (mode === 'ease_out') {
    return 1 - (1 - factor) * (1 - factor);
  }
  if (mode === 'ease_in_out') {
    return factor < 0.5 ? 2 * factor * factor : 1 - Math.pow(-2 * factor + 2, 2) / 2;
  }
  return factor; // linear default
}

function lerp(a: number, b: number, factor: number): number {
  return a + (b - a) * factor;
}

// Evaluate keyframe parameters at a given local clip time
export function getInterpolatedKeyframe(clip: Clip, localTime: number) {
  const base = {
    x: clip.transform.x || 0,
    y: clip.transform.y || 0,
    scaleX: clip.transform.scaleX ?? clip.transform.scale ?? 1.0,
    scaleY: clip.transform.scaleY ?? clip.transform.scale ?? 1.0,
    rotation: clip.transform.rotation || 0,
    opacity: clip.transform.opacity ?? 1.0,
    blur: 0,
    brightness: 0,
    contrast: 0,
    saturation: 0,
  };

  if (!clip.keyframes || clip.keyframes.length === 0) {
    return base;
  }

  const sorted = [...clip.keyframes].sort((a, b) => a.time - b.time);

  if (localTime <= sorted[0].time) {
    const k = sorted[0];
    return {
      x: k.x ?? base.x,
      y: k.y ?? base.y,
      scaleX: k.scaleX ?? base.scaleX,
      scaleY: k.scaleY ?? base.scaleY,
      rotation: k.rotation ?? base.rotation,
      opacity: k.opacity ?? base.opacity,
      blur: k.blur ?? base.blur,
      brightness: k.brightness ?? base.brightness,
      contrast: k.contrast ?? base.contrast,
      saturation: k.saturation ?? base.saturation,
    };
  }

  if (localTime >= sorted[sorted.length - 1].time) {
    const last = sorted[sorted.length - 1];
    return {
      x: last.x ?? base.x,
      y: last.y ?? base.y,
      scaleX: last.scaleX ?? base.scaleX,
      scaleY: last.scaleY ?? base.scaleY,
      rotation: last.rotation ?? base.rotation,
      opacity: last.opacity ?? base.opacity,
      blur: last.blur ?? base.blur,
      brightness: last.brightness ?? base.brightness,
      contrast: last.contrast ?? base.contrast,
      saturation: last.saturation ?? base.saturation,
    };
  }

  for (let i = 0; i < sorted.length - 1; i++) {
    const k1 = sorted[i];
    const k2 = sorted[i + 1];
    if (localTime >= k1.time && localTime <= k2.time) {
      const duration = k2.time - k1.time;
      const rawFactor = duration > 0 ? (localTime - k1.time) / duration : 0;
      const factor = applyEasing(rawFactor, k2.easing || 'ease_in_out');

      return {
        x: lerp(k1.x ?? base.x, k2.x ?? base.x, factor),
        y: lerp(k1.y ?? base.y, k2.y ?? base.y, factor),
        scaleX: lerp(k1.scaleX ?? base.scaleX, k2.scaleX ?? base.scaleX, factor),
        scaleY: lerp(k1.scaleY ?? base.scaleY, k2.scaleY ?? base.scaleY, factor),
        rotation: lerp(k1.rotation ?? base.rotation, k2.rotation ?? base.rotation, factor),
        opacity: lerp(k1.opacity ?? base.opacity, k2.opacity ?? base.opacity, factor),
        blur: lerp(k1.blur ?? 0, k2.blur ?? 0, factor),
        brightness: lerp(k1.brightness ?? 0, k2.brightness ?? 0, factor),
        contrast: lerp(k1.contrast ?? 0, k2.contrast ?? 0, factor),
        saturation: lerp(k1.saturation ?? 0, k2.saturation ?? 0, factor),
      };
    }
  }

  return base;
}

// Media element cache
export const mediaCache: {
  videos: Map<string, HTMLVideoElement>;
  images: Map<string, HTMLImageElement>;
} = {
  videos: new Map(),
  images: new Map(),
};

export function getOrCreateVideoElement(src: string): Promise<HTMLVideoElement> {
  if (mediaCache.videos.has(src)) {
    return Promise.resolve(mediaCache.videos.get(src)!);
  }

  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.src = src;
    video.crossOrigin = 'anonymous';
    video.playsInline = true;
    video.muted = true;
    video.preload = 'auto';

    video.onloadedmetadata = () => {
      mediaCache.videos.set(src, video);
      resolve(video);
    };

    video.onerror = () => {
      mediaCache.videos.set(src, video);
      resolve(video);
    };
  });
}

export function getOrCreateImageElement(src: string): Promise<HTMLImageElement> {
  if (mediaCache.images.has(src)) {
    return Promise.resolve(mediaCache.images.get(src)!);
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = src;
    img.onload = () => {
      mediaCache.images.set(src, img);
      resolve(img);
    };
    img.onerror = () => {
      mediaCache.images.set(src, img);
      resolve(img);
    };
  });
}

// Apply green/blue chroma key
export function applyChromaKey(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  targetColorHex: string,
  similarity: number,
  smoothness: number,
  spillControl = 20
) {
  try {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    const rTarget = parseInt(targetColorHex.slice(1, 3), 16) || 0;
    const gTarget = parseInt(targetColorHex.slice(3, 5), 16) || 255;
    const bTarget = parseInt(targetColorHex.slice(5, 7), 16) || 0;

    const threshold = (similarity / 100) * 220;
    const smoothRange = Math.max(1, (smoothness / 100) * 100);

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      const diff = Math.sqrt(
        (r - rTarget) * (r - rTarget) +
        (g - gTarget) * (g - gTarget) +
        (b - bTarget) * (b - bTarget)
      );

      if (diff < threshold) {
        data[i + 3] = 0; // transparent
      } else if (diff < threshold + smoothRange) {
        const alpha = ((diff - threshold) / smoothRange) * 255;
        data[i + 3] = Math.min(data[i + 3], alpha);
      } else if (spillControl > 0 && gTarget > 150) {
        // Despill green
        if (g > (r + b) / 2) {
          data[i + 1] = (r + b) / 2;
        }
      }
    }

    ctx.putImageData(imageData, 0, 0);
  } catch (e) {
    // cross-origin canvas security guard
  }
}

// Apply clipping mask
function applyMask(ctx: CanvasRenderingContext2D, width: number, height: number, maskType: string) {
  if (maskType === 'circle') {
    ctx.beginPath();
    ctx.arc(0, 0, Math.min(width, height) * 0.45, 0, Math.PI * 2);
    ctx.clip();
  } else if (maskType === 'rectangle') {
    ctx.beginPath();
    ctx.rect(-width * 0.45, -height * 0.45, width * 0.9, height * 0.9);
    ctx.clip();
  } else if (maskType === 'linear' || maskType === 'mirror') {
    ctx.beginPath();
    ctx.rect(-width * 0.5, -height * 0.35, width, height * 0.7);
    ctx.clip();
  } else if (maskType === 'heart') {
    ctx.beginPath();
    const d = Math.min(width, height) * 0.4;
    ctx.moveTo(0, d * 0.3);
    ctx.bezierCurveTo(-d * 0.6, -d * 0.3, -d, d * 0.4, 0, d);
    ctx.bezierCurveTo(d, d * 0.4, d * 0.6, -d * 0.3, 0, d * 0.3);
    ctx.clip();
  } else if (maskType === 'star') {
    ctx.beginPath();
    const spikes = 5;
    const outerRadius = Math.min(width, height) * 0.45;
    const innerRadius = outerRadius * 0.5;
    let rot = (Math.PI / 2) * 3;
    let cx = 0;
    let cy = 0;
    let x = cx;
    let y = cy;
    const step = Math.PI / spikes;

    ctx.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outerRadius;
      y = cy + Math.sin(rot) * outerRadius;
      ctx.lineTo(x, y);
      rot += step;

      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      ctx.lineTo(x, y);
      rot += step;
    }
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
    ctx.clip();
  }
}

// Render complete frame
export function renderFrame(
  canvas: HTMLCanvasElement,
  project: Project,
  currentTime: number,
  selectedClipId?: string | null
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const width = canvas.width;
  const height = canvas.height;

  // Render Canvas Background
  ctx.clearRect(0, 0, width, height);

  const canvasSettings = project.canvasSettings;
  if (canvasSettings && canvasSettings.backgroundType === 'gradient' && canvasSettings.gradientColors) {
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, canvasSettings.gradientColors[0]);
    bgGrad.addColorStop(1, canvasSettings.gradientColors[1]);
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);
  } else if (canvasSettings && canvasSettings.backgroundType === 'color' && canvasSettings.backgroundColor) {
    ctx.fillStyle = canvasSettings.backgroundColor;
    ctx.fillRect(0, 0, width, height);
  } else {
    // Default dark slate editor canvas
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, width, height);
  }

  // Active clips
  const activeClips = project.clips.filter((clip) => {
    const effectiveDuration = (clip.duration - clip.trimIn - clip.trimOut) / clip.speed;
    return currentTime >= clip.startAt && currentTime <= clip.startAt + effectiveDuration;
  });

  // Track stacking order: main -> overlay -> sticker -> text
  const trackOrder = ['main', 'overlay', 'sticker', 'text'];
  activeClips.sort((a, b) => trackOrder.indexOf(a.trackId) - trackOrder.indexOf(b.trackId));

  for (const clip of activeClips) {
    ctx.save();

    const effectiveDuration = (clip.duration - clip.trimIn - clip.trimOut) / clip.speed;
    const timeSinceStart = currentTime - clip.startAt;
    const timeUntilEnd = clip.startAt + effectiveDuration - currentTime;
    const clipProgress = Math.max(0, Math.min(1, timeSinceStart / (effectiveDuration || 1)));

    // Speed curve progress adjustment if enabled
    let speedMult = clip.speed;
    if (clip.speedCurve && clip.speedCurve.points && clip.speedCurve.points.length > 0) {
      speedMult = getSpeedAtNormalizedTime(clip.speedCurve.points, clipProgress) * clip.speed;
    }

    const localTime = timeSinceStart * speedMult + clip.trimIn;

    // Keyframes
    const kf = getInterpolatedKeyframe(clip, localTime);

    let posX = width / 2 + kf.x;
    let posY = height / 2 + kf.y;
    let scaleX = kf.scaleX;
    let scaleY = kf.scaleY;
    let rotationDeg = kf.rotation;
    let opacityVal = kf.opacity;
    let blurVal = kf.blur;

    // Motion tracking attachment
    if (clip.motionTrackTargetId) {
      const targetClip = activeClips.find((c) => c.id === clip.motionTrackTargetId);
      if (targetClip) {
        const targetKf = getInterpolatedKeyframe(targetClip, localTime);
        posX += targetKf.x;
        posY += targetKf.y;
      }
    }

    // Photo Animation Presets
    if (clip.type === 'image' && clip.photoAnimation) {
      if (clip.photoAnimation === 'zoom_in') {
        scaleX *= 1.0 + clipProgress * 0.25;
        scaleY *= 1.0 + clipProgress * 0.25;
      } else if (clip.photoAnimation === 'zoom_out') {
        scaleX *= 1.25 - clipProgress * 0.25;
        scaleY *= 1.25 - clipProgress * 0.25;
      } else if (clip.photoAnimation === 'pan_left') {
        posX += (0.5 - clipProgress) * (width * 0.2);
      } else if (clip.photoAnimation === 'pan_right') {
        posX -= (0.5 - clipProgress) * (width * 0.2);
      } else if (clip.photoAnimation === 'pan_up') {
        posY += (0.5 - clipProgress) * (height * 0.2);
      } else if (clip.photoAnimation === 'pan_down') {
        posY -= (0.5 - clipProgress) * (height * 0.2);
      } else if (clip.photoAnimation === 'ken_burns') {
        scaleX *= 1.0 + clipProgress * 0.2;
        scaleY *= 1.0 + clipProgress * 0.2;
        posX += Math.sin(clipProgress * Math.PI) * (width * 0.08);
        posY += Math.cos(clipProgress * Math.PI) * (height * 0.08);
      }
    }

    // IN ANIMATION SYSTEM
    if (clip.inAnimation && clip.inAnimation.type !== 'none') {
      const inDur = clip.inAnimation.duration || 0.6;
      if (timeSinceStart < inDur) {
        const factor = timeSinceStart / inDur;
        const eased = applyEasing(factor, 'ease_out');
        const inType = clip.inAnimation.type;

        if (inType === 'fade_in') {
          opacityVal *= eased;
        } else if (inType === 'zoom_in') {
          scaleX *= eased;
          scaleY *= eased;
          opacityVal *= eased;
        } else if (inType === 'slide_left') {
          posX += (1 - eased) * width;
        } else if (inType === 'slide_right') {
          posX -= (1 - eased) * width;
        } else if (inType === 'slide_up') {
          posY += (1 - eased) * height;
        } else if (inType === 'slide_down') {
          posY -= (1 - eased) * height;
        } else if (inType === 'pop') {
          const bounce = Math.sin(eased * Math.PI * 1.5);
          scaleX *= 0.2 + bounce * 0.9;
          scaleY *= 0.2 + bounce * 0.9;
        } else if (inType === 'bounce') {
          const b = Math.abs(Math.sin(eased * Math.PI * 3)) * (1 - eased);
          posY -= b * 40;
        } else if (inType === 'rotate') {
          rotationDeg += (1 - eased) * 180;
          scaleX *= eased;
          scaleY *= eased;
        } else if (inType === 'blur_in') {
          blurVal += (1 - eased) * 14;
          opacityVal *= eased;
        } else if (inType === 'elastic') {
          const p = 0.3;
          const s = p / 4;
          const el = Math.pow(2, -10 * eased) * Math.sin(((eased - s) * (2 * Math.PI)) / p) + 1;
          scaleX *= el;
          scaleY *= el;
        }
      }
    }

    // OUT ANIMATION SYSTEM
    if (clip.outAnimation && clip.outAnimation.type !== 'none') {
      const outDur = clip.outAnimation.duration || 0.6;
      if (timeUntilEnd < outDur) {
        const factor = timeUntilEnd / outDur;
        const eased = applyEasing(factor, 'ease_in');
        const outType = clip.outAnimation.type;

        if (outType === 'fade_out') {
          opacityVal *= eased;
        } else if (outType === 'zoom_out') {
          scaleX *= eased;
          scaleY *= eased;
        } else if (outType === 'slide_left') {
          posX -= (1 - eased) * width;
        } else if (outType === 'slide_right') {
          posX += (1 - eased) * width;
        } else if (outType === 'pop_out') {
          scaleX *= eased * 1.2;
          scaleY *= eased * 1.2;
          opacityVal *= eased;
        } else if (outType === 'rotate_out') {
          rotationDeg -= (1 - eased) * 180;
          opacityVal *= eased;
        }
      }
    }

    // COMBO ANIMATIONS
    if (clip.comboAnimation && clip.comboAnimation.type !== 'none') {
      const cType = clip.comboAnimation.type;
      if (cType === 'zoom_rotate') {
        rotationDeg += Math.sin(clipProgress * Math.PI * 4) * 8;
        scaleX *= 1 + Math.sin(clipProgress * Math.PI * 2) * 0.1;
        scaleY *= 1 + Math.sin(clipProgress * Math.PI * 2) * 0.1;
      } else if (cType === 'shake_zoom') {
        posX += (Math.random() - 0.5) * 8;
        posY += (Math.random() - 0.5) * 8;
        scaleX *= 1.05;
        scaleY *= 1.05;
      } else if (cType === 'bounce_scale') {
        const b = Math.abs(Math.sin(clipProgress * Math.PI * 4)) * 0.15;
        scaleX *= 1 + b;
        scaleY *= 1 + b;
      }
    }

    // Clip Transitions
    if (clip.transition && clip.transition.type !== 'none' && clip.transition.duration > 0) {
      const transDur = clip.transition.duration;
      if (timeSinceStart < transDur) {
        const transFactor = timeSinceStart / transDur;
        if (clip.transition.type === 'fade' || clip.transition.type === 'dissolve') {
          opacityVal *= transFactor;
        } else if (clip.transition.type === 'slide_left') {
          posX += (1 - transFactor) * width;
        } else if (clip.transition.type === 'slide_right') {
          posX -= (1 - transFactor) * width;
        } else if (clip.transition.type === 'push') {
          posY += (1 - transFactor) * height;
        } else if (clip.transition.type === 'zoom') {
          scaleX *= 0.4 + transFactor * 0.6;
          scaleY *= 0.4 + transFactor * 0.6;
          opacityVal *= transFactor;
        } else if (clip.transition.type === 'spin' || clip.transition.type === 'whirl') {
          rotationDeg += (1 - transFactor) * 240;
          scaleX *= transFactor;
          scaleY *= transFactor;
        } else if (clip.transition.type === 'flash') {
          opacityVal = transFactor > 0.5 ? 1 : transFactor * 2;
        }
      }
    }

    // Video Effects
    if (clip.effect === 'shake' || clip.effect === 'camera_shake') {
      posX += (Math.random() - 0.5) * 18;
      posY += (Math.random() - 0.5) * 18;
    } else if (clip.effect === 'glitch' || clip.effect === 'rgb_split') {
      if (Math.sin(currentTime * 24) > 0.6) {
        posX += (Math.random() - 0.5) * 25;
      }
    } else if (clip.effect === 'flash') {
      if (Math.sin(currentTime * 12) > 0.8) {
        opacityVal = 0.35;
      }
    } else if (clip.effect === 'zoom') {
      const p = 1.0 + Math.sin(currentTime * 6) * 0.12;
      scaleX *= p;
      scaleY *= p;
    }

    // CSS Filters
    const filters: string[] = [];
    const adj = clip.colorAdjustment;
    if (adj) {
      const bTotal = adj.brightness + kf.brightness;
      const cTotal = adj.contrast + kf.contrast;
      const sTotal = adj.saturation + kf.saturation;

      if (bTotal !== 0) filters.push(`brightness(${100 + bTotal}%)`);
      if (cTotal !== 0) filters.push(`contrast(${100 + cTotal}%)`);
      if (sTotal !== 0) filters.push(`saturate(${100 + sTotal}%)`);
      if (adj.exposure !== 0) filters.push(`brightness(${100 + adj.exposure * 0.8}%)`);
      if (adj.temperature !== 0) {
        if (adj.temperature > 0) {
          filters.push(`sepia(${adj.temperature * 0.5}%)`);
        } else {
          filters.push(`hue-rotate(${adj.temperature * 0.8}deg)`);
        }
      }
      if (adj.sharpen > 0) filters.push(`contrast(${100 + adj.sharpen * 0.4}%)`);
      if (adj.fade && adj.fade > 0) filters.push(`contrast(${100 - adj.fade * 0.3}%) brightness(${100 + adj.fade * 0.2}%)`);
    }

    if (blurVal > 0) {
      filters.push(`blur(${blurVal}px)`);
    } else if (clip.effect === 'blur' || clip.effect === 'lens_blur') {
      filters.push('blur(8px)');
    }

    // Filter Presets
    if (clip.filter && clip.filter.preset !== 'none') {
      const intensity = clip.filter.intensity / 100;
      if (clip.filter.preset === 'cinematic') {
        filters.push(`contrast(${100 + 30 * intensity}%) saturate(${100 + 20 * intensity}%)`);
      } else if (clip.filter.preset === 'warm') {
        filters.push(`sepia(${45 * intensity}%) saturate(${100 + 20 * intensity}%)`);
      } else if (clip.filter.preset === 'cool') {
        filters.push(`hue-rotate(${180 * intensity}deg)`);
      } else if (clip.filter.preset === 'vintage' || clip.filter.preset === 'retro') {
        filters.push(`sepia(${65 * intensity}%) contrast(${100 - 15 * intensity}%)`);
      } else if (clip.filter.preset === 'bw') {
        filters.push(`grayscale(${100 * intensity}%) contrast(${100 + 25 * intensity}%)`);
      } else if (clip.filter.preset === 'bright') {
        filters.push(`brightness(${100 + 25 * intensity}%) contrast(${100 + 10 * intensity}%)`);
      } else if (clip.filter.preset === 'dark' || clip.filter.preset === 'night') {
        filters.push(`brightness(${100 - 30 * intensity}%) contrast(${100 + 25 * intensity}%)`);
      } else if (clip.filter.preset === 'news') {
        filters.push(`contrast(${100 + 15 * intensity}%) saturate(${100 + 15 * intensity}%)`);
      }
    }

    ctx.filter = filters.length > 0 ? filters.join(' ') : 'none';
    ctx.globalAlpha = Math.max(0, Math.min(1, opacityVal));

    // Position & Transform
    ctx.translate(posX, posY);
    ctx.rotate((rotationDeg * Math.PI) / 180);
    ctx.scale(
      scaleX * (clip.transform.flipH ? -1 : 1),
      scaleY * (clip.transform.flipV ? -1 : 1)
    );

    // Apply Masking
    if (clip.mask && clip.mask.type !== 'none') {
      applyMask(ctx, width, height, clip.mask.type);
    }

    // Render clip according to type
    if (clip.type === 'video') {
      const vid = mediaCache.videos.get(clip.src);
      if (vid && vid.readyState >= 2) {
        if (Math.abs(vid.currentTime - localTime) > 0.15) {
          vid.currentTime = Math.max(0, Math.min(vid.duration || 999, localTime));
        }

        const vWidth = vid.videoWidth || width;
        const vHeight = vid.videoHeight || height;

        let drawW = width;
        let drawH = (vHeight / vWidth) * width;
        if (drawH < height && clip.trackId === 'main') {
          drawH = height;
          drawW = (vWidth / vHeight) * height;
        }

        ctx.drawImage(vid, -drawW / 2, -drawH / 2, drawW, drawH);
      } else {
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(-width * 0.4, -height * 0.3, width * 0.8, height * 0.6);
        ctx.fillStyle = '#94a3b8';
        ctx.textAlign = 'center';
        ctx.font = '600 16px "Plus Jakarta Sans"';
        ctx.fillText(clip.name || 'Video Clip', 0, 0);
      }
    } else if (clip.type === 'image') {
      const img = mediaCache.images.get(clip.src);
      if (img && img.complete && img.naturalWidth > 0) {
        const iWidth = img.naturalWidth;
        const iHeight = img.naturalHeight;

        let drawW = width;
        let drawH = (iHeight / iWidth) * width;
        if (drawH < height && clip.trackId === 'main') {
          drawH = height;
          drawW = (iWidth / iHeight) * height;
        }

        ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
      } else {
        ctx.fillStyle = '#334155';
        ctx.fillRect(-width * 0.4, -height * 0.3, width * 0.8, height * 0.6);
        ctx.fillStyle = '#f8fafc';
        ctx.textAlign = 'center';
        ctx.font = '600 16px "Plus Jakarta Sans"';
        ctx.fillText(clip.name || 'Photo Clip', 0, 0);
      }
    } else if (clip.type === 'sticker') {
      const img = mediaCache.images.get(clip.src);
      if (img && img.complete) {
        const size = Math.min(width, height) * 0.35;
        ctx.drawImage(img, -size / 2, -size / 2, size, size);
      }
    } else if (clip.type === 'text' && clip.textConfig) {
      renderTextClip(ctx, clip.textConfig, clipProgress);
    }

    // Render News Creator Overlay
    if (clip.newsConfig) {
      renderNewsOverlay(ctx, clip.newsConfig, width, height, currentTime);
    }

    // Chroma Key
    if (clip.chromaKey && clip.chromaKey.enabled) {
      applyChromaKey(
        ctx,
        width,
        height,
        clip.chromaKey.color,
        clip.chromaKey.similarity,
        clip.chromaKey.smoothness,
        clip.chromaKey.spillControl
      );
    }

    // Selection Border
    if (selectedClipId === clip.id) {
      ctx.strokeStyle = '#6366f1';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(-width * 0.45, -height * 0.45, width * 0.9, height * 0.9);

      ctx.fillStyle = '#ffffff';
      const handleSize = 8;
      ctx.fillRect(-width * 0.45 - handleSize / 2, -height * 0.45 - handleSize / 2, handleSize, handleSize);
      ctx.fillRect(width * 0.45 - handleSize / 2, -height * 0.45 - handleSize / 2, handleSize, handleSize);
      ctx.fillRect(-width * 0.45 - handleSize / 2, height * 0.45 - handleSize / 2, handleSize, handleSize);
      ctx.fillRect(width * 0.45 - handleSize / 2, height * 0.45 - handleSize / 2, handleSize, handleSize);
    }

    ctx.restore();
  }

  // Global Overlay Effects: Vignette, Film Grain & VHS Scanlines
  const hasVignette = activeClips.some((c) => c.colorAdjustment?.vignette > 0);
  if (hasVignette) {
    const vigGrad = ctx.createRadialGradient(width / 2, height / 2, width * 0.3, width / 2, height / 2, width * 0.7);
    vigGrad.addColorStop(0, 'rgba(0,0,0,0)');
    vigGrad.addColorStop(1, 'rgba(0,0,0,0.65)');
    ctx.fillStyle = vigGrad;
    ctx.fillRect(0, 0, width, height);
  }

  // VHS Scanlines overlay
  const hasVhs = activeClips.some((c) => c.effect === 'vhs');
  if (hasVhs) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
    for (let y = 0; y < height; y += 4) {
      ctx.fillRect(0, y, width, 1.5);
    }
  }
}

// Render dynamic animated text layer
function renderTextClip(ctx: CanvasRenderingContext2D, cfg: TextConfig, progress: number) {
  let displayStr = cfg.text;
  let textScale = 1.0;
  let textAlpha = 1.0;
  let textOffsetY = 0;

  if (cfg.animation === 'typewriter') {
    const charsToShow = Math.min(cfg.text.length, Math.floor(progress * cfg.text.length * 2));
    displayStr = cfg.text.slice(0, charsToShow);
  } else if (cfg.animation === 'pop') {
    if (progress < 0.2) {
      textScale = 0.4 + (progress / 0.2) * 0.7;
    } else if (progress < 0.35) {
      textScale = 1.1 - ((progress - 0.2) / 0.15) * 0.1;
    }
  } else if (cfg.animation === 'bounce') {
    textOffsetY = Math.sin(progress * Math.PI * 4) * 8;
  } else if (cfg.animation === 'fade') {
    if (progress < 0.2) {
      textAlpha = progress / 0.2;
    } else if (progress > 0.8) {
      textAlpha = (1 - progress) / 0.2;
    }
  } else if (cfg.animation === 'slide') {
    if (progress < 0.25) {
      textOffsetY = (1 - progress / 0.25) * 40;
      textAlpha = progress / 0.25;
    }
  } else if (cfg.animation === 'zoom') {
    textScale = 0.9 + progress * 0.2;
  }

  ctx.save();
  ctx.globalAlpha *= textAlpha;
  ctx.scale(textScale, textScale);
  ctx.translate(0, textOffsetY);

  const fontStyle = `${cfg.italic ? 'italic ' : ''}${cfg.bold ? 'bold ' : ''}${cfg.fontSize}px "${cfg.font || 'Plus Jakarta Sans'}", sans-serif`;
  ctx.font = fontStyle;
  ctx.textAlign = cfg.align || 'center';
  ctx.textBaseline = 'middle';

  const metrics = ctx.measureText(displayStr);
  const textWidth = metrics.width;
  const textHeight = cfg.fontSize * 1.3;

  // Background box
  if (cfg.bgColor && cfg.bgColor !== 'transparent') {
    ctx.fillStyle = cfg.bgColor;
    const paddingX = 14;
    const paddingY = 6;
    const boxX = cfg.align === 'center' ? -textWidth / 2 - paddingX : cfg.align === 'left' ? -paddingX : -textWidth - paddingX;
    const boxY = -textHeight / 2 - paddingY / 2;
    const boxW = textWidth + paddingX * 2;
    const boxH = textHeight + paddingY;
    const radius = cfg.bgRadius || 6;

    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxW, boxH, radius);
    ctx.fill();
  }

  // Shadow
  if (cfg.shadowColor) {
    ctx.shadowColor = cfg.shadowColor;
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 3;
  }

  // Stroke
  if (cfg.strokeWidth > 0 && cfg.strokeColor) {
    ctx.strokeStyle = cfg.strokeColor;
    ctx.lineWidth = cfg.strokeWidth;
    ctx.lineJoin = 'round';
    ctx.strokeText(displayStr, 0, 0);
  }

  // Fill text
  ctx.fillStyle = cfg.color || '#ffffff';
  ctx.fillText(displayStr, 0, 0);

  ctx.restore();
}

// Render News Creator Tools (Lower thirds, breaking news, ticker)
function renderNewsOverlay(
  ctx: CanvasRenderingContext2D,
  cfg: NewsToolConfig,
  canvasW: number,
  canvasH: number,
  time: number
) {
  ctx.save();

  if (cfg.type === 'breaking_news') {
    // Red banner with pulsating LIVE tag
    const bannerH = 68;
    const bannerY = canvasH * 0.35 - bannerH / 2;

    ctx.fillStyle = cfg.bannerColor || '#dc2626';
    ctx.fillRect(-canvasW * 0.48, bannerY, canvasW * 0.96, bannerH);

    // Accent line
    ctx.fillStyle = cfg.accentColor || '#facc15';
    ctx.fillRect(-canvasW * 0.48, bannerY + bannerH - 4, canvasW * 0.96, 4);

    // Headline
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(cfg.headline, -canvasW * 0.45, bannerY + 28);

    // Subtext
    if (cfg.subtext) {
      ctx.fillStyle = '#fef08a';
      ctx.font = '500 13px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(cfg.subtext, -canvasW * 0.45, bannerY + 52);
    }
  } else if (cfg.type === 'lower_third') {
    // Sleek news lower third
    const boxW = canvasW * 0.85;
    const boxH = 58;
    const boxY = canvasH * 0.35;

    ctx.fillStyle = cfg.bannerColor || 'rgba(15, 23, 42, 0.9)';
    ctx.beginPath();
    ctx.roundRect(-boxW / 2, boxY, boxW, boxH, 8);
    ctx.fill();

    // Left accent bar
    ctx.fillStyle = cfg.accentColor || '#3b82f6';
    ctx.fillRect(-boxW / 2, boxY, 8, boxH);

    // Name
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(cfg.headline, -boxW / 2 + 18, boxY + 24);

    // Subtitle / Location
    ctx.fillStyle = '#94a3b8';
    ctx.font = '500 12px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(cfg.subtext || cfg.location || '', -boxW / 2 + 18, boxY + 44);
  } else if (cfg.type === 'ticker') {
    // Continuous scrolling ticker bar at bottom
    const tickerH = 34;
    const tickerY = canvasH * 0.45;

    ctx.fillStyle = cfg.bannerColor || '#1e1b4b';
    ctx.fillRect(-canvasW * 0.5, tickerY, canvasW, tickerH);

    ctx.fillStyle = '#ffffff';
    ctx.font = '600 13px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'left';

    const textMetrics = ctx.measureText(cfg.headline);
    const scrollOffset = (time * 60 * (cfg.scrollSpeed || 1.5)) % (textMetrics.width + canvasW);
    const textX = canvasW * 0.5 - scrollOffset;

    ctx.fillText(cfg.headline, textX, tickerY + 21);
    ctx.fillText(cfg.headline, textX + textMetrics.width + 80, tickerY + 21);
  }

  ctx.restore();
}
