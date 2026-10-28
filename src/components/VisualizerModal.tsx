import React, { useEffect, useRef, useState } from 'react';
import { X, Activity, Waves, Disc, Volume2 } from 'lucide-react';
import { audioEngine } from '../services/audioEngine';
import { Track, Language } from '../types/music';

interface VisualizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  track: Track | null;
  isPlaying: boolean;
  lang: Language;
}

type VisualizerMode = 'bars' | 'wave' | 'circle';

export const VisualizerModal: React.FC<VisualizerModalProps> = ({
  isOpen,
  onClose,
  track,
  isPlaying,
  lang,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [mode, setMode] = useState<VisualizerMode>('bars');
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isOpen) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      const data = audioEngine.getVisualizerData();

      ctx.clearRect(0, 0, width, height);

      // Deep dark gradient backdrop
      const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
      bgGradient.addColorStop(0, '#121212');
      bgGradient.addColorStop(1, '#000000');
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, width, height);

      if (mode === 'bars') {
        const barCount = 48;
        const barWidth = (width / barCount) * 0.72;
        const gap = (width / barCount) * 0.28;

        for (let i = 0; i < barCount; i++) {
          const valIndex = Math.floor((i / barCount) * data.length);
          const rawVal = data[valIndex] || 0;
          const val = isPlaying ? rawVal : (Math.sin(Date.now() / 300 + i) * 6 + 10);
          const barHeight = Math.max(4, (val / 255) * (height * 0.75));
          const x = i * (barWidth + gap) + gap / 2;
          const y = height - barHeight - 40;

          // Spotify Green Gradient
          const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
          gradient.addColorStop(0, '#1DB954');
          gradient.addColorStop(0.7, '#169c46');
          gradient.addColorStop(1, '#0e632c');

          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, barHeight, [4, 4, 0, 0]);
          ctx.fill();

          // Top highlight cap
          ctx.fillStyle = '#68e894';
          ctx.fillRect(x, y - 2, barWidth, 2);
        }
      } else if (mode === 'wave') {
        // Oscilloscope waveform style with Green Glow
        ctx.beginPath();
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#1DB954';
        ctx.shadowColor = '#1DB954';
        ctx.shadowBlur = 14;

        const sliceWidth = width / (data.length - 1);
        let x = 0;

        for (let i = 0; i < data.length; i++) {
          const v = data[i] / 128.0;
          const offset = isPlaying ? (v - 1.0) * (height / 3) : Math.sin(Date.now() / 200 + i * 0.3) * 15;
          const y = height / 2 + offset;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
          x += sliceWidth;
        }

        ctx.stroke();
        ctx.shadowBlur = 0;
      } else if (mode === 'circle') {
        // Radial audio visualizer
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) * 0.22;

        ctx.save();
        ctx.translate(centerX, centerY);

        const count = 64;
        for (let i = 0; i < count; i++) {
          const angle = (i / count) * Math.PI * 2;
          const dataIdx = Math.floor((i / count) * data.length);
          const amp = isPlaying ? (data[dataIdx] / 255) * 80 : 8;

          const x1 = Math.cos(angle) * radius;
          const y1 = Math.sin(angle) * radius;
          const x2 = Math.cos(angle) * (radius + amp);
          const y2 = Math.sin(angle) * (radius + amp);

          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.strokeStyle = i % 2 === 0 ? '#1DB954' : '#14833b';
          ctx.lineWidth = 3;
          ctx.lineCap = 'round';
          ctx.stroke();
        }

        // Center album circle
        ctx.beginPath();
        ctx.arc(0, 0, radius - 4, 0, Math.PI * 2);
        ctx.fillStyle = '#181818';
        ctx.fill();
        ctx.strokeStyle = '#1DB954';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.restore();
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isOpen, mode, isPlaying]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-lg animate-in fade-in duration-200">
      <div 
        className="bg-[#181818] border border-white/10 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col"
        dir={lang === 'ar' ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#121212]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#1DB954]/10 text-[#1DB954] border border-[#1DB954]/25 flex items-center justify-center">
              <Activity className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {lang === 'ar' ? 'محلل الترددات الصوتي الحي (60 FPS)' : 'Live Audio Spectrum Visualizer (60 FPS)'}
              </h3>
              <p className="text-xs text-neutral-400">
                {track ? `${track.title} · ${track.artist}` : (lang === 'ar' ? 'جاهز للتشغيل' : 'Ready to play')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Visualizer Mode selector */}
            <div className="flex items-center p-1 bg-white/5 border border-white/10 rounded-lg text-xs">
              <button
                onClick={() => setMode('bars')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded transition-colors ${
                  mode === 'bars' ? 'bg-[#1DB954] text-black font-semibold' : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Activity className="w-3 h-3" />
                {lang === 'ar' ? 'أعمدة' : 'Bars'}
              </button>
              <button
                onClick={() => setMode('wave')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded transition-colors ${
                  mode === 'wave' ? 'bg-[#1DB954] text-black font-semibold' : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Waves className="w-3 h-3" />
                {lang === 'ar' ? 'موجات' : 'Wave'}
              </button>
              <button
                onClick={() => setMode('circle')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded transition-colors ${
                  mode === 'circle' ? 'bg-[#1DB954] text-black font-semibold' : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Disc className="w-3 h-3" />
                {lang === 'ar' ? 'دائري' : 'Radial'}
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Canvas Display */}
        <div className="relative w-full h-80 bg-black flex items-center justify-center">
          <canvas
            ref={canvasRef}
            width={720}
            height={320}
            className="w-full h-full object-contain"
          />
          {!isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-xs pointer-events-none">
              <div className="text-center">
                <Volume2 className="w-8 h-8 text-neutral-500 mx-auto mb-2 opacity-50" />
                <p className="text-xs text-neutral-400 font-medium">
                  {lang === 'ar' ? 'المشغل متوقف حالياً. شغّل مقطعاً لرؤية النبضات الحية!' : 'Paused. Play a song to see live audio reactivity!'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-6 py-3 bg-[#121212] border-t border-white/5 flex items-center justify-between text-xs text-neutral-400">
          <span>Web Audio API · AnalyserNode 128 FFT · 60 FPS</span>
          <span className="text-[#1DB954] font-mono">
            {isPlaying ? (lang === 'ar' ? 'البث متصل ومباشر' : 'Live Spectrum Audio Feed') : (lang === 'ar' ? 'في وضع الاستعداد' : 'Standby Mode')}
          </span>
        </div>
      </div>
    </div>
  );
};
