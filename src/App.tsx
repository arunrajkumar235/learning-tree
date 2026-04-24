import { observer } from 'mobx-react';
import { useEffect } from 'react';
import { appStore } from './store/appStore';
import SubjectSelector from './components/SubjectSelector';
import LessonSelector from './components/LessonSelector';
import QuestionCard from './components/QuestionCard';
import QuizComplete from './components/QuizComplete';
import { generateQuestion } from './utils/questionGenerator';

const App = observer(() => {
  const { selectedSubject, selectedLesson, currentQuestion, difficulty, isDarkMode, quizComplete, showSuccess } = appStore;

  useEffect(() => {
    if (selectedSubject && selectedLesson && !currentQuestion && !quizComplete) {
      const q = generateQuestion(difficulty);
      appStore.setQuestion(q);
    }
  }, [selectedSubject, selectedLesson, difficulty]);

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
        {/* Dark mode toggle */}
        <button
          onClick={() => appStore.toggleDarkMode()}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer"
          title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          <span className="text-xl">{isDarkMode ? '☀️' : '🌙'}</span>
        </button>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        {!selectedSubject && <SubjectSelector />}
        {selectedSubject && !selectedLesson && <LessonSelector />}
        {selectedSubject && selectedLesson && showResults && <QuizComplete />}
        {selectedSubject && selectedLesson && currentQuestion && !showResults && <QuestionCard />}
      </main>

      <footer className="text-center py-3 text-xs text-gray-400 dark:text-gray-600 font-medium">
        Learning Tree — Making math fun! 🎈
      </footer>
    </div>
  );
});

export default App;
