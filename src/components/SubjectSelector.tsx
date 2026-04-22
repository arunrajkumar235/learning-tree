import { observer } from 'mobx-react-lite';
import { getStore, setSubject, resetGrade } from '../store/appStore';

const subjects = [
  {
    id: 'mathematics',
    label: 'Mathematics',
    emoji: '🔢',
    description: 'Numbers, puzzles & fun!',
    color: 'from-orange-400 to-yellow-500',
    shadow: 'shadow-orange-200',
  },
];

const SubjectSelector = observer(() => {
  const { selectedGrade } = getStore();

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-2xl">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-700 mb-2">
          Choose a subject! 📚
        </h2>
        <p className="text-gray-500 text-lg">Grade {selectedGrade} — what do you want to learn?</p>
      </div>
      <div className="flex flex-col sm:flex-row gap-6 w-full justify-center">
        {subjects.map(({ id, label, emoji, description, color, shadow }) => (
          <button
            key={id}
            onClick={() => setSubject({ subject: id })}
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
      <button
        onClick={() => resetGrade()}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-base font-medium transition-colors mt-2"
      >
        ← Back to grades
      </button>
    </div>
  );
});

export default SubjectSelector;
