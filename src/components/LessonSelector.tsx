import { observer } from 'mobx-react';
import { appStore } from '../store/appStore';
import type { Difficulty } from '../store/appStore';

interface LessonDifficulty {
  id: Difficulty;
  label: string;
  emoji: string;
  color: string;
  shadow: string;
  ops: string;
  numbers: string;
  tables?: string;
}

const ARITHMETIC_LEVELS: LessonDifficulty[] = [
  {
    id: 'easy',
    label: 'Easy',
    emoji: '🌟',
    color: 'from-green-400 to-emerald-500',
    shadow: 'shadow-green-200 dark:shadow-green-900',
    ops: '+ −',
    numbers: 'Numbers 1–20',
  },
  {
    id: 'medium',
    label: 'Medium',
    emoji: '⚡',
    color: 'from-yellow-400 to-orange-500',
    shadow: 'shadow-yellow-200 dark:shadow-yellow-900',
    ops: '+ − × ÷',
    numbers: 'Numbers 20–50',
    tables: 'Tables 1–6, 10 & 11',
  },
  {
    id: 'hard',
    label: 'Hard',
    emoji: '🔥',
    color: 'from-red-400 to-rose-600',
    shadow: 'shadow-red-200 dark:shadow-red-900',
    ops: '+ − × ÷',
    numbers: 'Numbers 50–100',
    tables: 'Tables 4–12',
  },
];

const LESSONS: Record<string, { label: string; emoji: string; description: string }> = {
  mathematics: {
    label: 'Arithmetic',
    emoji: '🔢',
    description: 'Addition, Subtraction, Multiplication & Division',
  },
};

const LessonSelector = observer(() => {
  const subject = appStore.selectedSubject!;
  const lesson = LESSONS[subject];

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-2xl">
      {/* Lesson header */}
      <div className="text-center">
        <div className="text-6xl mb-3">{lesson.emoji}</div>
        <h2 className="text-3xl font-bold text-gray-700 dark:text-gray-200 mb-1">{lesson.label}</h2>
        <p className="text-gray-500 dark:text-gray-400 text-base">{lesson.description}</p>
      </div>

      <p className="text-lg font-semibold text-gray-600 dark:text-gray-300">Pick your level to start! 🎯</p>

      {/* Difficulty cards */}
      <div className="flex flex-col sm:flex-row gap-5 w-full justify-center">
        {ARITHMETIC_LEVELS.map(({ id, label, emoji, color, shadow, ops, numbers, tables }) => (
          <button
            key={id}
            onClick={() => appStore.setLesson('arithmetic', id)}
            className={`
              flex flex-col items-center gap-3 p-7 rounded-3xl
              bg-gradient-to-br ${color} text-white font-bold
              shadow-xl ${shadow} hover:scale-105 active:scale-95
              transition-all duration-200 cursor-pointer
              flex-1 border-4 border-white/30 min-w-[160px]
            `}
          >
            <span className="text-5xl">{emoji}</span>
            <span className="text-2xl font-extrabold">{label}</span>
            <div className="text-sm font-semibold bg-black/15 rounded-xl px-3 py-1.5 text-center leading-relaxed">
              <div className="text-base font-extrabold tracking-wide">{ops}</div>
              <div className="opacity-90">{numbers}</div>
              {tables && <div className="opacity-90">{tables}</div>}
            </div>
          </button>
        ))}
      </div>

      <button
        onClick={() => appStore.resetSubject()}
        className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-base font-medium transition-colors mt-2"
      >
        ← Back to subjects
      </button>
    </div>
  );
});

export default LessonSelector;
