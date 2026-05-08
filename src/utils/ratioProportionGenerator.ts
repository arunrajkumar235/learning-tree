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
// Hard: Word problems — proportion stories + ratio sharing
// ---------------------------------------------------------------------------

// Pairs where numbers stay in hard range (up to 200) when scaled
const PROP_STORY_PAIRS: [number, number][] = [
  [3, 2], [4, 3], [5, 2], [5, 3], [5, 4],
  [7, 4], [7, 5], [8, 5], [6, 5], [7, 3],
];

const PERSON_NAMES: [string, string][] = [
  ['Roshan', 'Vaibhav'], ['Priya', 'Anita'], ['Rahul', 'Suresh'],
  ['Kavya', 'Meera'], ['Arjun', 'Dev'], ['Riya', 'Sana'],
  ['Pooja', 'Nisha'], ['Vikram', 'Anil'],
];

const WORD_PROBLEM_TEMPLATES: Array<() => { question: string; answer: number }> = [
  // --- Proportion story: travel time ---
  () => {
    const [p, q] = pickFrom(PROP_STORY_PAIRS);
    const k = rand(6, 16); const m = rand(8, 24);
    const [nameA, nameB] = pickFrom(PERSON_NAMES);
    const destinations = [
      ['school', 'the park'], ['the market', 'the mall'],
      ['the library', 'the station'], ['home', 'the stadium'],
    ];
    const [dest1, dest2] = pickFrom(destinations);
    const A1 = p * k, B1 = q * k, A2 = p * m;
    return {
      question: `${nameA} takes ${A1} min to go to ${dest1}. ${nameB} takes ${B1} min for the same route. If ${nameA} takes ${A2} min to go to ${dest2}, how long does ${nameB} take?`,
      answer: q * m,
    };
  },
  // --- Proportion story: pages read ---
  () => {
    const [p, q] = pickFrom(PROP_STORY_PAIRS);
    const k = rand(5, 14); const m = rand(8, 22);
    const [nameA, nameB] = pickFrom(PERSON_NAMES);
    const A1 = p * k, B1 = q * k, A2 = p * m;
    return {
      question: `${nameA} reads ${A1} pages in 1 hour. ${nameB} reads ${B1} pages in 1 hour. If ${nameA} reads ${A2} pages in a day, how many pages does ${nameB} read in the same time?`,
      answer: q * m,
    };
  },
  // --- Proportion story: money earned ---
  () => {
    const [p, q] = pickFrom(PROP_STORY_PAIRS);
    const k = rand(6, 16); const m = rand(7, 20);
    const [nameA, nameB] = pickFrom(PERSON_NAMES);
    const A1 = p * k, B1 = q * k, A2 = p * m;
    return {
      question: `${nameA} earns ₹${A1} per day. ${nameB} earns ₹${B1} per day. If ${nameA} earns ₹${A2} in a week, how much does ${nameB} earn in the same number of days?`,
      answer: q * m,
    };
  },
  // --- Proportion story: distance walked / cycled ---
  () => {
    const [p, q] = pickFrom(PROP_STORY_PAIRS);
    const k = rand(5, 14); const m = rand(8, 22);
    const [nameA, nameB] = pickFrom(PERSON_NAMES);
    const mode = pickFrom(['walks', 'cycles', 'runs']);
    const A1 = p * k, B1 = q * k, A2 = p * m;
    return {
      question: `${nameA} ${mode} ${A1} km in 2 hours. ${nameB} ${mode} ${B1} km in 2 hours. If ${nameA} covers ${A2} km in a day, how far does ${nameB} cover in the same time?`,
      answer: q * m,
    };
  },
  // --- Proportion story: litres filled by taps ---
  () => {
    const [p, q] = pickFrom(PROP_STORY_PAIRS);
    const k = rand(6, 15); const m = rand(8, 22);
    const A1 = p * k, B1 = q * k, A2 = p * m;
    return {
      question: `Tap A fills ${A1} litres per hour. Tap B fills ${B1} litres per hour. If Tap A fills ${A2} litres in a session, how many litres does Tap B fill in the same time?`,
      answer: q * m,
    };
  },
  // --- Proportion story: bricks laid by workers ---
  () => {
    const [p, q] = pickFrom(PROP_STORY_PAIRS);
    const k = rand(5, 14); const m = rand(8, 20);
    const [nameA, nameB] = pickFrom(PERSON_NAMES);
    const A1 = p * k, B1 = q * k, A2 = p * m;
    return {
      question: `${nameA} lays ${A1} bricks per hour. ${nameB} lays ${B1} bricks per hour. If ${nameA} lays ${A2} bricks in a day, how many bricks does ${nameB} lay in the same time?`,
      answer: q * m,
    };
  },
  // --- Class boys/girls ---
  () => {
    const pairs: [number, number][] = [[2, 3], [3, 4], [3, 5], [4, 5], [5, 7]];
    const [p, q] = pickFrom(pairs);
    const k = rand(4, 12);
    const total = (p + q) * k;
    return {
      question: `A class of ${total} students has boys to girls in ratio ${p} : ${q}.  Girls = ?`,
      answer: q * k,
    };
  },
  // --- Money sharing ---
  () => {
    const pairs: [number, number][] = [[2, 3], [3, 5], [1, 4], [4, 5], [3, 7]];
    const [p, q] = pickFrom(pairs);
    const k = rand(8, 20);
    const total = (p + q) * k;
    const larger = Math.max(p, q) * k;
    const [nameA, nameB] = pickFrom(PERSON_NAMES);
    return {
      question: `₹${total} is shared between ${nameA} and ${nameB} in ratio ${p} : ${q}.  Larger share = ?`,
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
