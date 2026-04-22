import { observer } from 'mobx-react';
import { useEffect, useRef } from 'react';
import { appStore } from '../store/appStore';
import { generateQuestion } from '../utils/questionGenerator';
import DifficultySelector from './DifficultySelector';

const OP_COLORS: Record<string, string> = {
  addition:       'from-blue-500 to-cyan-500',
  subtraction:    'from-orange-500 to-amber-500',
  multiplication: 'from-purple-500 to-violet-500',
  division:       'from-rose-500 to-pink-500',
};

const OP_BG: Record<string, string> = {
  addition:       'bg-blue-50 dark:bg-blue-950/60',
  subtraction:    'bg-orange-50 dark:bg-orange-950/60',
  multiplication: 'bg-purple-50 dark:bg-purple-950/60',
  division:       'bg-rose-50 dark:bg-rose-950/60',
};

const QuestionCard = observer(() => {
  const { currentQuestion, wrongAnswers, showSuccess, score, questionCount, difficulty, selectedGrade, streak } = appStore;
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (showSuccess) {
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
      successTimerRef.current = setTimeout(() => {
        const newQ = generateQuestion(difficulty, selectedGrade!);
        appStore.nextQuestion(newQ);
      }, 2200);
    }
    return () => { if (successTimerRef.current) clearTimeout(successTimerRef.current); };
  }, [showSuccess, currentQuestion?.id]);

  if (!currentQuestion) return null;

  const { question, answer, options, type, emoji } = currentQuestion;
  const gradientClass = OP_COLORS[type] || 'from-blue-500 to-cyan-500';
  const bgClass = OP_BG[type] || 'bg-blue-50 dark:bg-blue-950/60';
  const accuracy = questionCount > 0 ? Math.round((score / questionCount) * 100) : null;

  const handleAnswer = (option: number) => {
    if (showSuccess || wrongAnswers.includes(option)) return;
    if (option === answer) appStore.markCorrect();
    else appStore.markWrongAnswer(option);
  };

  const handleSkip = () => {
    appStore.skipQuestion(generateQuestion(difficulty, selectedGrade!));
  };

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-2xl">
      {/* Top bar */}
      <div className="flex items-center justify-between w-full gap-4 flex-wrap">
        <button
          onClick={() => appStore.resetSubject()}
          className="flex items-center gap-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-sm font-medium transition-colors"
        >
          ← Back
        </button>
        <div className="flex items-center gap-3">
          {streak >= 3 && (
            <span className="bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-300 text-xs font-bold px-3 py-1 rounded-full border border-orange-300 dark:border-orange-700 animate-bounce">
              🔥 {streak} streak!
            </span>
          )}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow px-4 py-2 flex items-center gap-2 border border-gray-100 dark:border-gray-700">
            <span className="text-yellow-500">⭐</span>
            <span className="font-extrabold text-gray-700 dark:text-gray-200">{score}</span>
            {accuracy !== null && (
              <span className="text-gray-400 dark:text-gray-500 text-xs ml-1">({accuracy}%)</span>
            )}
          </div>
        </div>
        <DifficultySelector />
      </div>

      {/* Success overlay */}
      {showSuccess && (
        <div className="fixed inset-0 flex flex-col items-center justify-center z-50 pointer-events-none">
          <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-3xl shadow-2xl p-10 flex flex-col items-center gap-4 border-4 border-green-400 dark:border-green-500 animate-bounce">
            <div className="text-9xl">✅</div>
            <div className="text-4xl font-extrabold text-green-600 dark:text-green-400">
              {streak >= 5 ? '🏆 Amazing!!' : streak >= 3 ? '🔥 On Fire!' : '🎉 Correct!'}
            </div>
            <div className="text-xl text-gray-600 dark:text-gray-300 font-semibold">
              {answer} is right! Great job! 🌟
            </div>
          </div>
        </div>
      )}

      {/* Question card */}
      <div className={`w-full rounded-3xl shadow-2xl overflow-hidden border-4 border-white dark:border-gray-700 ${bgClass}`}>
        <div className={`bg-gradient-to-r ${gradientClass} px-8 py-5 flex items-center gap-3`}>
          <span className="text-4xl">{emoji}</span>
          <span className="text-white font-bold text-xl opacity-90">
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </span>
        </div>

        <div className="px-8 py-10 flex flex-col items-center gap-8">
          <div className="text-center">
            <p className="text-6xl font-extrabold text-gray-800 dark:text-gray-100 tracking-wide">
              {question}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 w-full max-w-md">
            {options.map((option, idx) => {
              const isWrong = wrongAnswers.includes(option);
              const labels = ['A', 'B', 'C', 'D'];
              return (
                <button
                  key={idx}
                  onClick={() => handleAnswer(option)}
                  disabled={showSuccess || isWrong}
                  className={`
                    relative flex items-center justify-center gap-3 px-6 py-5 rounded-2xl
                    text-2xl font-extrabold transition-all duration-200
                    ${isWrong
                      ? 'bg-red-100 dark:bg-red-900/40 border-2 border-red-300 dark:border-red-700 text-red-400 cursor-not-allowed opacity-70'
                      : showSuccess
                      ? 'opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 text-gray-400'
                      : 'bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:scale-105 hover:shadow-lg hover:border-indigo-300 dark:hover:border-indigo-500 active:scale-95 cursor-pointer shadow-md'
                    }
                  `}
                >
                  <span className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center
                    ${isWrong ? 'bg-red-300 dark:bg-red-700 text-white' : 'bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300'}`}>
                    {labels[idx]}
                  </span>
                  <span className={isWrong ? 'line-through' : ''}>{option}</span>
                  {isWrong && <span className="absolute inset-0 flex items-center justify-center text-3xl">❌</span>}
                </button>
              );
            })}
          </div>

          <button
            onClick={handleSkip}
            disabled={showSuccess}
            className="flex items-center gap-2 text-gray-400 dark:text-gray-500 hover:text-indigo-500 dark:hover:text-indigo-400 text-base font-semibold transition-colors disabled:opacity-40 mt-2"
          >
            <span>Skip this question</span>
            <span>→</span>
          </button>
        </div>
      </div>
    </div>
  );
});

export default QuestionCard;
