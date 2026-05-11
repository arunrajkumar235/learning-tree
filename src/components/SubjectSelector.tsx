import { observer } from 'mobx-react';
import { appStore } from '../store/appStore';

const subjects = [
  {
    id: 'mathematics',
    label: 'Mathematics',
    emoji: '🔢',
    description: 'Numbers, puzzles & fun!',
    color: 'from-orange-400 to-yellow-500',
    shadow: 'shadow-orange-200 dark:shadow-orange-900',
  },
  {
    id: 'english',
    label: 'English',
    emoji: '📝',
    description: 'Words, spelling & more!',
    color: 'from-sky-400 to-blue-500',
    shadow: 'shadow-sky-200 dark:shadow-sky-900',
  },
  {
    id: 'games',
    label: 'Games',
    emoji: '🎮',
    description: 'Play & have fun!',
    color: 'from-purple-500 to-pink-500',
    shadow: 'shadow-purple-200 dark:shadow-purple-900',
  },
];

const SubjectSelector = observer(() => {
  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-2xl">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-700 dark:text-gray-200 mb-2">Choose a subject! 📚</h2>
        <p className="text-gray-500 dark:text-gray-400 text-lg">What do you want to learn today?</p>
      </div>
      <div className="flex flex-col sm:flex-row gap-6 w-full justify-center">
        {subjects.map(({ id, label, emoji, description, color, shadow }) => (
          <button
            key={id}
            onClick={() => appStore.setSubject(id)}
            className={`
              flex flex-col items-center justify-center gap-3 p-10 rounded-3xl
              bg-gradient-to-br ${color} text-white font-bold text-xl
              shadow-xl ${shadow} hover:scale-105 active:scale-95
              transition-all duration-200 cursor-pointer
              min-w-[200px] border-4 border-white/30
            `}
          >
            <span className="text-7xl">{emoji}</span>
            <span className="text-2xl font-extrabold">{label}</span>
            <span className="text-sm font-medium opacity-90">{description}</span>
          </button>
        ))}
      </div>
    </div>
  );
});

export default SubjectSelector;
