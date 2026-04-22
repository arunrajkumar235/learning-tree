import { observer } from 'mobx-react';
import { useEffect } from 'react';
import { appStore } from './store/appStore';
import GradeSelector from './components/GradeSelector';
import SubjectSelector from './components/SubjectSelector';
import QuestionCard from './components/QuestionCard';
import QuizComplete from './components/QuizComplete';
import { generateQuestion } from './utils/questionGenerator';

const App = observer(() => {
  const { selectedGrade, selectedSubject, currentQuestion, difficulty, isDarkMode, quizComplete, showSuccess } = appStore;

  useEffect(() => {
    if (selectedSubject && selectedGrade && !currentQuestion && !quizComplete) {
      const q = generateQuestion(difficulty, selectedGrade);
      appStore.setQuestion(q);
    }
  }, [selectedSubject, selectedGrade]);

  const showResults = quizComplete && !showSuccess;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 dark:from-gray-950 dark:via-indigo-950 dark:to-purple-950 flex flex-col transition-colors duration-300">
      {/* Header */}
      <header className="w-full px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-4xl">🌳</span>
          <span className="text-2xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
            Learning Tree
          </span>
        </div>
        <div className="flex items-center gap-3">
          {selectedGrade && (
            <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-full px-4 py-1.5 shadow-sm border border-gray-100 dark:border-gray-700">
              <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">Grade</span>
              <span className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400">{selectedGrade}</span>
            </div>
          )}
          {/* Dark mode toggle */}
          <button
            onClick={() => appStore.toggleDarkMode()}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer"
            title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            <span className="text-xl">{isDarkMode ? '☀️' : '🌙'}</span>
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        {!selectedGrade && <GradeSelector />}
        {selectedGrade && !selectedSubject && <SubjectSelector />}
        {selectedGrade && selectedSubject && showResults && <QuizComplete />}
        {selectedGrade && selectedSubject && currentQuestion && !showResults && <QuestionCard />}
      </main>

      <footer className="text-center py-3 text-xs text-gray-400 dark:text-gray-600 font-medium">
        Learning Tree — Making math fun! 🎈
      </footer>
    </div>
  );
});

export default App;
