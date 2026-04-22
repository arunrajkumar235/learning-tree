import { observer } from 'mobx-react';
import { appStore, QUIZ_QUESTION_LIMIT, MAX_SCORE, MISTAKE_POINTS } from '../store/appStore';
import { generateQuestion } from '../utils/questionGenerator';

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

function getStars(score: number): string {
  if (score >= 90) return '⭐⭐⭐';
  if (score >= 70) return '⭐⭐';
  if (score >= 50) return '⭐';
  return '💪';
}

function getFeedback(score: number): string {
  if (score >= 90) return "Outstanding! You're a math superstar! 🏆";
  if (score >= 70) return 'Great job! Keep it up! 🎉';
  if (score >= 50) return 'Good effort! Practice makes perfect! 💪';
  return "Keep trying! You'll get better! 🌱";
}

const QuizComplete = observer(() => {
  const { score, correctCount, totalTimeSpent, difficulty, selectedGrade } = appStore;
  const accuracy = Math.round((correctCount / QUIZ_QUESTION_LIMIT) * 100);

  const handlePlayAgain = () => {
    const q = generateQuestion(difficulty, selectedGrade!);
    appStore.restartQuiz(q);
  };

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-lg animate-in fade-in">
      {/* Header */}
      <div className="text-center">
        <div className="text-7xl mb-4">🎓</div>
        <h1 className="text-4xl font-extrabold text-gray-800 dark:text-gray-100">Quiz Complete!</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2 text-lg">Here's how you did</p>
      </div>

      {/* Score card */}
      <div className="w-full bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border-4 border-indigo-200 dark:border-indigo-800 p-8">
        {/* Stars + feedback */}
        <div className="text-center mb-6">
          <div className="text-5xl">{getStars(score)}</div>
          <p className="text-lg font-bold text-gray-600 dark:text-gray-300 mt-3">{getFeedback(score)}</p>
        </div>

        {/* Total score — prominent */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-5 text-center mb-4">
          <div className="text-6xl font-extrabold text-white">
            {score}
            <span className="text-3xl font-bold text-indigo-200"> / {MAX_SCORE}</span>
          </div>
          <div className="text-indigo-100 font-semibold mt-1">Total Points</div>
        </div>

        {/* Scoring legend */}
        <div className="flex justify-around text-center mb-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
          <div>
            <div className="text-lg font-extrabold text-gray-700 dark:text-gray-200">{MISTAKE_POINTS[0]} pts</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">No mistakes</div>
          </div>
          <div className="border-l border-gray-200 dark:border-gray-600" />
          <div>
            <div className="text-lg font-extrabold text-gray-700 dark:text-gray-200">{MISTAKE_POINTS[1]} pts</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">1 mistake</div>
          </div>
          <div className="border-l border-gray-200 dark:border-gray-600" />
          <div>
            <div className="text-lg font-extrabold text-gray-700 dark:text-gray-200">{MISTAKE_POINTS[2]} pts</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">2 mistakes</div>
          </div>
          <div className="border-l border-gray-200 dark:border-gray-600" />
          <div>
            <div className="text-lg font-extrabold text-gray-700 dark:text-gray-200">0 pts</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">3+ mistakes</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-green-50 dark:bg-green-950/50 rounded-2xl p-4 text-center">
            <div className="text-4xl font-extrabold text-green-600 dark:text-green-400">
              {correctCount}<span className="text-xl text-green-400 dark:text-green-600">/{QUIZ_QUESTION_LIMIT}</span>
            </div>
            <div className="text-sm font-semibold text-gray-500 dark:text-gray-400 mt-1">Correct</div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950/50 rounded-2xl p-4 text-center">
            <div className="text-4xl font-extrabold text-blue-600 dark:text-blue-400">{accuracy}%</div>
            <div className="text-sm font-semibold text-gray-500 dark:text-gray-400 mt-1">Accuracy</div>
          </div>

          <div className="bg-orange-50 dark:bg-orange-950/50 rounded-2xl p-4 text-center col-span-2">
            <div className="text-4xl font-extrabold text-orange-500 dark:text-orange-400">
              ⏱️ {formatTime(totalTimeSpent)}
            </div>
            <div className="text-sm font-semibold text-gray-500 dark:text-gray-400 mt-1">
              Total time for all {QUIZ_QUESTION_LIMIT} questions
            </div>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-4 w-full">
        <button
          onClick={handlePlayAgain}
          className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-extrabold text-xl py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer"
        >
          🔄 Play Again
        </button>
        <button
          onClick={() => appStore.resetSubject()}
          className="flex-1 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-extrabold text-xl py-4 rounded-2xl shadow hover:shadow-md transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer"
        >
          📚 Change Subject
        </button>
      </div>
    </div>
  );
});

export default QuizComplete;
