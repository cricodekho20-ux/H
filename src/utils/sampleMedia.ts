import { Clip, Project } from '../types/editor';

// Programmatically generate a canvas-based video blob with animated visuals
export async function generateSyntheticVideoClip(
  theme: 'mumbai_sunset' | 'neon_grid' | 'himalayas' | 'creator_studio' | 'holi_burst',
  durationSec = 6,
  aspectRatio: '9:16' | '16:9' | '1:1' | '4:3' | '3:4' | '21:9' | 'custom' = '9:16'
): Promise<{ url: string; thumbnail: string; duration: number }> {
  let width = 540;
  let height = 960;
  if (aspectRatio === '16:9') {
    width = 960;
    height = 540;
  } else if (aspectRatio === '1:1') {
    width = 720;
    height = 720;
  } else if (aspectRatio === '4:3') {
    width = 800;
    height = 600;
  } else if (aspectRatio === '3:4') {
    width = 600;
    height = 800;
  } else if (aspectRatio === '21:9') {
    width = 1050;
    height = 450;
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  const fps = 30;
  const totalFrames = durationSec * fps;
  const stream = canvas.captureStream(fps);

  // Setup media recorder
  const mimeType = MediaRecorder.isTypeSupported('video/mp4;codecs=avc1')
    ? 'video/mp4;codecs=avc1'
    : MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
    ? 'video/webm;codecs=vp9'
    : 'video/webm';

  const recorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: 2500000,
  });

  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  const recordingPromise = new Promise<Blob>((resolve) => {
    recorder.onstop = () => {
      resolve(new Blob(chunks, { type: mimeType }));
    };
  });

  recorder.start();

  let firstFrameThumbnail = '';

  for (let f = 0; f < totalFrames; f++) {
    const t = f / fps;
    const progress = t / durationSec;

    // Draw background and elements based on theme
    ctx.clearRect(0, 0, width, height);

    if (theme === 'mumbai_sunset') {
      // Warm Mumbai Marine Drive Sunset gradient
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, '#0f172a');
      grad.addColorStop(0.35, '#831843');
      grad.addColorStop(0.65, '#ea580c');
      grad.addColorStop(1, '#fde047');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Sun
      const sunY = height * 0.55 + progress * 80;
      const sunGrad = ctx.createRadialGradient(width * 0.5, sunY, 10, width * 0.5, sunY, 140);
      sunGrad.addColorStop(0, 'rgba(255, 255, 230, 0.95)');
      sunGrad.addColorStop(0.3, 'rgba(253, 186, 116, 0.6)');
      sunGrad.addColorStop(1, 'rgba(253, 186, 116, 0)');
      ctx.fillStyle = sunGrad;
      ctx.beginPath();
      ctx.arc(width * 0.5, sunY, 140, 0, Math.PI * 2);
      ctx.fill();

      // Sea waves reflection
      ctx.fillStyle = 'rgba(254, 215, 170, 0.15)';
      for (let i = 0; i < 25; i++) {
        const y = height * 0.65 + i * (height * 0.015);
        const waveW = width * (0.2 + (i / 25) * 0.7);
        const offset = Math.sin(t * 3 + i) * 20;
        ctx.fillRect(width * 0.5 - waveW / 2 + offset, y, waveW, 2 + i * 0.2);
      }

      // City silhouette
      ctx.fillStyle = '#090d16';
      ctx.beginPath();
      ctx.moveTo(0, height);
      ctx.lineTo(0, height * 0.65);
      const bldCount = 14;
      for (let b = 0; b <= bldCount; b++) {
        const bx = (b / bldCount) * width;
        const bh = (Math.sin(b * 12.3) * 0.5 + 0.5) * (height * 0.12) + (height * 0.05);
        ctx.lineTo(bx, height * 0.65 - bh);
        ctx.lineTo(bx + width / bldCount, height * 0.65 - bh);
      }
      ctx.lineTo(width, height * 0.65);
      ctx.lineTo(width, height);
      ctx.closePath();
      ctx.fill();
    } else if (theme === 'neon_grid') {
      // Cyber Neon Perspective Grid
      ctx.fillStyle = '#05050f';
      ctx.fillRect(0, 0, width, height);

      // Deep perspective lines
      ctx.strokeStyle = '#6366f1';
      ctx.lineWidth = 1.5;
      const horizonY = height * 0.45;
      for (let x = -width; x <= width * 2; x += width * 0.12) {
        ctx.beginPath();
        ctx.moveTo(width * 0.5, horizonY);
        ctx.lineTo(x + Math.sin(t) * 10, height);
        ctx.stroke();
      }

      // Horizontal lines with exponential perspective
      for (let i = 1; i <= 14; i++) {
        const lineY = horizonY + Math.pow(i / 14, 2.2) * (height - horizonY);
        const cycleY = (lineY + t * 40) % (height - horizonY) + horizonY;
        ctx.strokeStyle = `rgba(168, 85, 247, ${0.1 + (i / 14) * 0.7})`;
        ctx.beginPath();
        ctx.moveTo(0, cycleY);
        ctx.lineTo(width, cycleY);
        ctx.stroke();
      }

      // Glowing Neon Cyber Sun
      ctx.strokeStyle = '#ec4899';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(width * 0.5, horizonY, 80, Math.PI, Math.PI * 2);
      ctx.stroke();
    } else if (theme === 'himalayas') {
      // Scenic Mountain peak with sunrise
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, '#0c4a6e');
      grad.addColorStop(0.5, '#38bdf8');
      grad.addColorStop(0.8, '#fdba74');
      grad.addColorStop(1, '#ffedd5');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Mountain 1 (distant)
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.moveTo(0, height);
      ctx.lineTo(width * 0.2, height * 0.35);
      ctx.lineTo(width * 0.5, height * 0.55);
      ctx.lineTo(width * 0.8, height * 0.3);
      ctx.lineTo(width, height * 0.6);
      ctx.lineTo(width, height);
      ctx.fill();

      // Mountain 2 (snow covered)
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.moveTo(0, height);
      ctx.lineTo(width * 0.45, height * 0.4);
      ctx.lineTo(width * 0.7, height * 0.65);
      ctx.lineTo(width, height * 0.48);
      ctx.lineTo(width, height);
      ctx.fill();

      // Snow peaks
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.moveTo(width * 0.45, height * 0.4);
      ctx.lineTo(width * 0.4, height * 0.46);
      ctx.lineTo(width * 0.45, height * 0.45);
      ctx.lineTo(width * 0.5, height * 0.48);
      ctx.closePath();
      ctx.fill();
    } else if (theme === 'creator_studio') {
      // Modern creator neon studio lighting
      ctx.fillStyle = '#090a10';
      ctx.fillRect(0, 0, width, height);

      // Dual color rim light
      const grad1 = ctx.createRadialGradient(width * 0.1, height * 0.3, 10, width * 0.1, height * 0.3, width * 0.7);
      grad1.addColorStop(0, 'rgba(99, 102, 241, 0.4)');
      grad1.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad1;
      ctx.fillRect(0, 0, width, height);

      const grad2 = ctx.createRadialGradient(width * 0.9, height * 0.7, 10, width * 0.9, height * 0.7, width * 0.7);
      grad2.addColorStop(0, 'rgba(236, 72, 153, 0.4)');
      grad2.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad2;
      ctx.fillRect(0, 0, width, height);

      // Soundwave animation
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      const bars = 24;
      const barW = width * 0.02;
      for (let i = 0; i < bars; i++) {
        const bx = width * 0.25 + i * (barW * 1.6);
        const bh = Math.sin(t * 8 + i * 0.5) * 40 + 60;
        ctx.fillRect(bx, height * 0.5 - bh / 2, barW, bh);
      }
    } else {
      // Holi color blast theme
      ctx.fillStyle = '#111827';
      ctx.fillRect(0, 0, width, height);

      const colors = ['#f43f5e', '#8b5cf6', '#06b6d4', '#eab308', '#10b981'];
      for (let i = 0; i < 40; i++) {
        const angle = (i / 40) * Math.PI * 2 + t * 0.5;
        const dist = ((progress * 1.5 + i * 0.02) % 1) * (width * 0.6);
        const cx = width * 0.5 + Math.cos(angle) * dist;
        const cy = height * 0.5 + Math.sin(angle) * dist;
        const rad = 8 + (i % 12);
        ctx.fillStyle = colors[i % colors.length];
        ctx.beginPath();
        ctx.arc(cx, cy, rad, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    if (f === 0) {
      firstFrameThumbnail = canvas.toDataURL('image/jpeg', 0.7);
    }

    // yield a tick for recorder
    await new Promise((r) => setTimeout(r, 1000 / fps));
  }

  recorder.stop();
  const videoBlob = await recordingPromise;
  const url = URL.createObjectURL(videoBlob);

  return {
    url,
    thumbnail: firstFrameThumbnail || canvas.toDataURL('image/jpeg', 0.6),
    duration: durationSec,
  };
}

// Generate static sample stock photos in canvas
export function generateStockPhoto(title: string, bgColor1: string, bgColor2: string, text: string, aspectRatio: '9:16' | '16:9' | '1:1' | '4:3' | '3:4' | '21:9' | 'custom' = '9:16'): { url: string; thumbnail: string } {
  let width = 540;
  let height = 960;
  if (aspectRatio === '16:9') {
    width = 960;
    height = 540;
  } else if (aspectRatio === '1:1') {
    width = 720;
    height = 720;
  } else if (aspectRatio === '4:3') {
    width = 800;
    height = 600;
  } else if (aspectRatio === '3:4') {
    width = 600;
    height = 800;
  } else if (aspectRatio === '21:9') {
    width = 1050;
    height = 450;
  }
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, width, height);
  grad.addColorStop(0, bgColor1);
  grad.addColorStop(1, bgColor2);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // Subtle geometric grid
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
  ctx.lineWidth = 1;
  for (let x = 0; x < width; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y < height; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // Soft glowing orb
  const orb = ctx.createRadialGradient(width * 0.5, height * 0.45, 10, width * 0.5, height * 0.45, width * 0.4);
  orb.addColorStop(0, 'rgba(255, 255, 255, 0.25)');
  orb.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = orb;
  ctx.beginPath();
  ctx.arc(width * 0.5, height * 0.45, width * 0.4, 0, Math.PI * 2);
  ctx.fill();

  // Typography
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 36px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(title, width * 0.5, height * 0.45);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.font = '500 20px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(text, width * 0.5, height * 0.52);

  const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
  return { url: dataUrl, thumbnail: dataUrl };
}

// Built-in starter templates for creators
export interface TemplatePreset {
  id: string;
  name: string;
  nameHi: string;
  category: string;
  aspectRatio: '9:16' | '16:9' | '1:1';
  description: string;
  descriptionHi: string;
  color: string;
  clipsCount: number;
  duration: number;
}

export const TEMPLATES: TemplatePreset[] = [
  {
    id: 'tpl_shorts_hook',
    name: 'YouTube Shorts Viral Hook',
    nameHi: 'यूट्यूब शॉर्ट्स वायरल हुक',
    category: 'YouTube Shorts',
    aspectRatio: '9:16',
    description: 'Fast 0-3s hook with punchy pop text, sound effects and dynamic zoom',
    descriptionHi: 'तेज 0-3s हुक, पॉप टेक्स्ट और डायनामिक ज़ूम के साथ',
    color: '#ef4444',
    clipsCount: 3,
    duration: 12,
  },
  {
    id: 'tpl_reel_cinematic',
    name: 'Instagram Reel Cinematic Beat',
    nameHi: 'इंस्टाग्राम रील सिनेमाई बीट',
    category: 'Instagram Reels',
    aspectRatio: '9:16',
    description: 'Rhythmic cuts synced to beat with warm cinematic filter and smooth slide transitions',
    descriptionHi: 'सिनेमाई फ़िल्टर और सहज ट्रांज़िशन के साथ बीट पर कट्स',
    color: '#ec4899',
    clipsCount: 4,
    duration: 15,
  },
  {
    id: 'tpl_news_break',
    name: 'Breaking News India Lower-Third',
    nameHi: 'ब्रेकिंग न्यूज़ इंडिया लोअर-थर्ड',
    category: 'News & Updates',
    aspectRatio: '16:9',
    description: 'Broadcast headline banner, scrolling ticker and bold red accent text',
    descriptionHi: 'न्यूज़ हेडलाइन बैनर और बोल्ड रेड ऐक्सेंट टेक्स्ट',
    color: '#f97316',
    clipsCount: 2,
    duration: 15,
  },
  {
    id: 'tpl_vlog_travel',
    name: 'Incredible India Travel Vlog',
    nameHi: 'इन्क्रेडिबल इंडिया ट्रैवल व्लॉग',
    category: 'Travel / Lifestyle',
    aspectRatio: '9:16',
    description: 'Panoramic aesthetic, slow-mo Ken Burns photo pan and relaxed acoustic audio',
    descriptionHi: 'पैनोरमिक एस्थेटिक, केन बर्न्स फोटो पैन और रिलैक्स्ड म्यूजिक',
    color: '#06b6d4',
    clipsCount: 3,
    duration: 18,
  },
];
