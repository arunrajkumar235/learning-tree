import { observer } from 'mobx-react';
import { useEffect, useRef, useState } from 'react';
import { appStore, QUIZ_QUESTION_LIMIT, MISTAKE_POINTS } from '../store/appStore';
import { generateAlgebraQuestion } from '../utils/algebraGenerator';

const ALGEBRA_COLORS: Record<string, string> = {
  'algebra-one-step': 'from-sky-500 to-blue-600',
  'algebra-two-step': 'from-blue-500 to-indigo-600',
  'algebra-word':     'from-indigo-500 to-blue-700',
};

const ALGEBRA_BG: Record<string, string> = {
  'algebra-one-step': 'bg-sky-50 dark:bg-sky-950/60',
  'algebra-two-step': 'bg-blue-50 dark:bg-blue-950/60',
  'algebra-word':     'bg-indigo-50 dark:bg-indigo-950/60',
};

const TYPE_LABELS: Record<string, string> = {
  'algebra-one-step': 'Two-Step Equation',
  'algebra-two-step': 'Two-Step Equation',
  'algebra-word':     'Word Problem',
};

const AlgebraCard = observer(() => {
  const {
    currentQuestion,
    wrongAnswers,
    autoEliminatedOptions,
    showSuccess,
    score,
    currentQuestionNumber,
    difficulty,
    streak,
    quizComplete,
    correctCount,
    lastBonusPoints,
  } = appStore;

  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [elapsed, setElapsed] = useState(0);

  // Per-question timer (hidden on hard difficulty)
  useEffect(() => {
    setElapsed(0);
    if (showSuccess || difficulty === 'hard') return;
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - appStore.questionStartTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [currentQuestion?.id, showSuccess, difficulty]);

  // Auto-eliminate a wrong option every 10 seconds (disabled on hard)
  useEffect(() => {
    if (showSuccess || quizComplete || difficulty === 'hard') return;
    const interval = setInterval(() => {
      if (appStore.showSuccess || appStore.quizComplete || !appStore.currentQuestion) return;
      const { options, answer } = appStore.currentQuestion;
      const eliminatable = options.filter(
        opt =>
          opt !== answer &&
          !appStore.wrongAnswers.includes(opt) &&
          !appStore.autoEliminatedOptions.includes(opt)
      );
      if (eliminatable.length > 0) {
        const pick = eliminatable[Math.floor(Math.random() * eliminatable.length)];
        appStore.autoEliminateOption(pick);
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [currentQuestion?.id, showSuccess, quizComplete, difficulty]);

  // Auto-advance after correct answer
  useEffect(() => {
    if (showSuccess) {
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
      successTimerRef.current = setTimeout(() => {
        if (appStore.quizComplete) {
          appStore.clearSuccess();
        } else {
          const newQ = generateAlgebraQuestion(difficulty);
          appStore.nextQuestion(newQ);
        }
      }, 2200);
    }
    return () => {
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
    };
  }, [showSuccess, currentQuestion?.id]);

  if (!currentQuestion) return null;

  const { question, answer, options, type, emoji } = currentQuestion;
  const gradientClass = ALGEBRA_COLORS[type] || 'from-sky-500 to-blue-600';
  const bgClass       = ALGEBRA_BG[type]     || 'bg-sky-50 dark:bg-sky-950/60';
  const typeLabel     = TYPE_LABELS[type]    || 'Linear Equations';
  const accuracy =
    currentQuestionNumber > 1
      ? Math.round((correctCount / (currentQuestionNumber - 1)) * 100)
      : null;
  const timerWarning = elapsed >= 30;

  const handleAnswer = (option: number) => {
    if (showSuccess || wrongAnswers.includes(option) || autoEliminatedOptions.includes(option)) return;
    if (option === answer) appStore.markCorrect();
    else appStore.markWrongAnswer(option);
  };

  const handleSkip = () => {
    appStore.skipQuestion(generateAlgebraQuestion(difficulty));
  };

  const basePoints = MISTAKE_POINTS[wrongAnswers.length + autoEliminatedOptions.length] ?? 0;

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-2xl">
      {/* Top bar */}
      <div className="flex items-center justify-between w-full gap-4 flex-wrap">
        <button
          onClick={() => appStore.resetLesson()}
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
            <span className="font-extrabold text-gray-700 dark:text-gray-200">{score} pts</span>
            {accuracy !== null && (
              <span className="text-gray-400 dark:text-gray-500 text-xs ml-1">({accuracy}%)</span>
            )}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-sm font-bold text-gray-500 dark:text-gray-400">
            Question {currentQuestionNumber} / {QUIZ_QUESTION_LIMIT}
          </span>
          {difficulty !== 'hard' && (
            <span
              className={`text-sm font-bold tabular-nums flex items-center gap-1 ${
                timerWarning
                  ? 'text-red-500 dark:text-red-400 animate-pulse'
                  : 'text-sky-600 dark:text-sky-400'
              }`}
            >
              ⏱️ {elapsed}s
            </span>
          )}
        </div>
        <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-sky-500 to-blue-500 rounded-full transition-all duration-500"
            style={{ width: `${((currentQuestionNumber - 1) / QUIZ_QUESTION_LIMIT) * 100}%` }}
          />
        </div>
      </div>

      {/* Success overlay */}
      {showSuccess && (
        <div className="fixed inset-0 flex flex-col items-center justify-center z-50 pointer-events-none">
          <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-3xl shadow-2xl p-10 flex flex-col items-center gap-3 border-4 border-green-400 dark:border-green-500 animate-bounce">
            <div className="text-9xl">✅</div>
            <div className="text-4xl font-extrabold text-green-600 dark:text-green-400">
              {streak >= 5 ? '🏆 Amazing!!' : streak >= 3 ? '🔥 On Fire!' : '🎉 Correct!'}
            </div>
            <div className="text-xl text-gray-600 dark:text-gray-300 font-semibold">
              x = {answer} is right! Great job! 🌟
            </div>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-2xl font-extrabold text-yellow-500">+{basePoints} pts</span>
              {lastBonusPoints > 0 && (
                <span className="text-xl font-extrabold text-emerald-500 bg-emerald-50 dark:bg-emerald-900/40 px-3 py-1 rounded-full border border-emerald-300 dark:border-emerald-700">
                  ⚡ +{lastBonusPoints} speed bonus!
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Question card */}
      <div className={`w-full rounded-3xl shadow-2xl overflow-hidden border-4 border-white dark:border-gray-700 ${bgClass}`}>
        <div className={`bg-gradient-to-r ${gradientClass} px-8 py-5 flex items-center gap-3`}>
          <span className="text-4xl">{emoji}</span>
          <div>
            <span className="text-white font-bold text-xl opacity-90">{typeLabel}</span>
            <p className="text-white/80 text-sm font-medium mt-0.5">Find the value of x</p>
          </div>
        </div>

        <div className="px-8 py-10 flex flex-col items-center gap-8">
          <div className="text-center">
            <p className="text-3xl font-extrabold text-gray-800 dark:text-gray-100 leading-snug tracking-wide">
              {question}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 w-full max-w-md">
            {options.map((option, idx) => {
              const isWrong = wrongAnswers.includes(option);
              const isHint  = autoEliminatedOptions.includes(option);
              const labels  = ['A', 'B', 'C', 'D'];
              return (
                <button
                  key={idx}
                  onClick={() => handleAnswer(option)}
                  disabled={showSuccess || isWrong || isHint}
                  className={`
                    relative flex items-center justify-center gap-3 px-6 py-5 rounded-2xl
                    text-2xl font-extrabold transition-all duration-200
                    ${isWrong
                      ? 'bg-red-100 dark:bg-red-900/40 border-2 border-red-300 dark:border-red-700 text-red-400 cursor-not-allowed opacity-70'
                      : isHint
                      ? 'bg-gray-100 dark:bg-gray-700/50 border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-300 dark:text-gray-600 cursor-not-allowed opacity-50'
                      : showSuccess
                      ? 'opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 text-gray-400'
                      : 'bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:scale-105 hover:shadow-lg hover:border-sky-300 dark:hover:border-sky-500 active:scale-95 cursor-pointer shadow-md'
                    }
                  `}
                >
                  <span
                    className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center
                    ${isWrong ? 'bg-red-300 dark:bg-red-700 text-white' : isHint ? 'bg-gray-300 dark:bg-gray-600 text-white' : 'bg-sky-100 dark:bg-sky-900 text-sky-600 dark:text-sky-300'}`}
                  >
                    {labels[idx]}
                  </span>
                  <span className={isWrong || isHint ? 'line-through' : ''}>{option}</span>
                  {isWrong && <span className="absolute inset-0 flex items-center justify-center text-3xl">❌</span>}
                  {isHint && <span className="absolute top-1 right-2 text-xs font-bold text-gray-400 dark:text-gray-500">hint</span>}
                </button>
              );
            })}
          </div>

          <button
            onClick={handleSkip}
            disabled={showSuccess}
            className="flex items-center gap-2 text-gray-400 dark:text-gray-500 hover:text-sky-500 dark:hover:text-sky-400 text-base font-semibold transition-colors disabled:opacity-40 mt-2"
          >
            <span>Skip this question</span>
            <span>→</span>
          </button>
        </div>
      </div>
    </div>
  );
});

export default AlgebraCard;
