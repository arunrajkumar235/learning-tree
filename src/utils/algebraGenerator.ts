import type { Difficulty, Question } from '../store/appStore';

export type AlgebraOpType =
  | 'algebra-one-step'
  | 'algebra-two-step'
  | 'algebra-word';

export const ALGEBRA_EMOJIS: Record<AlgebraOpType, string> = {
  'algebra-one-step': '🔢',
  'algebra-two-step': '📐',
  'algebra-word':     '📖',
};

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickFrom<T>(arr: T[]): T {
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

function generateWrongOptions(correct: number, count: number): number[] {
  const wrongs = new Set<number>();
  let attempts = 0;
  while (wrongs.size < count && attempts < 120) {
    attempts++;
    const offset = rand(1, Math.max(8, Math.floor(Math.abs(correct) * 0.6) + 4));
    const sign = Math.random() > 0.5 ? 1 : -1;
    const candidate = correct + sign * offset;
    if (candidate !== correct && candidate > 0) wrongs.add(candidate);
  }
  let fallback = correct + 1;
  while (wrongs.size < count) {
    if (fallback !== correct) wrongs.add(fallback);
    fallback++;
  }
  return Array.from(wrongs);
}

// ---------------------------------------------------------------------------
// Easy: one-step equations, x in 2–15
// ---------------------------------------------------------------------------
function generateEasyOneStep(): { question: string; answer: number } {
  const kind = rand(1, 4);

  if (kind === 1) {
    // x + a = b
    const x = rand(2, 15);
    const a = rand(1, 12);
    const b = x + a;
    return { question: `x + ${a} = ${b}`, answer: x };
  } else if (kind === 2) {
    // x − a = b
    const x = rand(3, 15);
    const a = rand(1, 10);
    const b = x - a;
    return { question: `x − ${a} = ${b}`, answer: x };
  } else if (kind === 3) {
    // ax = b  (show as "3x = 12")
    const a = rand(2, 9);
    const x = rand(2, 12);
    const b = a * x;
    return { question: `${a}x = ${b}`, answer: x };
  } else {
    // x / a = b
    const a = rand(2, 6);
    const b = rand(2, 8);
    const x = a * b;
    return { question: `x / ${a} = ${b}`, answer: x };
  }
}

// ---------------------------------------------------------------------------
// Medium: one-step (larger numbers) + two-step, x in 5–25
// ---------------------------------------------------------------------------
function generateMediumEquation(): { question: string; answer: number; type: AlgebraOpType } {
  const kind = rand(1, 4);

  if (kind === 1) {
    // x + a = b  (larger numbers)
    const x = rand(10, 40);
    const a = rand(8, 30);
    const b = x + a;
    return { question: `x + ${a} = ${b}`, answer: x, type: 'algebra-one-step' };
  } else if (kind === 2) {
    // ax = b  (larger)
    const a = rand(3, 12);
    const x = rand(5, 20);
    const b = a * x;
    return { question: `${a}x = ${b}`, answer: x, type: 'algebra-one-step' };
  } else if (kind === 3) {
    // ax + b = c  (two-step)
    const a = rand(2, 5);
    const x = rand(3, 15);
    const b = rand(2, 20);
    const c = a * x + b;
    return { question: `${a}x + ${b} = ${c}`, answer: x, type: 'algebra-two-step' };
  } else {
    // ax − b = c  (two-step)
    const a = rand(2, 5);
    const x = rand(4, 18);
    const b = rand(2, 15);
    const c = a * x - b;
    if (c <= 0) {
      // fallback to addition form
      const a2 = rand(2, 4); const x2 = rand(4, 15); const b2 = rand(2, 12);
      return { question: `${a2}x + ${b2} = ${a2 * x2 + b2}`, answer: x2, type: 'algebra-two-step' };
    }
    return { question: `${a}x − ${b} = ${c}`, answer: x, type: 'algebra-two-step' };
  }
}

// ---------------------------------------------------------------------------
// Hard: two-step (larger numbers) + variables on both sides, x in 5–25
// No timer, no auto-eliminate
// ---------------------------------------------------------------------------
function generateHardEquation(): { question: string; answer: number; type: AlgebraOpType } {
  const kind = rand(1, 4);

  if (kind === 1) {
    // ax + b = c
    const a = rand(3, 9);
    const x = rand(5, 25);
    const b = rand(5, 30);
    const c = a * x + b;
    return { question: `${a}x + ${b} = ${c}`, answer: x, type: 'algebra-two-step' };
  } else if (kind === 2) {
    // ax − b = c
    const a = rand(3, 8);
    const x = rand(6, 20);
    const b = rand(5, 25);
    const c = a * x - b;
    if (c <= 0) {
      const a2 = rand(4, 8); const x2 = rand(6, 20); const b2 = rand(4, 20);
      return { question: `${a2}x − ${b2} = ${a2 * x2 - b2}`, answer: x2, type: 'algebra-two-step' };
    }
    return { question: `${a}x − ${b} = ${c}`, answer: x, type: 'algebra-two-step' };
  } else if (kind === 3) {
    // x/a + b = c  → x = (c - b) * a
    const a = rand(3, 6);
    const b = rand(5, 20);
    const c = rand(b + 2, b + 20);   // ensure c > b so x > 0
    const x = (c - b) * a;
    return { question: `x / ${a} + ${b} = ${c}`, answer: x, type: 'algebra-two-step' };
  } else {
    // ax + b = cx + d  (variables on both sides, a > c so x > 0)
    const c = rand(2, 4);
    const a = c + rand(2, 5);        // a > c
    const x = rand(3, 15);
    const b = rand(1, 15);
    const d = (a - c) * x + b;      // d = ax + b - cx → rearranges to x = (d-b)/(a-c)
    return { question: `${a}x + ${b} = ${c}x + ${d}`, answer: x, type: 'algebra-two-step' };
  }
}

// ---------------------------------------------------------------------------
// Hard: word problems about finding a number
// ---------------------------------------------------------------------------
const WORD_PROBLEM_TEMPLATES: Array<() => { question: string; answer: number }> = [
  () => {
    const x = rand(5, 30);
    const b = rand(3, 20);
    return { question: `A number increased by ${b} gives ${x + b}. Find the number.`, answer: x };
  },
  () => {
    const x = rand(5, 25);
    const b = rand(2, 15);
    return { question: `When ${b} is subtracted from a number, the result is ${x - b}. Find the number.`, answer: x };
  },
  () => {
    const a = pickFrom([2, 3, 4, 5]);
    const x = rand(4, 20);
    return { question: `${a} times a number equals ${a * x}. Find the number.`, answer: x };
  },
  () => {
    const x = rand(5, 20);
    const b = rand(2, 12);
    return { question: `Twice a number plus ${b} gives ${2 * x + b}. Find the number.`, answer: x };
  },
  () => {
    const a = pickFrom([3, 4, 5]);
    const x = rand(4, 18);
    const b = rand(2, 10);
    return { question: `${a} times a number minus ${b} equals ${a * x - b}. Find the number.`, answer: x };
  },
  () => {
    const x = rand(5, 25);
    const a = pickFrom([2, 3, 4]);
    const b = rand(3, 15);
    const c = x * a + b;
    const names = ['Riya', 'Rahul', 'Priya', 'Arjun', 'Kavya', 'Dev'];
    const name = pickFrom(names);
    const items = ['pencils', 'books', 'marbles', 'stickers', 'coins'];
    const item = pickFrom(items);
    return {
      question: `${name} has some ${item}. After buying ${a} times as many and getting ${b} more, ${name} has ${c} in total. How many did ${name} start with?`,
      answer: x,
    };
  },
  () => {
    const x = rand(6, 25);
    const b = rand(3, 15);
    const names = ['Rohan', 'Nisha', 'Amir', 'Pooja', 'Vivek'];
    const name = pickFrom(names);
    return {
      question: `${name} thinks of a number, doubles it, and adds ${b}. The result is ${2 * x + b}. What was the number?`,
      answer: x,
    };
  },
  () => {
    const x = rand(5, 20);
    const a = pickFrom([2, 3, 5]);
    const c = x / a;                   // ensure x divisible by a
    if (!Number.isInteger(c) || c < 2) {
      const x2 = a * rand(2, 8);
      return { question: `A number divided by ${a} equals ${x2 / a}. Find the number.`, answer: x2 };
    }
    return { question: `A number divided by ${a} equals ${c}. Find the number.`, answer: x };
  },
];

function generateWordProblem(): { question: string; answer: number } {
  const gen = pickFrom(WORD_PROBLEM_TEMPLATES)();
  // ensure answer is positive integer
  if (!Number.isInteger(gen.answer) || gen.answer <= 0) {
    return generateWordProblem();
  }
  return gen;
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------
export function generateAlgebraQuestion(difficulty: Difficulty): Question {
  let opType: AlgebraOpType;
  let question: string;
  let answer: number;

  if (difficulty === 'easy') {
    const gen = generateEasyOneStep();
    opType   = 'algebra-one-step';
    question = gen.question;
    answer   = gen.answer;
  } else if (difficulty === 'medium') {
    const gen = generateMediumEquation();
    opType   = gen.type;
    question = gen.question;
    answer   = gen.answer;
  } else {
    // hard — mix two-step, both-sides, and word problems
    const roll = Math.random();
    if (roll < 0.45) {
      const gen = generateHardEquation();
      opType   = gen.type;
      question = gen.question;
      answer   = gen.answer;
    } else {
      const gen = generateWordProblem();
      opType   = 'algebra-word';
      question = gen.question;
      answer   = gen.answer;
    }
  }

  const wrongOptions = generateWrongOptions(answer, 3);
  const options = shuffle([answer, ...wrongOptions]);

  return {
    id: `${Date.now()}-${Math.random()}`,
    question,
    answer,
    options,
    type: opType as Question['type'],
    emoji: ALGEBRA_EMOJIS[opType],
  };
}
