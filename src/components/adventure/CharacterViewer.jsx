import React from 'react';
import { motion } from 'framer-motion';

// Import character assets
import Scout    from '../../assets/characters/The Scout.png';
import Voyager  from '../../assets/characters/The Voyager.png';
import Warden   from '../../assets/characters/The Warden.png';
import Gardener from '../../assets/characters/The Gardener.png';
import Dreamer  from '../../assets/characters/The Dreamer.png';
import Weaver   from '../../assets/characters/The Weaver.png';
import Anchor   from '../../assets/characters/The Anchor.png';
import Sage     from '../../assets/characters/The Sage.png';

const characterMap = {
  scout:    Scout,
  voyager:  Voyager,
  warden:   Warden,
  gardener: Gardener,
  dreamer:  Dreamer,
  weaver:   Weaver,
  anchor:   Anchor,
  sage:     Sage,
};

const CharacterViewer = ({ characterId }) => {
  const CharacterAsset = characterMap[characterId];

  if (!CharacterAsset) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="flex justify-center items-center p-10"
    >
      <img
        src={CharacterAsset}
        alt={characterId}
        className="w-full max-w-sm h-auto drop-shadow-lg"
      />
    </motion.div>
  );
};

export default CharacterViewer;
