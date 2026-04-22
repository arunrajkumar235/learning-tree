import { observer } from 'mobx-react';
import { appStore } from '../store/appStore';
import type { Difficulty } from '../store/appStore';

const levels: { id: Difficulty; label: string; emoji: string; color: string; active: string }[] = [
  { id: 'easy',   label: 'Easy',   emoji: '🌟', color: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700',  active: 'bg-green-500 dark:bg-green-600 text-white border-green-500 dark:border-green-600' },
  { id: 'medium', label: 'Medium', emoji: '⚡', color: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700', active: 'bg-yellow-500 dark:bg-yellow-600 text-white border-yellow-500 dark:border-yellow-600' },
  { id: 'hard',   label: 'Hard',   emoji: '🔥', color: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700',    active: 'bg-red-500 dark:bg-red-600 text-white border-red-500 dark:border-red-600' },
];

const DifficultySelector = observer(() => {
  return (
    <div className="flex items-center gap-2 flex-wrap justify-end">
      <span className="text-sm font-semibold text-gray-500 dark:text-gray-400 mr-1">Level:</span>
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
