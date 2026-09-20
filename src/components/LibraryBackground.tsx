import React from 'react';
import { useAuth } from '../context/AuthContext';

interface BackgroundProps {
  children: React.ReactNode;
}

export const LibraryBackground: React.FC<BackgroundProps> = ({ children }) => {
  const { userProfile } = useAuth();
  const prefs = userProfile?.preferences;
  const overlayStrength = (prefs?.overlayStrength ?? 60) / 100;
  const blurVal = prefs?.backgroundBlur ?? 0;
  const bgPos = prefs?.backgroundPosition ?? 'center';

  // High-resolution realistic university library photography
  // Warm wooden shelving, rows of books, deep academic depth, realistic ambient lighting
  const libraryImageUrl =
    'https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?q=80&w=2069&auto=format&fit=crop';

  return (
    <div className="relative min-h-screen w-full bg-[#020617] text-[#F8FAFC] overflow-x-hidden">
      {/* Background Image Layer */}
      <div
        className="fixed inset-0 z-0 bg-cover bg-no-repeat transition-all duration-700 pointer-events-none"
        style={{
          backgroundImage: `url(${libraryImageUrl})`,
          backgroundPosition: bgPos,
          filter: blurVal > 0 ? `blur(${blurVal}px)` : 'none',
        }}
      />

      {/* Realistic University Dark Overlay Layer */}
      <div
        className="fixed inset-0 z-0 pointer-events-none transition-opacity duration-700"
        style={{
          backgroundColor: '#020617',
          opacity: overlayStrength,
        }}
      />

      {/* Atmospheric Academic Vignette & Warm Lamp Glow */}
      <div
        className="fixed inset-0 z-0 pointer-events-none opacity-40 bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.12),transparent_50%),radial-gradient(circle_at_bottom_left,rgba(34,211,238,0.08),transparent_50%)]"
      />

      {/* Interactive Main Foreground Content */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {children}
      </div>
    </div>
  );
};
