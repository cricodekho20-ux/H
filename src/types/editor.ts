export type AspectRatio = '9:16' | '16:9' | '1:1' | '4:3' | '3:4' | '21:9' | 'custom';
export type TrackType = 'main' | 'overlay' | 'text' | 'sticker' | 'audio' | 'voice';
export type ClipType = 'video' | 'image' | 'text' | 'audio' | 'sticker';

export type FilterPreset =
  | 'none'
  | 'cinematic'
  | 'portrait'
  | 'warm'
  | 'cool'
  | 'vintage'
  | 'retro'
  | 'bw'
  | 'night'
  | 'food'
  | 'travel'
  | 'bright'
  | 'dark'
  | 'news';

export type VideoEffect =
  | 'none'
  | 'shake'
  | 'camera_shake'
  | 'zoom'
  | 'flash'
  | 'glitch'
  | 'rgb_split'
  | 'motion_blur'
  | 'lens_blur'
  | 'blur'
  | 'film_grain'
  | 'vhs'
  | 'chromatic'
  | 'distortion'
  | 'light_leak';

export type TransitionType =
  | 'none'
  | 'fade'
  | 'dissolve'
  | 'slide_left'
  | 'slide_right'
  | 'push'
  | 'zoom'
  | 'whirl'
  | 'spin'
  | 'flash'
  | 'blur'
  | 'glitch'
  | 'cube_3d';

export type MaskType = 'none' | 'circle' | 'rectangle' | 'linear' | 'mirror' | 'heart' | 'star';

// Animation System (IN, OUT, COMBO)
export type InAnimation =
  | 'none'
  | 'fade_in'
  | 'zoom_in'
  | 'slide_left'
  | 'slide_right'
  | 'slide_up'
  | 'slide_down'
  | 'pop'
  | 'bounce'
  | 'rotate'
  | 'blur_in'
  | 'elastic'
  | 'light_in';

export type OutAnimation =
  | 'none'
  | 'fade_out'
  | 'zoom_out'
  | 'slide_left'
  | 'slide_right'
  | 'slide_up'
  | 'slide_down'
  | 'pop_out'
  | 'bounce_out'
  | 'rotate_out'
  | 'blur_out';

export type ComboAnimation =
  | 'none'
  | 'zoom_rotate'
  | 'shake_zoom'
  | 'bounce_scale'
  | 'slide_fade'
  | 'pop_rotate';

export type TextAnimation =
  | 'none'
  | 'fade'
  | 'pop'
  | 'bounce'
  | 'slide'
  | 'zoom'
  | 'typewriter'
  | 'shake'
  | 'rotate'
  | 'glitch';

export type InterpolationMode = 'linear' | 'ease_in' | 'ease_out' | 'ease_in_out';

export interface Keyframe {
  time: number; // seconds relative to clip start
  x?: number; // px offset
  y?: number; // px offset
  scale?: number; // multiplier
  scaleX?: number; // multiplier, 1.0 = normal
  scaleY?: number;
  rotation?: number; // degrees
  opacity?: number; // 0 to 1
  blur?: number; // px
  brightness?: number; // -100 to 100
  contrast?: number; // -100 to 100
  saturation?: number; // -100 to 100
  easing?: InterpolationMode;
}

export interface SpeedCurvePoint {
  x: number; // 0 to 1 (normalized time)
  y: number; // speed multiplier (e.g. 0.2 to 4.0)
}

export type SpeedCurvePreset =
  | 'none'
  | 'montage'
  | 'bullet'
  | 'jump_cut'
  | 'hero'
  | 'flash_in'
  | 'flash_out'
  | 'custom';

export interface ColorAdjustment {
  brightness: number; // -100 to 100, default 0
  contrast: number; // -100 to 100, default 0
  saturation: number; // -100 to 100, default 0
  exposure: number; // -100 to 100, default 0
  temperature: number; // -100 to 100 (warm/cool), default 0
  tint: number; // -100 to 100, default 0
  highlights: number; // -100 to 100, default 0
  shadows: number; // -100 to 100, default 0
  fade?: number; // 0 to 100
  sharpen: number; // 0 to 100, default 0
  vignette: number; // 0 to 100, default 0
  grain?: number; // 0 to 100
}

export interface TextConfig {
  text: string;
  font: string;
  fontSize: number;
  bold: boolean;
  italic: boolean;
  align: 'left' | 'center' | 'right';
  letterSpacing?: number; // px
  lineSpacing?: number; // multiplier
  color: string;
  gradient?: { color1: string; color2: string; angle: number };
  strokeColor: string;
  strokeWidth: number;
  bgColor: string;
  bgRadius: number;
  shadowColor: string;
  glowColor?: string;
  glowBlur?: number;
  animation: TextAnimation;
}

export interface NewsToolConfig {
  type: 'breaking_news' | 'lower_third' | 'headline_bar' | 'ticker' | 'reporter_tag' | 'channel_logo';
  headline: string;
  subtext?: string;
  location?: string;
  reporterName?: string;
  timeString?: string;
  bannerColor: string;
  accentColor: string;
  scrollSpeed?: number;
}

export type VoiceChangerEffect = 'none' | 'deep' | 'high' | 'robot' | 'echo' | 'radio' | 'low';

export interface Clip {
  id: string;
  trackId: TrackType;
  type: ClipType;
  name: string;
  src: string; // Blob URL, Data URL, or asset identifier
  videoElement?: HTMLVideoElement;
  imageElement?: HTMLImageElement;
  audioBuffer?: AudioBuffer;
  duration: number; // total available duration in seconds
  startAt: number; // position on timeline in seconds
  trimIn: number; // trim start offset in seconds
  trimOut: number; // trim end offset in seconds
  speed: number; // 0.1 to 8.0
  speedCurve?: {
    preset: SpeedCurvePreset;
    points: SpeedCurvePoint[];
  };
  transform: {
    x: number;
    y: number;
    scale: number;
    scaleX?: number;
    scaleY?: number;
    rotation: number;
    opacity: number;
    flipH: boolean;
    flipV: boolean;
    crop?: { left: number; top: number; right: number; bottom: number };
  };
  keyframes: Keyframe[];
  // Animation System
  inAnimation?: { type: InAnimation; duration: number };
  outAnimation?: { type: OutAnimation; duration: number };
  comboAnimation?: { type: ComboAnimation; duration: number };
  filter: {
    preset: FilterPreset;
    intensity: number; // 0 to 100
  };
  colorAdjustment: ColorAdjustment;
  effect: VideoEffect;
  effectIntensity?: number; // 0 to 100
  transition: {
    type: TransitionType;
    duration: number; // seconds
  };
  chromaKey: {
    enabled: boolean;
    color: string; // hex #00ff00 or #0000ff
    similarity: number; // 0 to 100
    smoothness: number; // 0 to 100
    spillControl?: number; // 0 to 100
    edgeSoftness?: number; // 0 to 100
  };
  mask: {
    type: MaskType;
    feather: number;
    position?: { x: number; y: number };
    scale?: number;
    rotation?: number;
    opacity?: number;
  };
  audio: {
    volume: number; // 0 to 200, 100 is normal
    muted: boolean;
    fadeIn: number; // seconds
    fadeOut: number; // seconds
    noiseReduction?: boolean;
    voiceEnhance?: boolean;
    voiceChanger?: VoiceChangerEffect;
  };
  textConfig?: TextConfig;
  newsConfig?: NewsToolConfig;
  stickerConfig?: {
    category: string;
    iconSvg?: string;
  };
  motionTrackTargetId?: string; // attach to another clip's position
  photoAnimation?: 'none' | 'zoom_in' | 'zoom_out' | 'pan_left' | 'pan_right' | 'pan_up' | 'pan_down' | 'ken_burns';
  waveformData?: number[];
  beatMarkers?: number[]; // seconds where beats occur
}

export interface CanvasSettings {
  aspectRatio: AspectRatio;
  customWidth?: number;
  customHeight?: number;
  backgroundType: 'color' | 'gradient' | 'blur' | 'image';
  backgroundColor?: string;
  gradientColors?: [string, string];
  blurAmount?: number;
}

export interface Project {
  id: string;
  name: string;
  aspectRatio: AspectRatio;
  canvasSettings?: CanvasSettings;
  duration: number; // timeline total duration in seconds
  resolution: '480p' | '720p' | '1080p';
  fps: 24 | 30 | 60;
  lastEdited: number;
  thumbnail: string;
  clips: Clip[];
}

export interface MediaItem {
  id: string;
  name: string;
  type: 'video' | 'image' | 'audio';
  src: string;
  duration: number;
  size?: number;
  thumbnail?: string;
  addedAt: number;
}
