import type { Difficulty, Question } from '../store/appStore';

type OpType = 'addition' | 'subtraction' | 'multiplication' | 'division';

const OPERATION_EMOJIS: Record<OpType, string> = {
  addition: '➕',
  subtraction: '➖',
  multiplication: '✖️',
  division: '➗',
};

// Medium: tables 1–6, 10, 11. Hard: tables 4–12.
const MEDIUM_TABLES = [1, 2, 3, 4, 5, 6, 10, 11];
const HARD_TABLES = [4, 5, 6, 7, 8, 9, 10, 11, 12];

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickFrom(arr: number[]): number {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getAvailableOps(difficulty: Difficulty): OpType[] {
  if (difficulty === 'easy') return ['addition', 'subtraction'];
  return ['addition', 'subtraction', 'multiplication', 'division'];
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

export function generateQuestion(difficulty: Difficulty): Question {
  const ops = getAvailableOps(difficulty);
  const opType = ops[rand(0, ops.length - 1)];

  let a: number, b: number, answer: number, questionStr: string;

  switch (opType) {
    case 'addition': {
      const min = difficulty === 'easy' ? 1 : difficulty === 'medium' ? 20 : 50;
      const max = difficulty === 'easy' ? 20 : difficulty === 'medium' ? 50 : 100;
      a = rand(min, max);
      b = rand(min, max);
      answer = a + b;
      questionStr = `${a} + ${b} = ?`;
      break;
    }
    case 'subtraction': {
      const min = difficulty === 'easy' ? 1 : difficulty === 'medium' ? 20 : 50;
      const max = difficulty === 'easy' ? 20 : difficulty === 'medium' ? 50 : 100;
      a = rand(min, max);
      b = rand(min, a); // b ≤ a ensures non-negative result
      answer = a - b;
      questionStr = `${a} - ${b} = ?`;
      break;
    }
    case 'multiplication': {
      const tables = difficulty === 'medium' ? MEDIUM_TABLES : HARD_TABLES;
      a = pickFrom(tables);
      b = pickFrom(tables);
      answer = a * b;
      questionStr = `${a} × ${b} = ?`;
      break;
    }
    case 'division': {
      const tables = difficulty === 'medium' ? MEDIUM_TABLES : HARD_TABLES;
      b = pickFrom(tables);     // divisor
      answer = pickFrom(tables); // quotient
      a = b * answer;            // dividend
      questionStr = `${a} ÷ ${b} = ?`;
      break;
    }
    default:
      a = rand(1, 20);
      b = rand(1, 20);
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
