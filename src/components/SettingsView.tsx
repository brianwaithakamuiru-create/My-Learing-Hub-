import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Sliders, Image as ImageIcon, RotateCcw, Sparkles, Check } from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { userProfile, updateUserPreferences } = useAuth();

  const currentOverlay = userProfile?.preferences?.overlayStrength ?? 60;
  const currentBlur = userProfile?.preferences?.backgroundBlur ?? 0;
  const currentAnimation = userProfile?.preferences?.clockAnimation ?? true;
  const currentPos = userProfile?.preferences?.backgroundPosition ?? 'center';

  const [overlay, setOverlay] = useState(currentOverlay);
  const [blur, setBlur] = useState(currentBlur);
  const [animation, setAnimation] = useState(currentAnimation);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    await updateUserPreferences({
      overlayStrength: overlay,
      backgroundBlur: blur,
      clockAnimation: animation,
      backgroundPosition: currentPos,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleRestoreDefault = async () => {
    setOverlay(60);
    setBlur(0);
    setAnimation(true);
    await updateUserPreferences({
      overlayStrength: 60,
      backgroundBlur: 0,
      clockAnimation: true,
      backgroundPosition: 'center',
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="glass-panel rounded-2xl p-6 border border-white/10">
        <div className="flex items-center space-x-2.5 mb-2">
          <Sliders className="w-5 h-5 text-cyan-400" />
          <h2 className="text-2xl font-bold text-white font-heading">
            Library & Visual Settings
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-slate-300">
          Personalize your university library environment, dark glassmorphism depth, and clock animation. Preferences are saved in your Firestore profile.
        </p>
      </div>

      <div className="glass-panel rounded-2xl p-6 border border-white/10 space-y-6">
        {/* Overlay Strength Slider */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="font-semibold text-slate-200">Library Dark Overlay Strength</span>
            <span className="font-mono text-cyan-400">{overlay}%</span>
          </div>
          <input
            id="slider-overlay-strength"
            type="range"
            min="20"
            max="95"
            value={overlay}
            onChange={(e) => setOverlay(Number(e.target.value))}
            className="w-full accent-cyan-400 cursor-pointer"
          />
          <span className="text-[10px] text-slate-400 block">
            Controls the dark translucent academic atmosphere (#020617) over the wooden bookshelves.
          </span>
        </div>

        {/* Blur Slider */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="font-semibold text-slate-200">Library Wallpaper Blur</span>
            <span className="font-mono text-cyan-400">{blur}px</span>
          </div>
          <input
            id="slider-background-blur"
            type="range"
            min="0"
            max="12"
            value={blur}
            onChange={(e) => setBlur(Number(e.target.value))}
            className="w-full accent-cyan-400 cursor-pointer"
          />
          <span className="text-[10px] text-slate-400 block">
            Softens background photography detail to maximize contrast for reading notes and formulas.
          </span>
        </div>

        {/* Clock Motion Toggle */}
        <div className="flex items-center justify-between pt-2 border-t border-white/10">
          <div>
            <span className="text-xs font-semibold text-white block">Clock Orbit Rotation</span>
            <span className="text-[10px] text-slate-400">
              Slow sophisticated mechanical orbital motion (auto-pauses on hover and respects reduced motion).
            </span>
          </div>
          <button
            type="button"
            onClick={() => setAnimation(!animation)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
              animation
                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                : 'bg-slate-900 border-white/10 text-slate-400'
            }`}
          >
            {animation ? 'Enabled' : 'Paused'}
          </button>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-white/10 flex items-center justify-between">
          <button
            id="settings-restore-default-btn"
            type="button"
            onClick={handleRestoreDefault}
            className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs text-slate-400 hover:text-white glass-input cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restore Default Library</span>
          </button>

          <button
            id="settings-save-preferences-btn"
            type="button"
            onClick={handleSave}
            className="inline-flex items-center space-x-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-600 hover:from-cyan-400 text-slate-950 font-semibold text-xs shadow-lg transition-all cursor-pointer"
          >
            {saved ? (
              <>
                <Check className="w-4 h-4 text-slate-950" />
                <span>Saved to Profile</span>
              </>
            ) : (
              <span>Apply & Save to Firestore</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
