import { Project } from '../types/editor';
import { renderFrame, getOrCreateVideoElement, getOrCreateImageElement } from './renderer';

export interface ExportProgress {
  currentFrame: number;
  totalFrames: number;
  percentage: number;
  estimatedRemainingSec: number;
  status: 'rendering' | 'encoding' | 'completed' | 'cancelled' | 'error';
  error?: string;
  resultBlob?: Blob;
  resultUrl?: string;
}

export interface ExportOptions {
  resolution: '480p' | '720p' | '1080p';
  fps: 24 | 30 | 60;
  quality: 'low' | 'medium' | 'high';
  format: 'mp4' | 'webm';
}

export class VideoExporter {
  private isCancelled = false;

  public cancel() {
    this.isCancelled = true;
  }

  public async exportProject(
    project: Project,
    options: ExportOptions,
    onProgress: (p: ExportProgress) => void
  ): Promise<{ blob: Blob; url: string }> {
    this.isCancelled = false;

    // Determine pixel dimensions based on aspect ratio and resolution
    let targetWidth = 1080;
    let targetHeight = 1920;

    const baseRes = options.resolution === '480p' ? 480 : options.resolution === '720p' ? 720 : 1080;

    if (project.aspectRatio === '9:16') {
      targetWidth = baseRes;
      targetHeight = Math.round((baseRes * 16) / 9);
    } else if (project.aspectRatio === '16:9') {
      targetHeight = baseRes;
      targetWidth = Math.round((baseRes * 16) / 9);
    } else if (project.aspectRatio === '1:1') {
      targetWidth = baseRes;
      targetHeight = baseRes;
    } else if (project.aspectRatio === '3:4') {
      targetWidth = baseRes;
      targetHeight = Math.round((baseRes * 4) / 3);
    } else if (project.aspectRatio === '21:9') {
      targetHeight = baseRes;
      targetWidth = Math.round((baseRes * 21) / 9);
    } else {
      // 4:3
      targetHeight = baseRes;
      targetWidth = Math.round((baseRes * 4) / 3);
    }

    // Preload all media elements in project
    for (const clip of project.clips) {
      if (clip.type === 'video') {
        await getOrCreateVideoElement(clip.src);
      } else if (clip.type === 'image') {
        await getOrCreateImageElement(clip.src);
      }
    }

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const fps = options.fps;
    const duration = Math.max(1, project.duration);
    const totalFrames = Math.ceil(duration * fps);

    // Bitrate calculation
    const bps =
      options.quality === 'low'
        ? 2000000
        : options.quality === 'medium'
        ? 5000000
        : 10000000;

    const stream = canvas.captureStream(fps);

    // Pick supported mime type
    let mimeType = 'video/webm';
    if (options.format === 'mp4' && MediaRecorder.isTypeSupported('video/mp4;codecs=avc1')) {
      mimeType = 'video/mp4;codecs=avc1';
    } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
      mimeType = 'video/webm;codecs=vp9';
    } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8')) {
      mimeType = 'video/webm;codecs=vp8';
    }

    const recorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: bps,
    });

    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    const completionPromise = new Promise<{ blob: Blob; url: string }>((resolve, reject) => {
      recorder.onstop = () => {
        const finalBlob = new Blob(chunks, { type: mimeType });
        const url = URL.createObjectURL(finalBlob);
        resolve({ blob: finalBlob, url });
      };
      recorder.onerror = (err) => {
        reject(err);
      };
    });

    recorder.start();

    const startTime = performance.now();

    for (let frame = 0; frame < totalFrames; frame++) {
      if (this.isCancelled) {
        recorder.stop();
        onProgress({
          currentFrame: frame,
          totalFrames,
          percentage: Math.round((frame / totalFrames) * 100),
          estimatedRemainingSec: 0,
          status: 'cancelled',
        });
        throw new Error('Export cancelled by user.');
      }

      const currentTime = frame / fps;

      // Render frame onto export canvas
      renderFrame(canvas, project, currentTime, null);

      // Report progress
      const elapsedSec = (performance.now() - startTime) / 1000;
      const framesDone = frame + 1;
      const fpsRendered = framesDone / elapsedSec;
      const remainingFrames = totalFrames - framesDone;
      const estimatedRemainingSec = Math.max(0, Math.round(remainingFrames / (fpsRendered || 1)));
      const percentage = Math.min(99, Math.round((framesDone / totalFrames) * 100));

      onProgress({
        currentFrame: framesDone,
        totalFrames,
        percentage,
        estimatedRemainingSec,
        status: 'rendering',
      });

      // Frame interval pace
      await new Promise((r) => setTimeout(r, 1000 / fps));
    }

    onProgress({
      currentFrame: totalFrames,
      totalFrames,
      percentage: 100,
      estimatedRemainingSec: 0,
      status: 'encoding',
    });

    recorder.stop();
    const result = await completionPromise;

    onProgress({
      currentFrame: totalFrames,
      totalFrames,
      percentage: 100,
      estimatedRemainingSec: 0,
      status: 'completed',
      resultBlob: result.blob,
      resultUrl: result.url,
    });

    return result;
  }
}
