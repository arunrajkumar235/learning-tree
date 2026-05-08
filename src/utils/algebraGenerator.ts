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
// Easy: two-step equations, x in 3–20 (upgraded from trivial one-step)
// ---------------------------------------------------------------------------
function generateEasyOneStep(): { question: string; answer: number } {
  const kind = rand(1, 4);

  if (kind === 1) {
    // ax + b = c
    const a = rand(2, 5);
    const x = rand(3, 18);
    const b = rand(2, 15);
    const c = a * x + b;
    return { question: `${a}x + ${b} = ${c}`, answer: x };
  } else if (kind === 2) {
    // ax − b = c
    const a = rand(2, 5);
    const x = rand(4, 18);
    const b = rand(2, 15);
    const c = a * x - b;
    if (c <= 0) {
      const a2 = rand(2, 4); const x2 = rand(5, 18); const b2 = rand(2, 10);
      return { question: `${a2}x − ${b2} = ${a2 * x2 - b2}`, answer: x2 };
    }
    return { question: `${a}x − ${b} = ${c}`, answer: x };
  } else if (kind === 3) {
    // x / a + b = c  →  x = (c - b) * a
    const a = rand(2, 5);
    const b = rand(2, 12);
    const diff = rand(3, 12);          // diff = c - b, so x = diff * a
    const c = b + diff;
    const x = diff * a;
    return { question: `x / ${a} + ${b} = ${c}`, answer: x };
  } else {
    // x / a − b = c  →  x = (c + b) * a
    const a = rand(2, 5);
    const b = rand(2, 10);
    const c = rand(3, 15);
    const x = (c + b) * a;
    return { question: `x / ${a} − ${b} = ${c}`, answer: x };
  }
}

// ---------------------------------------------------------------------------
// Medium: harder than easy — variables on both sides, distributive, fractional
// ---------------------------------------------------------------------------
function generateMediumEquation(): { question: string; answer: number; type: AlgebraOpType } {
  const kind = rand(1, 4);

  if (kind === 1) {
    // ax + b = cx + d  (variables on both sides)
    const c = rand(2, 4);
    const a = c + rand(2, 5);          // a > c → net coefficient positive
    const x = rand(4, 20);
    const b = rand(3, 20);
    const d = (a - c) * x + b;
    return { question: `${a}x + ${b} = ${c}x + ${d}`, answer: x, type: 'algebra-two-step' };
  } else if (kind === 2) {
    // a(x + b) = c  (simple distributive)
    const a = rand(3, 8);
    const x = rand(3, 15);
    const b = rand(2, 10);
    const c = a * (x + b);
    return { question: `${a}(x + ${b}) = ${c}`, answer: x, type: 'algebra-two-step' };
  } else if (kind === 3) {
    // (ax + b) / c = d  (fractional)
    // Construct: pick c, d, a, x → b = d*c − a*x  (ensure b > 0)
    const c = rand(2, 5);
    const d = rand(4, 15);
    const a = rand(2, 4);
    const x = rand(2, 10);
    const b = d * c - a * x;
    if (b >= 1) return { question: `(${a}x + ${b}) / ${c} = ${d}`, answer: x, type: 'algebra-two-step' };
    // try a smaller x
    const x2 = rand(1, 6);
    const b2 = d * c - a * x2;
    if (b2 >= 1) return { question: `(${a}x + ${b2}) / ${c} = ${d}`, answer: x2, type: 'algebra-two-step' };
    // fallback to distributive
    const a3 = rand(3, 7); const x3 = rand(3, 12); const b3 = rand(2, 8);
    return { question: `${a3}(x + ${b3}) = ${a3 * (x3 + b3)}`, answer: x3, type: 'algebra-two-step' };
  } else {
    // a(x − b) = c  (distributive with subtraction)
    const a = rand(3, 8);
    const x = rand(5, 20);
    const b = rand(2, 8);
    const c = a * (x - b);
    if (c <= 0) {
      const a2 = rand(3, 6); const x2 = rand(6, 18); const b2 = rand(2, 6);
      return { question: `${a2}(x − ${b2}) = ${a2 * (x2 - b2)}`, answer: x2, type: 'algebra-two-step' };
    }
    return { question: `${a}(x − ${b}) = ${c}`, answer: x, type: 'algebra-two-step' };
  }
}

// ---------------------------------------------------------------------------
// Hard: paper-and-pen level — expand brackets, collect like terms, fractions
// Variables on both sides with larger coefficients; x up to 40
// No timer, no auto-eliminate
// ---------------------------------------------------------------------------
function generateHardEquation(): { question: string; answer: number; type: AlgebraOpType } {
  const kind = rand(1, 5);

  if (kind === 1) {
    // a(bx + c) = d  — expand then solve  e.g. 3(2x + 5) = 33
    const a = rand(2, 6);
    const b = rand(2, 5);
    const x = rand(3, 20);
    const c = rand(2, 12);
    const d = a * (b * x + c);
    return { question: `${a}(${b}x + ${c}) = ${d}`, answer: x, type: 'algebra-two-step' };
  } else if (kind === 2) {
    // ax + b(x − c) = d  — expand and collect  e.g. 4x + 3(x − 2) = 27
    const a = rand(2, 7);
    const b = rand(2, 5);
    const x = rand(4, 25);
    const c = rand(2, 10);
    const d = (a + b) * x - b * c;
    if (d <= 0) {
      const a2 = rand(3, 6); const b2 = rand(2, 4); const x2 = rand(5, 20); const c2 = rand(2, 8);
      return { question: `${a2}(${b2}x + ${c2}) = ${a2 * (b2 * x2 + c2)}`, answer: x2, type: 'algebra-two-step' };
    }
    return { question: `${a}x + ${b}(x − ${c}) = ${d}`, answer: x, type: 'algebra-two-step' };
  } else if (kind === 3) {
    // a(x + b) = c(x + d)  — distribute both sides  e.g. 5(x + 4) = 2(x + 13)
    // (a − c)x = c*d − a*b  →  construct: pick a > c, x, b, then d = ((a−c)*x + a*b) / c
    const c = rand(2, 4);
    const a = c + rand(2, 6);
    const x = rand(3, 20);
    // Choose b as multiple of c to guarantee integer d
    const bMult = rand(1, 5);
    const b = bMult * c;
    const d = ((a - c) * x + a * b) / c;   // always integer since b = bMult*c → a*b = a*bMult*c
    if (d > 0 && Number.isInteger(d) && d !== b) {
      return { question: `${a}(x + ${b}) = ${c}(x + ${d})`, answer: x, type: 'algebra-two-step' };
    }
    // fallback
    const a2 = rand(3, 7); const x2 = rand(4, 18); const c2 = rand(2, 10);
    return { question: `${a2}(${rand(2, 3)}x + ${c2}) = ${a2 * (rand(2, 3) * x2 + c2)}`, answer: x2, type: 'algebra-two-step' };
  } else if (kind === 4) {
    // (ax + b) / c = d  — fractional  e.g. (3x + 6) / 4 = 9
    // Construct: pick c, d, a, x → b = d*c − a*x  (ensure b > 0)
    const c = rand(2, 6);
    const d = rand(5, 18);
    const a = rand(2, 5);
    const x = rand(2, 12);
    const b = d * c - a * x;
    if (b >= 1) return { question: `(${a}x + ${b}) / ${c} = ${d}`, answer: x, type: 'algebra-two-step' };
    // try different x
    const x2 = rand(2, 8);
    const b2 = d * c - a * x2;
    if (b2 >= 1) return { question: `(${a}x + ${b2}) / ${c} = ${d}`, answer: x2, type: 'algebra-two-step' };
    // fallback to kind 1
    const a3 = rand(3, 6); const b3 = rand(2, 5); const x3 = rand(3, 18); const c3 = rand(2, 10);
    return { question: `${a3}(${b3}x + ${c3}) = ${a3 * (b3 * x3 + c3)}`, answer: x3, type: 'algebra-two-step' };
  } else {
    // ax + b = cx + d  with larger numbers (variables on both sides)
    const c = rand(2, 6);
    const a = c + rand(3, 8);
    const x = rand(6, 40);
    const b = rand(5, 30);
    const d = (a - c) * x + b;
    return { question: `${a}x + ${b} = ${c}x + ${d}`, answer: x, type: 'algebra-two-step' };
  }
}

// ---------------------------------------------------------------------------
// Hard: challenging word problems — age, perimeter, profit, consecutive numbers
// Require setting up an equation and solving with paper and pen
// ---------------------------------------------------------------------------
const WORD_PROBLEM_TEMPLATES: Array<() => { question: string; answer: number }> = [
  // Age problem — ratio then future sum
  () => {
    // Priya is k times as old as Rahul (x). In y years their ages sum to S.
    // (x + y) + (kx + y) = S → (k+1)x + 2y = S → x = (S - 2y)/(k+1)
    const k = pickFrom([2, 3, 4]);
    const y = rand(2, 8);
    const x = rand(5, 20);
    const S = (k + 1) * x + 2 * y;
    const names: [string, string][] = [['Priya', 'Rahul'], ['Anita', 'Dev'], ['Kavya', 'Arjun'], ['Meera', 'Rohit']];
    const [nameA, nameB] = pickFrom(names);
    return {
      question: `${nameA} is ${k} times as old as ${nameB}. In ${y} years, the sum of their ages will be ${S}. Find ${nameB}'s current age.`,
      answer: x,
    };
  },
  // Rectangle perimeter
  () => {
    // Length = 2*width + extra, Perimeter = 2*(l + w) = P → 2*(2w + extra + w) = P → 6w + 2*extra = P
    const w = rand(5, 25);
    const extra = rand(3, 12);
    const l = 2 * w + extra;
    const P = 2 * (l + w);
    return {
      question: `The length of a rectangle is ${extra} cm more than twice its width. If the perimeter is ${P} cm, find the width.`,
      answer: w,
    };
  },
  // Two-person sharing — sum and ratio
  () => {
    // A has k times as many as B (x). Together = T → kx + x = T → x = T/(k+1)
    const k = pickFrom([2, 3, 4, 5]);
    const x = rand(4, 20);
    const T = (k + 1) * x;
    const names: [string, string][] = [['Roshan', 'Vaibhav'], ['Riya', 'Sana'], ['Amir', 'Vivek'], ['Pooja', 'Nisha']];
    const [nameA, nameB] = pickFrom(names);
    const items = ['marbles', 'books', 'stickers', 'coins', 'cards'];
    const item = pickFrom(items);
    return {
      question: `${nameA} has ${k} times as many ${item} as ${nameB}. Together they have ${T} ${item}. How many does ${nameB} have?`,
      answer: x,
    };
  },
  // Consecutive numbers
  () => {
    // n + (n+2) + (n+4) = S (3 consecutive odd/even numbers)
    const x = rand(5, 30) * 2 + 1;   // start with odd
    const S = x + (x + 2) + (x + 4);
    return {
      question: `The sum of three consecutive odd numbers is ${S}. Find the smallest number.`,
      answer: x,
    };
  },
  // Profit problem
  () => {
    // Sold at price s, bought at price b, profit per item = s - b, total profit = P → n*(s-b) = P
    const b = rand(3, 8) * 5;
    const s = b + rand(2, 5) * 5;
    const n = rand(5, 20);
    const P = n * (s - b);
    return {
      question: `A shopkeeper buys pens at ₹${b} each and sells them at ₹${s} each. If his total profit is ₹${P}, how many pens did he sell?`,
      answer: n,
    };
  },
  // Coins problem
  () => {
    // x ₹5 coins + (T - x) ₹2 coins = total amount
    // 5x + 2(T - x) = A → 3x + 2T = A → x = (A - 2T) / 3
    const T = rand(10, 25);
    const x = rand(3, T - 2);
    const A = 5 * x + 2 * (T - x);
    return {
      question: `A piggy bank has ${T} coins, all either ₹5 or ₹2. The total amount is ₹${A}. How many ₹5 coins are there?`,
      answer: x,
    };
  },
  // Distance problem
  () => {
    // Two people walk toward each other. Speed A = sA, speed B = sB, distance = D
    // They meet after t hours: sA*t + sB*t = D → t*(sA+sB) = D
    const sA = rand(3, 8);
    const sB = rand(2, 6);
    const t = rand(2, 5);
    const D = (sA + sB) * t;
    const names: [string, string][] = [['Roshan', 'Priya'], ['Arjun', 'Meera'], ['Dev', 'Kavya']];
    const [nameA, nameB] = pickFrom(names);
    return {
      question: `${nameA} and ${nameB} start walking toward each other from towns ${D} km apart. ${nameA} walks at ${sA} km/h and ${nameB} at ${sB} km/h. After how many hours do they meet?`,
      answer: t,
    };
  },
  // Number relation with equation on both sides
  () => {
    // "If you add a to n and multiply by b, you get c more than d times n"
    // b(n + a) = d*n + c → b*n + b*a = d*n + c → (b-d)*n = c - b*a → n = (c - b*a)/(b-d)
    const d = rand(2, 4);
    const b = d + rand(2, 4);          // b > d
    const n = rand(4, 20);
    const a = rand(2, 10);
    const c = b * (n + a) - d * n;    // c = b*n + b*a - d*n = (b-d)*n + b*a
    if (c <= 0) return { question: `Twice a number increased by 9 equals 3 more than the number. Find the number.`, answer: 3 - 9 };  // placeholder rarely hit
    return {
      question: `When ${a} is added to a number and the result is multiplied by ${b}, the answer is ${c} more than ${d} times the number. Find the number.`,
      answer: n,
    };
  },
];

function generateWordProblem(): { question: string; answer: number } {
  const gen = pickFrom(WORD_PROBLEM_TEMPLATES)();
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
    opType   = 'algebra-two-step';
    question = gen.question;
    answer   = gen.answer;
  } else if (difficulty === 'medium') {
    const gen = generateMediumEquation();
    opType   = gen.type;
    question = gen.question;
    answer   = gen.answer;
  } else {
    // hard — 40% equation types, 60% word problems (require more thinking)
    const roll = Math.random();
    if (roll < 0.40) {
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
