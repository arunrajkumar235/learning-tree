import { observer } from 'mobx-react';
import { appStore } from '../store/appStore';

const grades = [
  { grade: 3, emoji: '🌱', label: 'Grade 3', color: 'from-green-400 to-emerald-500', shadow: 'shadow-green-200' },
  { grade: 4, emoji: '🌿', label: 'Grade 4', color: 'from-blue-400 to-cyan-500', shadow: 'shadow-blue-200' },
  { grade: 5, emoji: '🌳', label: 'Grade 5', color: 'from-purple-400 to-violet-500', shadow: 'shadow-purple-200' },
];

const GradeSelector = observer(() => {
  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-2xl">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-700 mb-2">Which grade are you in? 🎒</h2>
        <p className="text-gray-500 text-lg">Pick your grade to get started!</p>
      </div>
      <div className="flex flex-col sm:flex-row gap-6 w-full justify-center">
        {grades.map(({ grade, emoji, label, color, shadow }) => (
          <button
            key={grade}
            onClick={() => appStore.setGrade(grade)}
            className={`
              flex flex-col items-center justify-center gap-3 p-8 rounded-3xl
              bg-gradient-to-br ${color} text-white font-bold text-xl
              shadow-xl ${shadow} hover:scale-105 active:scale-95
              transition-all duration-200 cursor-pointer
              min-w-[160px] border-4 border-white/30
            `}
          >
            <span className="text-6xl">{emoji}</span>
            <span className="text-2xl font-extrabold">{label}</span>
            <span className="text-sm font-medium opacity-80">Tap to pick!</span>
          </button>
        ))}
      </div>
    </div>
  );
});

export default GradeSelector;
