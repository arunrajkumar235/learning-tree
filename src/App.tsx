import { observer } from 'mobx-react';
import { useEffect } from 'react';
import { appStore } from './store/appStore';
import GradeSelector from './components/GradeSelector';
import SubjectSelector from './components/SubjectSelector';
import QuestionCard from './components/QuestionCard';
import { generateQuestion } from './utils/questionGenerator';

const App = observer(() => {
  const { selectedGrade, selectedSubject, currentQuestion, difficulty } = appStore;

  useEffect(() => {
    if (selectedSubject && selectedGrade && !currentQuestion) {
      const q = generateQuestion(difficulty, selectedGrade);
      appStore.setQuestion(q);
    }
  }, [selectedSubject, selectedGrade]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 flex flex-col">
      <header className="w-full px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-4xl">🌳</span>
          <span className="text-2xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Learning Tree
          </span>
        </div>
        {selectedGrade && (
          <div className="flex items-center gap-2 bg-white rounded-full px-4 py-1.5 shadow-sm border border-gray-100">
            <span className="text-sm font-semibold text-gray-500">Grade</span>
            <span className="text-sm font-extrabold text-indigo-600">{selectedGrade}</span>
          </div>
        )}
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-8">
        {!selectedGrade && <GradeSelector />}
        {selectedGrade && !selectedSubject && <SubjectSelector />}
        {selectedGrade && selectedSubject && currentQuestion && <QuestionCard />}
      </main>

      <footer className="text-center py-3 text-xs text-gray-400 font-medium">
        Learning Tree — Making math fun! 🎈
      </footer>
    </div>
  );
});

export default App;
