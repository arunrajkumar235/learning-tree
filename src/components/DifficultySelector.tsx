import { observer } from 'mobx-react';
import { appStore } from '../store/appStore';
import type { Difficulty } from '../store/appStore';

const levels: { id: Difficulty; label: string; emoji: string; desc: string; color: string; active: string }[] = [
  { id: 'easy', label: 'Easy', emoji: '🌟', desc: '+  −', color: 'bg-green-100 text-green-700 border-green-300', active: 'bg-green-500 text-white border-green-500' },
  { id: 'medium', label: 'Medium', emoji: '⚡', desc: '+  −  ×', color: 'bg-yellow-100 text-yellow-700 border-yellow-300', active: 'bg-yellow-500 text-white border-yellow-500' },
  { id: 'hard', label: 'Hard', emoji: '🔥', desc: '+  −  ×  ÷', color: 'bg-red-100 text-red-700 border-red-300', active: 'bg-red-500 text-white border-red-500' },
];

const DifficultySelector = observer(() => {
  return (
    <div className="flex items-center gap-2 flex-wrap justify-end">
      <span className="text-sm font-semibold text-gray-500 mr-1">Level:</span>
      {levels.map(({ id, label, emoji, color, active }) => (
        <button
          key={id}
          onClick={() => appStore.setDifficulty(id)}
          className={`
            flex items-center gap-1 px-3 py-1.5 rounded-full border-2 font-bold text-sm
            transition-all duration-150 cursor-pointer hover:scale-105 active:scale-95
            ${appStore.difficulty === id ? active : color}
          `}
        >
          <span>{emoji}</span>
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
});

export default DifficultySelector;
