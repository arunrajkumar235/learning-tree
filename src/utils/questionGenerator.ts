import type { Difficulty, Question } from '../store/appStore';

type OpType = 'addition' | 'subtraction' | 'multiplication' | 'division';

const OPERATION_EMOJIS: Record<OpType, string> = {
  addition: '➕',
  subtraction: '➖',
  multiplication: '✖️',
  division: '➗',
};

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRanges(difficulty: Difficulty, grade: number): { min: number; max: number } {
  if (difficulty === 'easy') return { min: 1, max: grade === 3 ? 10 : grade === 4 ? 15 : 20 };
  if (difficulty === 'medium') return { min: 1, max: grade === 3 ? 20 : grade === 4 ? 30 : 50 };
  return { min: 1, max: grade === 3 ? 50 : grade === 4 ? 75 : 100 };
}

function getAvailableOps(difficulty: Difficulty, grade: number): OpType[] {
  if (difficulty === 'easy') return ['addition', 'subtraction'];
  if (difficulty === 'medium') return ['addition', 'subtraction', 'multiplication'];
  return ['addition', 'subtraction', 'multiplication', ...(grade >= 4 ? ['division' as OpType] : [])];
}

function generateWrongOptions(correct: number, count: number): number[] {
  const wrongs = new Set<number>();
  let attempts = 0;
  while (wrongs.size < count && attempts < 100) {
    attempts++;
    const offset = rand(1, Math.max(10, Math.floor(Math.abs(correct) * 0.5) + 5));
    const sign = Math.random() > 0.5 ? 1 : -1;
    const candidate = correct + sign * offset;
    if (candidate !== correct && candidate >= 0) {
      wrongs.add(candidate);
    }
  }
  // Fill remaining if needed
  let fallback = correct + 1;
  while (wrongs.size < count) {
    if (fallback !== correct) wrongs.add(fallback);
    fallback++;
  }
  return Array.from(wrongs);
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function generateQuestion(difficulty: Difficulty, grade: number): Question {
  const { min, max } = getRanges(difficulty, grade);
  const ops = getAvailableOps(difficulty, grade);
  const opType = ops[rand(0, ops.length - 1)];

  let a: number, b: number, answer: number, questionStr: string;

  switch (opType) {
    case 'addition':
      a = rand(min, max);
      b = rand(min, max);
      answer = a + b;
      questionStr = `${a} + ${b} = ?`;
      break;
    case 'subtraction':
      a = rand(min, max);
      b = rand(1, a);
      answer = a - b;
      questionStr = `${a} - ${b} = ?`;
      break;
    case 'multiplication': {
      const mulMax = difficulty === 'easy' ? 5 : difficulty === 'medium' ? 10 : 12;
      a = rand(1, mulMax);
      b = rand(1, mulMax);
      answer = a * b;
      questionStr = `${a} × ${b} = ?`;
      break;
    }
    case 'division': {
      b = rand(2, difficulty === 'medium' ? 10 : 12);
      answer = rand(1, difficulty === 'medium' ? 10 : 12);
      a = b * answer;
      questionStr = `${a} ÷ ${b} = ?`;
      break;
    }
    default:
      a = rand(min, max);
      b = rand(min, max);
      answer = a + b;
      questionStr = `${a} + ${b} = ?`;
  }

  const wrongOptions = generateWrongOptions(answer, 3);
  const options = shuffle([answer, ...wrongOptions]);

  return {
    id: `${Date.now()}-${Math.random()}`,
    question: questionStr,
    answer,
    options,
    type: opType,
    emoji: OPERATION_EMOJIS[opType],
  };
}
