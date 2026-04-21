import React, { useState } from 'react';

/**
 * EmotionalPaths — emotion selection and coping-strategy display.
 * Used in the Emotion Explorer activity. Child selects an emotion;
 * component surfaces matched coping strategies and logs the choice.
 */

const EMOTIONS = [
  { id: 'happy',   label: 'Happy',   emoji: '😊', color: 'bg-blue-100   text-blue-700'  },
  { id: 'calm',    label: 'Calm',    emoji: '😌', color: 'bg-green-100  text-green-700' },
  { id: 'anxious', label: 'Anxious', emoji: '😰', color: 'bg-purple-100 text-purple-700'},
  { id: 'angry',   label: 'Angry',   emoji: '😠', color: 'bg-cream-200  text-cream-800' },
  { id: 'sad',     label: 'Sad',     emoji: '😢', color: 'bg-blue-50    text-blue-600'  },
  { id: 'scared',  label: 'Scared',  emoji: '😨', color: 'bg-purple-50  text-purple-600'},
];

export default function EmotionalPaths({ onEmotionSelect }) {
  const [selected, setSelected] = useState(null);

  function handleSelect(emotion) {
    setSelected(emotion.id);
    onEmotionSelect?.(emotion);
  }

  return (
    <div className="w-full max-w-sm space-y-4">
      <p className="eyebrow text-center text-white">How are you feeling?</p>

      <div className="grid grid-cols-3 gap-3">
        {EMOTIONS.map(emotion => (
          <button
            key={emotion.id}
            onClick={() => handleSelect(emotion)}
            className={`
              flex flex-col items-center gap-1 p-3 rounded-lg font-sans text-sm font-medium
              border-2 transition-all
              ${selected === emotion.id
                ? 'border-blue-400 scale-105 shadow-glow-blue ' + emotion.color
                : 'border-transparent bg-white/10 text-white hover:bg-white/20'}
            `}
          >
            <span className="text-2xl">{emotion.emoji}</span>
            <span>{emotion.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
