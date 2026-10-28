import React from 'react';
import { Sliders, X, RotateCcw } from 'lucide-react';
import { EQ_FREQUENCIES, EQ_PRESETS } from '../services/audioEngine';
import { EQPresetName, Language } from '../types/music';

interface EqualizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPreset: EQPresetName;
  gains: number[];
  onChangePreset: (preset: EQPresetName) => void;
  onChangeBandGain: (bandIndex: number, gain: number) => void;
  onReset: () => void;
  lang: Language;
}

export const EqualizerModal: React.FC<EqualizerModalProps> = ({
  isOpen,
  onClose,
  currentPreset,
  gains,
  onChangePreset,
  onChangeBandGain,
  onReset,
  lang,
}) => {
  if (!isOpen) return null;

  const presets: EQPresetName[] = [
    'Flat',
    'Bass Boost',
    'Pop',
    'Rock',
    'Electronic',
    'Vocal Boost',
    'Acoustic',
  ];

  const formatFreq = (freq: number) => {
    return freq >= 1000 ? `${freq / 1000}k` : `${freq}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
      <div 
        className="bg-[#181818] border border-white/10 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col"
        dir={lang === 'ar' ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#121212]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#1DB954]/10 text-[#1DB954] border border-[#1DB954]/25 flex items-center justify-center">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                {lang === 'ar' ? 'معدل الصوت (10-Band Equalizer)' : '10-Band Graphic Equalizer'}
              </h3>
              <p className="text-xs text-neutral-400">
                {lang === 'ar' ? 'تحكم بالترددات الصوتية ومضخم الباس وتعديل النغمات الحية' : 'Fine-tune acoustic frequencies, bass response, and soundstage'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onReset}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-neutral-300 transition-colors"
              title="Reset to 0dB"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{lang === 'ar' ? 'إعادة ضبط' : 'Reset'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Preset Selector Buttons */}
        <div className="px-6 py-3 bg-[#181818] border-b border-white/5 flex items-center gap-2 overflow-x-auto">
          <span className="text-xs text-neutral-400 font-medium shrink-0">
            {lang === 'ar' ? 'الإعداد المسبق:' : 'Preset:'}
          </span>
          <div className="flex items-center gap-1.5">
            {presets.map((preset) => (
              <button
                key={preset}
                onClick={() => onChangePreset(preset)}
                className={`px-3 py-1 rounded-md text-xs font-semibold whitespace-nowrap transition-all ${
                  currentPreset === preset
                    ? 'bg-[#1DB954] text-black shadow-md shadow-[#1DB954]/20 font-bold'
                    : 'bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        {/* 10-Band Graphic Slider Deck */}
        <div className="p-6 bg-[#121212]">
          <div className="flex items-end justify-between gap-2 h-64 px-2 py-4 bg-black/50 rounded-xl border border-white/5">
            {EQ_FREQUENCIES.map((freq, index) => {
              const gain = gains[index] || 0;

              return (
                <div key={freq} className="flex-1 flex flex-col items-center justify-between h-full group">
                  {/* dB readout */}
                  <span className={`text-[11px] font-mono tabular-nums font-semibold mb-2 ${
                    gain !== 0 ? 'text-[#1DB954]' : 'text-neutral-500'
                  }`}>
                    {gain > 0 ? `+${gain}` : `${gain}`}
                  </span>

                  {/* Vertical Slider */}
                  <div className="relative flex-1 flex items-center justify-center py-2">
                    <input
                      type="range"
                      min={-12}
                      max={12}
                      step={0.5}
                      value={gain}
                      onChange={(e) => onChangeBandGain(index, parseFloat(e.target.value))}
                      className="w-36 h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer outline-none -rotate-90 origin-center accent-[#1DB954]"
                    />
                  </div>

                  {/* Center zero line marker */}
                  <div className="w-4 h-0.5 bg-white/10 my-1" />

                  {/* Frequency label */}
                  <span className="text-[11px] font-mono text-neutral-400 group-hover:text-white mt-1">
                    {formatFreq(freq)}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-[11px] text-neutral-400 mt-3 px-2">
            <span>{lang === 'ar' ? 'الترددات المنخفضة (Bass)' : 'Low (Bass)'}</span>
            <span>{lang === 'ar' ? 'الترددات المتوسطة (Vocals)' : 'Midrange (Vocals)'}</span>
            <span>{lang === 'ar' ? 'الترددات العالية (Treble)' : 'High (Treble)'}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-[#121212] border-t border-white/5 flex items-center justify-between text-xs text-neutral-400">
          <span>Web Audio API · 10 BiquadFilterNodes (-12dB to +12dB)</span>
          <span className="text-[#1DB954] font-semibold">{currentPreset} Active</span>
        </div>
      </div>
    </div>
  );
};
