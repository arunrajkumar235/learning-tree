import { observer } from 'mobx-react';
import { useEffect, useRef, useState } from 'react';
import { appStore, QUIZ_QUESTION_LIMIT, MISTAKE_POINTS } from '../store/appStore';
import { generateSpellingQuestion } from '../utils/wordList';

const SpellingCard = observer(() => {
  const {
    currentSpellingWord,
    difficulty,
    currentQuestionNumber,
    score,
    streak,
    showSuccess,
    lastBonusPoints,
    correctCount,
  } = appStore;

  const [filledBlanks, setFilledBlanks] = useState<string[]>([]);
  const [wrongFlashIdx, setWrongFlashIdx] = useState<number | null>(null);
  const [wrongCount, setWrongCount] = useState(0);
  const [hintIdx, setHintIdx] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const word = currentSpellingWord!;

  // Reset local state on each new word
  useEffect(() => {
    setFilledBlanks([]);
    setWrongCount(0);
    setWrongFlashIdx(null);
    setHintIdx(null);
    setElapsed(0);
  }, [word?.id]);

  // Per-question timer
  useEffect(() => {
    if (showSuccess) return;
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - appStore.questionStartTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [word?.id, showSuccess]);

  // Auto-hint: gray out one distractor letter after 15 seconds of no progress
  useEffect(() => {
    if (showSuccess || hintIdx !== null) return;
    const timer = setTimeout(() => {
      const candidates = word.letterBoard
        .map((letter, idx) => ({ letter, idx }))
        .filter(({ letter }) => !word.missingLetters.includes(letter));
      if (candidates.length > 0) {
        setHintIdx(candidates[Math.floor(Math.random() * candidates.length)].idx);
      }
    }, 15000);
    return () => clearTimeout(timer);
  }, [word?.id, showSuccess, filledBlanks.length]);

  // Auto-advance after success overlay
  useEffect(() => {
    if (showSuccess) {
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
      successTimerRef.current = setTimeout(() => {
        if (appStore.quizComplete) {
          appStore.clearSuccess();
        } else {
          appStore.nextSpellingWord(generateSpellingQuestion(difficulty));
        }
      }, 2200);
    }
    return () => { if (successTimerRef.current) clearTimeout(successTimerRef.current); };
  }, [showSuccess, word?.id]);

  if (!word) return null;

  const currentBlankIdx = filledBlanks.length;
  const allFilled = currentBlankIdx >= word.missingIndices.length;
  const accuracy = currentQuestionNumber > 1
    ? Math.round((correctCount / (currentQuestionNumber - 1)) * 100)
    : null;
  const timerWarning = elapsed >= 30;

  const handleLetterClick = (letter: string, boardIdx: number) => {
    if (allFilled || showSuccess) return;
    const correctLetter = word.missingLetters[currentBlankIdx];
    if (letter === correctLetter) {
      const newFilled = [...filledBlanks, letter];
      setFilledBlanks(newFilled);
      setHintIdx(null);
      if (newFilled.length >= word.missingIndices.length) {
        appStore.markWordComplete(wrongCount);
      }
    } else {
      setWrongFlashIdx(boardIdx);
      setWrongCount(c => c + 1);
      setTimeout(() => setWrongFlashIdx(null), 500);
    }
  };

  const handleSkip = () => {
    appStore.skipSpellingWord(generateSpellingQuestion(difficulty));
  };

  // Build the display boxes for each letter in the word
  const displayLetters = word.word.split('').map((letter, i) => {
    const blankPos = word.missingIndices.indexOf(i);
    if (blankPos === -1) return { letter: letter.toUpperCase(), type: 'shown' as const };
    if (blankPos < filledBlanks.length) return { letter: filledBlanks[blankPos].toUpperCase(), type: 'filled' as const };
    if (blankPos === currentBlankIdx) return { letter: '', type: 'current' as const };
    return { letter: '', type: 'blank' as const };
  });

  const basePoints = MISTAKE_POINTS[wrongCount] ?? 0;

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
            Word {currentQuestionNumber} / {QUIZ_QUESTION_LIMIT}
          </span>
          <span className={`text-sm font-bold tabular-nums flex items-center gap-1 ${timerWarning ? 'text-red-500 dark:text-red-400 animate-pulse' : 'text-indigo-600 dark:text-indigo-400'}`}>
            ⏱️ {elapsed}s
          </span>
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
              <span className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
                {word.word}
              </span>
              {' '}is right! 🌟
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

      {/* Spelling card */}
      <div className="w-full rounded-3xl shadow-2xl overflow-hidden border-4 border-white dark:border-gray-700 bg-sky-50 dark:bg-sky-950/60">
        <div className="bg-gradient-to-r from-sky-500 to-blue-500 px-8 py-5 flex items-center gap-3">
          <span className="text-4xl">🔤</span>
          <span className="text-white font-bold text-xl opacity-90">Spellings</span>
        </div>

        <div className="px-6 py-8 flex flex-col items-center gap-8">
          {/* Instruction */}
          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
            Tap the missing letters in order ✨
          </p>

          {/* Word display */}
          <div className="flex items-center gap-2 flex-wrap justify-center">
            {displayLetters.map(({ letter, type }, i) => {
              const isCurrent = type === 'current';
              const isFilled = type === 'filled';
              const isShown = type === 'shown';
              return (
                <div
                  key={i}
                  className={`
                    w-12 h-14 sm:w-14 sm:h-16 rounded-xl flex items-center justify-center
                    text-2xl sm:text-3xl font-extrabold border-3 transition-all duration-200
                    ${isShown
                      ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 shadow-md'
                      : isFilled
                      ? 'bg-green-100 dark:bg-green-900/50 border-green-400 dark:border-green-500 text-green-700 dark:text-green-300 shadow-md'
                      : isCurrent
                      ? 'bg-indigo-100 dark:bg-indigo-900/50 border-indigo-400 dark:border-indigo-400 text-indigo-400 shadow-lg animate-pulse border-dashed'
                      : 'bg-gray-100 dark:bg-gray-800/50 border-gray-300 dark:border-gray-600 text-gray-300 border-dashed'
                    }
                  `}
                  style={{ border: '3px solid' }}
                >
                  {isCurrent ? '?' : letter}
                </div>
              );
            })}
          </div>

          {/* Hint text */}
          {wrongCount > 0 && !showSuccess && (
            <div className="text-sm text-red-400 dark:text-red-300 font-medium">
              {wrongCount} wrong {wrongCount === 1 ? 'tap' : 'taps'} — keep going! 💪
            </div>
          )}

          {/* Letter board */}
          <div className="flex flex-wrap gap-3 justify-center max-w-sm">
            {word.letterBoard.map((letter, boardIdx) => {
              const isHint = boardIdx === hintIdx;
              const isFlashing = boardIdx === wrongFlashIdx;
              return (
                <button
                  key={boardIdx}
                  onClick={() => handleLetterClick(letter, boardIdx)}
                  disabled={showSuccess || isHint || allFilled}
                  className={`
                    w-12 h-12 sm:w-14 sm:h-14 rounded-2xl
                    text-xl sm:text-2xl font-extrabold uppercase
                    transition-all duration-150 shadow-md border-2
                    ${isFlashing
                      ? 'bg-red-400 dark:bg-red-600 border-red-500 dark:border-red-400 text-white scale-90'
                      : isHint
                      ? 'bg-gray-100 dark:bg-gray-700/50 border-dashed border-gray-300 dark:border-gray-600 text-gray-300 dark:text-gray-600 cursor-not-allowed opacity-40'
                      : showSuccess || allFilled
                      ? 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-300 cursor-not-allowed opacity-50'
                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:scale-110 hover:shadow-lg hover:border-sky-400 dark:hover:border-sky-500 active:scale-95 cursor-pointer'
                    }
                  `}
                >
                  {letter.toUpperCase()}
                  {isHint && <span className="block text-xs font-bold text-gray-400">hint</span>}
                </button>
              );
            })}
          </div>

          <button
            onClick={handleSkip}
            disabled={showSuccess}
            className="flex items-center gap-2 text-gray-400 dark:text-gray-500 hover:text-sky-500 dark:hover:text-sky-400 text-base font-semibold transition-colors disabled:opacity-40 mt-2"
          >
            <span>Skip this word</span>
            <span>→</span>
          </button>
        </div>
      </div>
    </div>
  );
});

export default SpellingCard;
