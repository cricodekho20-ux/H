import React, { useState, useRef, useEffect } from 'react';
import { Camera, Mic, Square, RefreshCw, X, Check, Volume2 } from 'lucide-react';
import { t } from '../../utils/i18n';

interface RecordModalProps {
  type: 'video' | 'voice';
  isOpen: boolean;
  onClose: () => void;
  onSaveMedia: (media: { url: string; duration: number; type: 'video' | 'audio'; name: string }) => void;
}

export const RecordModal: React.FC<RecordModalProps> = ({ type, isOpen, onClose, onSaveMedia }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isOpen) {
      stopAllMedia();
      return;
    }
    startStream();

    return () => {
      stopAllMedia();
    };
  }, [isOpen, type, facingMode]);

  const stopAllMedia = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop();
    }
    setIsRecording(false);
    setRecordedBlob(null);
    setRecordedUrl(null);
    setElapsedSec(0);
    setErrorMsg(null);
  };

  const startStream = async () => {
    setErrorMsg(null);
    try {
      if (type === 'video') {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode },
          audio: true,
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      } else {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        streamRef.current = stream;
        setupVoiceVisualizer(stream);
      }
    } catch (err: any) {
      console.warn('Device media stream failed:', err);
      setErrorMsg('Camera or microphone permission required. Please allow access.');
    }
  };

  const setupVoiceVisualizer = (stream: MediaStream) => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 64;
    source.connect(analyser);

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const draw = () => {
      if (!canvasRef.current) return;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const barWidth = (canvas.width / dataArray.length) * 1.5;
      let x = 0;

      for (let i = 0; i < dataArray.length; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height * 0.85;
        const grad = ctx.createLinearGradient(0, canvas.height, 0, 0);
        grad.addColorStop(0, '#6366f1');
        grad.addColorStop(1, '#a855f7');
        ctx.fillStyle = grad;
        ctx.fillRect(x, (canvas.height - barHeight) / 2, barWidth - 2, barHeight);
        x += barWidth;
      }

      animFrameRef.current = requestAnimationFrame(draw);
    };

    draw();
  };

  const startRecording = () => {
    if (!streamRef.current) return;
    chunksRef.current = [];

    const mime = type === 'video'
      ? (MediaRecorder.isTypeSupported('video/mp4;codecs=avc1') ? 'video/mp4;codecs=avc1' : 'video/webm')
      : 'audio/webm';

    const recorder = new MediaRecorder(streamRef.current, { mimeType: mime });
    recorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mime });
      const url = URL.createObjectURL(blob);
      setRecordedBlob(blob);
      setRecordedUrl(url);
    };

    recorder.start(100);
    setIsRecording(true);
    setElapsedSec(0);

    timerRef.current = window.setInterval(() => {
      setElapsedSec((prev) => prev + 1);
    }, 1000);
  };

  const stopRecording = () => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop();
    }
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRecording(false);
  };

  const handleSave = () => {
    if (!recordedUrl) return;
    onSaveMedia({
      url: recordedUrl,
      duration: Math.max(1, elapsedSec),
      type: type === 'video' ? 'video' : 'audio',
      name: type === 'video' ? `Recorded Video (${elapsedSec}s)` : `Voice Recording (${elapsedSec}s)`,
    });
    onClose();
  };

  const formatSec = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            {type === 'video' ? <Camera className="w-5 h-5 text-indigo-400" /> : <Mic className="w-5 h-5 text-indigo-400" />}
            <h3 className="font-semibold text-white">
              {type === 'video' ? t('record_video') : t('record_voice')}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewport / Visualizer */}
        <div className="relative w-full aspect-square bg-black flex items-center justify-center overflow-hidden">
          {errorMsg ? (
            <div className="p-6 text-center text-amber-300 text-sm max-w-xs">
              {errorMsg}
            </div>
          ) : type === 'video' ? (
            recordedUrl ? (
              <video src={recordedUrl} controls className="w-full h-full object-cover" />
            ) : (
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            )
          ) : (
            <div className="flex flex-col items-center justify-center gap-6 w-full px-6">
              <div className={`p-8 rounded-full ${isRecording ? 'bg-rose-500/20 text-rose-400 animate-pulse' : 'bg-indigo-500/20 text-indigo-400'}`}>
                <Volume2 className="w-16 h-16" />
              </div>
              <canvas ref={canvasRef} width={300} height={70} className="w-full h-16" />
              {recordedUrl && (
                <audio src={recordedUrl} controls className="w-full mt-2" />
              )}
            </div>
          )}

          {/* Timer overlay */}
          <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-xs font-mono font-medium text-white">
            <span className={`w-2 h-2 rounded-full ${isRecording ? 'bg-rose-500 animate-ping' : 'bg-slate-400'}`} />
            {formatSec(elapsedSec)}
          </div>

          {/* Switch camera for video */}
          {type === 'video' && !recordedUrl && (
            <button
              onClick={() => setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'))}
              className="absolute top-4 right-4 p-2.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white hover:bg-black/80 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Controls */}
        <div className="p-6 flex items-center justify-center gap-6 bg-slate-950">
          {!recordedUrl ? (
            !isRecording ? (
              <button
                onClick={startRecording}
                className="w-16 h-16 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-600/30 transition-transform active:scale-95"
              >
                <div className="w-7 h-7 rounded-full bg-white" />
              </button>
            ) : (
              <button
                onClick={stopRecording}
                className="w-16 h-16 rounded-full bg-slate-800 hover:bg-slate-700 text-rose-500 border-2 border-rose-500 flex items-center justify-center shadow-lg transition-transform active:scale-95"
              >
                <Square className="w-6 h-6 fill-rose-500" />
              </button>
            )
          ) : (
            <div className="flex items-center gap-4 w-full">
              <button
                onClick={() => {
                  setRecordedUrl(null);
                  setRecordedBlob(null);
                  startStream();
                }}
                className="flex-1 py-3 px-4 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 font-medium text-sm transition-colors text-center"
              >
                Retake
              </button>
              <button
                onClick={handleSave}
                className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-transform active:scale-95"
              >
                <Check className="w-4 h-4" />
                Add to Project
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
