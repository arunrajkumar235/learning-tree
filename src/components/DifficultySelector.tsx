import { observer } from 'mobx-react';
import { useState } from 'react';
import { appStore } from '../store/appStore';
import type { Difficulty } from '../store/appStore';

const levels: { id: Difficulty; label: string; emoji: string; color: string; active: string }[] = [
  { id: 'easy',   label: 'Easy',   emoji: '🌟', color: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700',  active: 'bg-green-500 dark:bg-green-600 text-white border-green-500 dark:border-green-600' },
  { id: 'medium', label: 'Medium', emoji: '⚡', color: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700', active: 'bg-yellow-500 dark:bg-yellow-600 text-white border-yellow-500 dark:border-yellow-600' },
  { id: 'hard',   label: 'Hard',   emoji: '🔥', color: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700',    active: 'bg-red-500 dark:bg-red-600 text-white border-red-500 dark:border-red-600' },
];

const CRITERIA: Record<number, Record<Difficulty, { ops: string; range: string; extra?: string }>> = {
  3: {
    easy:   { ops: '+ −', range: '1–10' },
    medium: { ops: '+ − ×', range: '1–20', extra: 'multiply up to 10×10' },
    hard:   { ops: '+ − ×', range: '1–50', extra: 'multiply up to 12×12' },
  },
  4: {
    easy:   { ops: '+ −', range: '1–15' },
    medium: { ops: '+ − ×', range: '1–30', extra: 'multiply up to 10×10' },
    hard:   { ops: '+ − × ÷', range: '1–75', extra: 'multiply/divide up to 12×12' },
  },
  5: {
    easy:   { ops: '+ −', range: '1–20' },
    medium: { ops: '+ − ×', range: '1–50', extra: 'multiply up to 10×10' },
    hard:   { ops: '+ − × ÷', range: '1–100', extra: 'multiply/divide up to 12×12' },
  },
};

const DifficultySelector = observer(() => {
  const [showInfo, setShowInfo] = useState(false);
  const grade = appStore.selectedGrade;
  const gradeCriteria = grade ? CRITERIA[grade] : null;

  return (
    <div className="flex flex-col items-end gap-2">
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
        <button
          onClick={() => setShowInfo(v => !v)}
          className="w-7 h-7 flex items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-700 text-sm font-bold hover:scale-110 transition-all cursor-pointer"
          title="Show difficulty criteria"
        >
          ℹ
        </button>
      </div>

      {showInfo && gradeCriteria && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-4 text-left w-72 z-10">
          <p className="text-xs font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
            Grade {grade} — Difficulty Criteria
          </p>
          {levels.map(({ id, emoji, label }) => {
            const c = gradeCriteria[id];
            return (
              <div key={id} className="flex items-start gap-2 mb-2 last:mb-0">
                <span className="text-base mt-0.5">{emoji}</span>
                <div>
                  <span className="font-bold text-sm text-gray-700 dark:text-gray-200">{label}: </span>
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    {c.ops} · numbers {c.range}
                    {c.extra && <span className="text-gray-400 dark:text-gray-500"> · {c.extra}</span>}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});

export default DifficultySelector;
