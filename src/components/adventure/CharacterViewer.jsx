import React from 'react';

/**
 * CharacterViewer — displays the child's selected character.
 * Receives a character definition from data/characters.json and
 * renders the sprite with idle animation state.
 */
export default function CharacterViewer({ character, xp = 0, level = 1 }) {
  if (!character) return null;

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Sprite area — swap src for actual sprite sheet */}
      <div className="w-24 h-28 rounded-xl bg-brand-gradient-soft flex items-center justify-center shadow-glow-blue">
        <span className="text-5xl" role="img" aria-label={character.name}>🌿</span>
      </div>

      {/* Name + class tag */}
      <div className="text-center">
        <p className="font-serif font-semibold text-cream-800">{character.name}</p>
        <p className="eyebrow mt-0.5">{character.tag}</p>
      </div>

      {/* XP bar */}
      <div className="w-full max-w-xs">
        <div className="flex justify-between text-xs text-cream-600 font-sans mb-1">
          <span>Level {level}</span>
          <span>{xp} XP</span>
        </div>
        <div className="h-2 bg-cream-300 rounded-full overflow-hidden">
          <div
            className="h-2 bg-brand-gradient rounded-full transition-all"
            style={{ width: `${Math.min((xp % 100), 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
