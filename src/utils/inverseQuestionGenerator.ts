import type { Difficulty, InverseQuestion } from '../store/appStore';

type OpType = 'addition' | 'subtraction' | 'multiplication' | 'division';

// Mirror the same table pools used by the arithmetic generator
const MEDIUM_TABLES = [1, 2, 3, 4, 5, 6, 10, 11];
const HARD_TABLES = [4, 5, 6, 7, 8, 9, 10, 11, 12];

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickFrom(arr: number[]): number {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getAvailableOps(difficulty: Difficulty): OpType[] {
  if (difficulty === 'easy') return ['addition', 'subtraction'];
  return ['addition', 'subtraction', 'multiplication', 'division'];
}

interface Equation {
  display: string;
  result: number;
}

function generateEquation(difficulty: Difficulty, ops: OpType[]): Equation {
  const opType = ops[rand(0, ops.length - 1)];
  let a: number, b: number, result: number, display: string;

  switch (opType) {
    case 'addition': {
      const min = difficulty === 'easy' ? 1 : difficulty === 'medium' ? 20 : 50;
      const max = difficulty === 'easy' ? 20 : difficulty === 'medium' ? 50 : 100;
      a = rand(min, max);
      b = rand(min, max);
      result = a + b;
      display = `${a} + ${b}`;
      break;
    }
    case 'subtraction': {
      const min = difficulty === 'easy' ? 1 : difficulty === 'medium' ? 20 : 50;
      const max = difficulty === 'easy' ? 20 : difficulty === 'medium' ? 50 : 100;
      a = rand(min, max);
      b = rand(min, a);
      result = a - b;
      display = `${a} - ${b}`;
      break;
    }
    case 'multiplication': {
      const tables = difficulty === 'medium' ? MEDIUM_TABLES : HARD_TABLES;
      a = pickFrom(tables);
      b = pickFrom(tables);
      result = a * b;
      display = `${a} × ${b}`;
      break;
    }
    case 'division': {
      const tables = difficulty === 'medium' ? MEDIUM_TABLES : HARD_TABLES;
      b = pickFrom(tables);
      const quotient = pickFrom(tables);
      a = b * quotient;
      result = quotient;
      display = `${a} ÷ ${b}`;
      break;
    }
    default: {
      a = rand(1, 20);
      b = rand(1, a);
      result = a - b;
      display = `${a} - ${b}`;
    }
  }

  return { display, result };
}

export function generateInverseQuestion(difficulty: Difficulty): InverseQuestion {
  const ops = getAvailableOps(difficulty);

  const correct = generateEquation(difficulty, ops);
  const target = correct.result;

  const wrongEquations: Equation[] = [];
  const usedResults = new Set<number>([target]);
  const usedDisplays = new Set<string>([correct.display]);

  // Try to find 3 wrong equations that differ in both result and display
  let attempts = 0;
  while (wrongEquations.length < 3 && attempts < 80) {
    attempts++;
    const eq = generateEquation(difficulty, ops);
    if (!usedResults.has(eq.result) && !usedDisplays.has(eq.display)) {
      usedResults.add(eq.result);
      usedDisplays.add(eq.display);
      wrongEquations.push(eq);
    }
  }

  // Fallback: produce simple valid additions with offsets from target
  let offset = 1;
  while (wrongEquations.length < 3) {
    const fallbackResult = target + offset;
    // Keep operands reasonable: split into two valid positive numbers
    const a = Math.max(1, target);
    const b = offset;
    const fallbackDisplay = `${a} + ${b}`;
    if (!usedDisplays.has(fallbackDisplay)) {
      usedDisplays.add(fallbackDisplay);
      usedResults.add(fallbackResult);
      wrongEquations.push({ display: fallbackDisplay, result: fallbackResult });
    }
    offset++;
  }

  const allOptions = shuffle([correct, ...wrongEquations]);

  return {
    id: `${Date.now()}-${Math.random()}`,
    question: target,
    answer: correct.display,
    options: allOptions.map(eq => eq.display),
    emoji: '🔀',
  };
}
