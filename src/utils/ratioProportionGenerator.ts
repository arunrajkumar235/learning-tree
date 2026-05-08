import type { Difficulty, Question } from '../store/appStore';

export type RatioOpType =
  | 'ratio-simplify'
  | 'ratio-equivalent'
  | 'ratio-missing'
  | 'ratio-share'
  | 'ratio-word';

export const RATIO_EMOJIS: Record<RatioOpType, string> = {
  'ratio-simplify':   '⚖️',
  'ratio-equivalent': '🔗',
  'ratio-missing':    '🔢',
  'ratio-share':      '🎯',
  'ratio-word':       '📐',
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
// Easy: Simplify ratio — "[p×k] : [q×k] = ? : [q]"
// Answer = p (first term of simplified form)
// ---------------------------------------------------------------------------
const EASY_COPRIME_PAIRS = [
  [1, 2], [1, 3], [2, 3], [3, 4], [2, 5], [3, 5], [1, 4],
  [3, 7], [4, 5], [2, 7],
];
const MEDIUM_COPRIME_PAIRS = [
  [3, 7], [4, 5], [5, 7], [3, 8], [5, 8], [7, 9], [5, 6],
  [4, 7], [5, 9], [7, 11],
];

function generateSimplifyRatio(difficulty: Difficulty): { question: string; answer: number } {
  const pairs = difficulty === 'easy' ? EASY_COPRIME_PAIRS : MEDIUM_COPRIME_PAIRS;
  const kRange = difficulty === 'easy' ? [2, 3, 4] : [3, 4, 5, 6, 7];
  const [p, q] = pickFrom(pairs);
  const k = pickFrom(kRange);
  return {
    question: `Simplify  ${p * k} : ${q * k}  =  ? : ${q}`,
    answer: p,
  };
}

// ---------------------------------------------------------------------------
// Easy / Medium: Equivalent ratio — "[a] : [b] = ? : [b×k]"
// Answer = a×k
// ---------------------------------------------------------------------------
function generateEquivalentRatio(difficulty: Difficulty): { question: string; answer: number } {
  const pairs = difficulty === 'easy' ? EASY_COPRIME_PAIRS : MEDIUM_COPRIME_PAIRS;
  const kRange = difficulty === 'easy' ? [2, 3, 4] : [3, 4, 5, 6, 8];
  const [a, b] = pickFrom(pairs);
  const k = pickFrom(kRange);
  return {
    question: `${a} : ${b}  =  ? : ${b * k}`,
    answer: a * k,
  };
}

// ---------------------------------------------------------------------------
// Medium / Hard: Missing term in proportion — "Find x:  [a] : [b] = x : [c]"
// Answer = a × c / b  (always integer by construction)
// ---------------------------------------------------------------------------
function generateMissingTerm(difficulty: Difficulty): { question: string; answer: number } {
  const pairs = difficulty === 'medium' ? EASY_COPRIME_PAIRS : MEDIUM_COPRIME_PAIRS;
  const kRange = difficulty === 'medium' ? [3, 4, 5, 6] : [5, 6, 7, 8, 9, 10];
  const [a, b] = pickFrom(pairs);
  const k = pickFrom(kRange);
  const c = b * k; // c is a multiple of b so answer is integer
  const x = a * k;
  return {
    question: `Find x :   ${a} : ${b}  =  x : ${c}`,
    answer: x,
  };
}

// ---------------------------------------------------------------------------
// Medium / Hard: Share quantity — "Share [total] in [p]:[q] → [smaller/larger] part = ?"
// ---------------------------------------------------------------------------
const SHARE_PAIRS_MEDIUM = [
  [1, 2], [2, 3], [1, 3], [3, 4], [1, 4], [2, 5], [3, 5],
];
const SHARE_PAIRS_HARD = [
  [3, 7], [4, 5], [5, 7], [3, 8], [5, 8], [7, 9], [4, 9],
];

function generateShareQuantity(difficulty: Difficulty): { question: string; answer: number } {
  const pairs   = difficulty === 'medium' ? SHARE_PAIRS_MEDIUM : SHARE_PAIRS_HARD;
  const kRange  = difficulty === 'medium' ? [4, 5, 6, 7, 8, 10] : [6, 7, 8, 9, 10, 12, 15];
  const [p, q]  = pickFrom(pairs);
  const k       = pickFrom(kRange);
  const total   = (p + q) * k;
  const larger  = Math.random() > 0.5;
  const pick    = larger ? Math.max(p, q) : Math.min(p, q);
  const label   = larger ? 'larger' : 'smaller';
  return {
    question: `Share ${total} in ratio ${p} : ${q}  →  ${label} part = ?`,
    answer: pick * k,
  };
}

// ---------------------------------------------------------------------------
// Hard: Fourth proportional — "4th proportional to [a], [b], [c] = ?"
// Answer = b × c / a  (constructed to be integer)
// ---------------------------------------------------------------------------
function generateFourthProportional(): { question: string; answer: number } {
  // Pick a, multiplier m so b = a × m (guarantees integer result)
  const aValues = [2, 3, 4, 5, 6, 8, 9, 10];
  const mRange  = [2, 3, 4, 5];
  const cRange  = [3, 4, 5, 6, 7, 8, 9, 10, 12, 15];
  const a = pickFrom(aValues);
  const m = pickFrom(mRange);
  const b = a * m;              // b is a multiple of a
  const c = pickFrom(cRange);
  const answer = b * c / a;     // = m × c, always integer
  return {
    question: `4th proportional to  ${a}, ${b}, ${c}  = ?`,
    answer,
  };
}

// ---------------------------------------------------------------------------
// Hard: Word problems
// ---------------------------------------------------------------------------
const WORD_PROBLEM_TEMPLATES = [
  // Class boys/girls
  () => {
    const pairs  = [[2, 3], [3, 4], [3, 5], [4, 5], [5, 7]];
    const [p, q] = pickFrom(pairs);
    const k      = rand(2, 7);
    const total  = (p + q) * k;
    const girls  = q * k;
    return {
      question: `A class of ${total} students has boys to girls in ratio ${p} : ${q}.  Girls = ?`,
      answer: girls,
    };
  },
  // Recipe / mixture
  () => {
    const pairs  = [[1, 2], [1, 3], [2, 3], [3, 4], [2, 5]];
    const [p, q] = pickFrom(pairs);
    const k      = rand(2, 8);
    const flour  = p * k;
    const sugar  = q * k;
    // Ask for one given the other
    const askFlour = Math.random() > 0.5;
    return {
      question: askFlour
        ? `Flour : Sugar = ${p} : ${q}.  Sugar = ${sugar},  Flour = ?`
        : `Flour : Sugar = ${p} : ${q}.  Flour = ${flour},  Sugar = ?`,
      answer: askFlour ? flour : sugar,
    };
  },
  // Map scale
  () => {
    const scales = [[1, 5], [1, 10], [2, 5], [1, 4], [3, 7]];
    const [p, q] = pickFrom(scales);
    const k      = rand(2, 6);
    const map    = p * k;
    const real   = q * k;
    return {
      question: `Map : Real = ${p} : ${q}.  Map = ${map} cm,  Real distance = ?`,
      answer: real,
    };
  },
  // Money sharing
  () => {
    const pairs  = [[2, 3], [3, 5], [1, 4], [4, 5], [3, 7]];
    const [p, q] = pickFrom(pairs);
    const k      = rand(5, 15);
    const total  = (p + q) * k;
    const larger = Math.max(p, q) * k;
    return {
      question: `₹${total} shared in ratio ${p} : ${q}.  Larger share = ?`,
      answer: larger,
    };
  },
];

function generateWordProblem(): { question: string; answer: number } {
  return pickFrom(WORD_PROBLEM_TEMPLATES)();
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------
export function generateRatioProportionQuestion(difficulty: Difficulty): Question {
  type GenResult = { question: string; answer: number };
  let opType: RatioOpType;
  let gen: GenResult;

  if (difficulty === 'easy') {
    opType = Math.random() < 0.5 ? 'ratio-simplify' : 'ratio-equivalent';
    gen = opType === 'ratio-simplify'
      ? generateSimplifyRatio(difficulty)
      : generateEquivalentRatio(difficulty);
  } else if (difficulty === 'medium') {
    const roll = Math.random();
    if (roll < 0.33) {
      opType = 'ratio-equivalent'; gen = generateEquivalentRatio(difficulty);
    } else if (roll < 0.66) {
      opType = 'ratio-missing';    gen = generateMissingTerm(difficulty);
    } else {
      opType = 'ratio-share';      gen = generateShareQuantity(difficulty);
    }
  } else {
    const roll = Math.random();
    if (roll < 0.33) {
      opType = 'ratio-missing';   gen = generateMissingTerm(difficulty);
    } else if (roll < 0.56) {
      opType = 'ratio-share';     gen = generateShareQuantity(difficulty);
    } else if (roll < 0.78) {
      opType = 'ratio-word';      gen = generateWordProblem();
    } else {
      // Fourth proportional — ensure no collision with other types
      opType = 'ratio-missing';
      const fp = generateFourthProportional();
      gen = fp;
    }
  }

  const wrongOptions = generateWrongOptions(gen.answer, 3);
  const options = shuffle([gen.answer, ...wrongOptions]);

  return {
    id: `${Date.now()}-${Math.random()}`,
    question: gen.question,
    answer: gen.answer,
    options,
    type: opType as Question['type'],
    emoji: RATIO_EMOJIS[opType],
  };
}
