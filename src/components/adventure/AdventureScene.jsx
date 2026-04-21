import React from 'react';

/**
 * AdventureScene — full-bleed 2D scene container.
 * Wraps the active landscape background and layers character,
 * quest UI, and emotional path elements on top.
 *
 * Props:
 *   scene     — 'forest' | 'cave' | 'meadow'
 *   children  — overlaid UI layers (character, prompts, badges)
 */

const SCENE_GRADIENTS = {
  forest:  'from-green-800 to-green-500',
  cave:    'from-cream-900 to-blue-900',
  meadow:  'from-blue-500 to-purple-500',
};

export default function AdventureScene({ scene = 'meadow', children }) {
  const gradient = SCENE_GRADIENTS[scene] ?? SCENE_GRADIENTS.meadow;

  return (
    <div className={`scene-canvas bg-gradient-to-b ${gradient}`}>
      {/* Background landscape art goes here — swap for layered SVG/PNG */}
      <div className="absolute inset-0 opacity-20 pointer-events-none" aria-hidden>
        {/* parallax background layer placeholder */}
      </div>

      {/* Foreground content */}
      <div className="relative z-10 flex flex-col items-center justify-end h-full pb-10 px-6 gap-6">
        {children}
      </div>
    </div>
  );
}
