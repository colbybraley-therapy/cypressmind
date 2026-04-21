import React from 'react';
import { motion } from 'framer-motion';

// Import character assets (or map them to a URL/Path)
import Scout from '../../assets/characters/the-scout.svg';
import Voyager from '../../assets/characters/the-voyager.svg';

const characterMap = {
  scout: Scout,
  voyager: Voyager,
  // Add others as you import them
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
