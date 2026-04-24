import type { Difficulty } from '../store/appStore';

export interface SpellingQuestion {
  id: string;
  word: string;
  missingIndices: number[];
  missingLetters: string[];
  letterBoard: string[];
}

// 4-letter words (age 7+, common vocabulary)
const EASY_WORDS: string[] = [
  'bird', 'boat', 'book', 'cake', 'call', 'camp', 'card', 'coat', 'cold', 'cook',
  'corn', 'crab', 'dark', 'door', 'drop', 'drum', 'duck', 'dust', 'face', 'fall',
  'farm', 'fast', 'fire', 'fish', 'flag', 'fold', 'food', 'foot', 'fork', 'frog',
  'full', 'game', 'gate', 'glad', 'goal', 'gold', 'good', 'gray', 'grow', 'hair',
  'hall', 'hand', 'hang', 'hard', 'heal', 'hear', 'heat', 'hero', 'hide', 'hill',
  'hold', 'hole', 'home', 'hood', 'hook', 'hope', 'horn', 'hunt', 'jump', 'just',
  'keen', 'kept', 'kite', 'knee', 'knot', 'lake', 'lamb', 'lamp', 'lane', 'leaf',
  'lean', 'left', 'life', 'lift', 'lime', 'line', 'lion', 'list', 'live', 'long',
  'look', 'loop', 'love', 'luck', 'mail', 'make', 'mane', 'many', 'mark', 'meal',
  'meet', 'mild', 'mile', 'milk', 'mill', 'mind', 'mine', 'mint', 'miss', 'moon',
  'much', 'name', 'need', 'nest', 'next', 'nice', 'nose', 'note', 'pack', 'page',
  'park', 'part', 'past', 'path', 'plan', 'play', 'pond', 'pool', 'push', 'race',
  'rain', 'read', 'rice', 'rich', 'ride', 'ring', 'rise', 'road', 'rock', 'roll',
  'roof', 'room', 'rope', 'rose', 'rule', 'rush', 'sail', 'salt', 'sand', 'sing',
  'sink', 'skip', 'slow', 'snap', 'snow', 'sock', 'soft', 'soil', 'song', 'soul',
  'step', 'swim', 'tail', 'talk', 'tape', 'team', 'tell', 'tent', 'test', 'tide',
  'tile', 'time', 'tiny', 'toad', 'toll', 'tree', 'trip', 'true', 'tube', 'tune',
  'turn', 'vine', 'wait', 'walk', 'wall', 'want', 'warm', 'wave', 'week', 'well',
  'went', 'wide', 'wild', 'will', 'wind', 'wine', 'wing', 'wise', 'wish', 'wolf',
  'wood', 'wool', 'word', 'work', 'worm', 'wrap', 'wren', 'year',
];

// 5-6 letter words (age 7-9)
const MEDIUM_WORDS: string[] = [
  // 5-letter
  'acorn', 'angel', 'apple', 'arrow', 'badge', 'beach', 'beans', 'began', 'bells',
  'bench', 'berry', 'black', 'blade', 'blame', 'bland', 'blast', 'blaze', 'bleed',
  'blend', 'blink', 'block', 'bloom', 'blown', 'blues', 'blunt', 'board', 'bones',
  'boost', 'bosom', 'brace', 'brain', 'brand', 'brave', 'bread', 'break', 'breed',
  'brick', 'bride', 'bring', 'broad', 'brook', 'brown', 'brush', 'buddy', 'built',
  'bunch', 'cabin', 'candy', 'carry', 'catch', 'cause', 'caves', 'chair', 'chalk',
  'charm', 'chart', 'chase', 'cheap', 'check', 'cheek', 'cheer', 'chess', 'chest',
  'chick', 'child', 'china', 'chips', 'civic', 'claim', 'clamp', 'clang', 'clank',
  'clash', 'clasp', 'class', 'cleat', 'clerk', 'click', 'cliff', 'climb', 'cling',
  'clink', 'clock', 'clone', 'close', 'cloth', 'cloud', 'cluck', 'clump', 'coast',
  'cobra', 'comic', 'coral', 'count', 'court', 'cover', 'cozy', 'crack', 'crane',
  'crash', 'cream', 'creep', 'crisp', 'cross', 'crust', 'curly', 'cycle', 'daisy',
  'dance', 'darts', 'dawn', 'daydream', 'denim', 'dense', 'depot', 'diary', 'disco',
  'dizzy', 'dodge', 'doing', 'dolly', 'donkey', 'dotty', 'dough', 'dove', 'downy',
  'draft', 'drain', 'drape', 'drawn', 'dread', 'dream', 'dress', 'dried', 'drift',
  'drill', 'drip', 'drink', 'drive', 'drone', 'drops', 'drown', 'druid', 'drum',
  'dwarf', 'dwelt', 'eager', 'eagle', 'earth', 'eight', 'elect', 'enjoy', 'enter',
  'equal', 'every', 'exact', 'extra', 'fable', 'fairy', 'faith', 'false', 'fancy',
  'feast', 'fence', 'fetch', 'fever', 'field', 'fight', 'filth', 'final', 'first',
  'fixed', 'fizzy', 'flake', 'flame', 'flash', 'flock', 'flood', 'floor', 'flour',
  'flute', 'foggy', 'force', 'forge', 'found', 'frame', 'frank', 'freed', 'fresh',
  'frill', 'froze', 'fruit', 'fugue', 'funny', 'fuzzy', 'giant', 'given', 'glass',
  'glide', 'gloom', 'gloss', 'glove', 'grace', 'grade', 'grain', 'grand', 'grant',
  'grape', 'grasp', 'gravy', 'great', 'green', 'greet', 'groan', 'groom', 'gross',
  'group', 'grove', 'growl', 'grump', 'guest', 'guide', 'happy', 'hatch', 'hazel',
  'heard', 'hedge', 'herbs', 'hinge', 'hippo', 'hobby', 'honey', 'honor', 'horse',
  'hotel', 'house', 'human', 'humor', 'hyena', 'ideal', 'image', 'inbox', 'inner',
  'joust', 'juice', 'jumbo', 'jumpy', 'kneel', 'knife', 'knock', 'label', 'lance',
  'lemon', 'level', 'light', 'limit', 'linen', 'liver', 'local', 'lodge', 'lucky',
  'lunch', 'magic', 'maple', 'march', 'match', 'mayor', 'medal', 'melon', 'metal',
  'model', 'money', 'moose', 'mount', 'mouse', 'mouth', 'movie', 'muddy', 'music',
  'nasal', 'night', 'noble', 'noise', 'north', 'nurse', 'ocean', 'olive', 'onset',
  'onion', 'orbit', 'otter', 'outer', 'outdo', 'panda', 'pansy', 'paper', 'patch',
  'peace', 'pearl', 'pedal', 'petal', 'phone', 'photo', 'piano', 'pilot', 'pinch',
  'pitch', 'pizza', 'place', 'plain', 'plane', 'plant', 'plate', 'pluck', 'plume',
  'point', 'polar', 'poppy', 'pound', 'power', 'press', 'price', 'pride', 'prime',
  'print', 'probe', 'prune', 'punch', 'pupil', 'queen', 'quest', 'quick', 'quiet',
  'quill', 'quite', 'quote', 'radar', 'radio', 'raise', 'rally', 'raven', 'reach',
  'ready', 'relay', 'reply', 'ripen', 'rivet', 'robin', 'rocky', 'rouge', 'rough',
  'round', 'route', 'rowdy', 'royal', 'rugby', 'ruler', 'rusty', 'sadly', 'sauce',
  'scale', 'scare', 'scene', 'score', 'scout', 'screw', 'seize', 'seven', 'shade',
  'shake', 'shall', 'share', 'shark', 'sharp', 'sheep', 'shell', 'shift', 'shine',
  'shirt', 'shock', 'shore', 'short', 'shout', 'shrug', 'sight', 'silly', 'since',
  'sixth', 'skate', 'skill', 'skirt', 'skull', 'skunk', 'slate', 'sleep', 'slice',
  'slide', 'slime', 'smile', 'smoke', 'snail', 'snake', 'solar', 'south', 'space',
  'spare', 'spark', 'spear', 'speed', 'spell', 'spend', 'spice', 'spike', 'spine',
  'spoon', 'sport', 'stain', 'stand', 'stare', 'start', 'state', 'steak', 'steal',
  'steep', 'steer', 'stick', 'sting', 'stock', 'stone', 'stool', 'storm', 'story',
  'stove', 'straw', 'stuck', 'study', 'stump', 'style', 'sugar', 'sunny', 'super',
  'surge', 'swamp', 'sweat', 'sweet', 'swift', 'swirl', 'syrup', 'table', 'teach',
  'teeth', 'theme', 'thick', 'thing', 'think', 'thorn', 'those', 'three', 'tiger',
  'tight', 'timer', 'toast', 'today', 'torch', 'total', 'touch', 'tough', 'tower',
  'track', 'trade', 'trail', 'train', 'treat', 'trend', 'trial', 'trout', 'truck',
  'trunk', 'truth', 'tulip', 'tutor', 'twist', 'uncle', 'until', 'upset', 'value',
  'video', 'viola', 'viper', 'visit', 'water', 'whale', 'wheat', 'wheel', 'white',
  'whole', 'windy', 'witch', 'world', 'worse', 'worth', 'would', 'write', 'yacht',
  'young', 'youth', 'zebra',
  // 6-letter
  'across', 'active', 'adjust', 'almost', 'animal', 'answer', 'arcade', 'around',
  'asleep', 'attack', 'autumn', 'bamboo', 'banana', 'beauty', 'before', 'behind',
  'better', 'borrow', 'bottle', 'bounce', 'branch', 'breeze', 'bridge', 'bright',
  'broken', 'bubble', 'bucket', 'bunker', 'butter', 'button', 'candle', 'castle',
  'cattle', 'caught', 'centre', 'change', 'charge', 'cheese', 'choose', 'circle',
  'clever', 'cobweb', 'colour', 'combed', 'copper', 'corner', 'cotton', 'cousin',
  'create', 'credit', 'crispy', 'dagger', 'dancer', 'danger', 'decide', 'design',
  'desert', 'detach', 'dinner', 'divide', 'donkey', 'dragon', 'drawer', 'driven',
  'easily', 'editor', 'effort', 'either', 'eleven', 'energy', 'engine', 'escape',
  'expand', 'except', 'facial', 'fallen', 'family', 'father', 'fender', 'feeder',
  'finger', 'fizzing', 'flower', 'flying', 'forest', 'frozen', 'future', 'galaxy',
  'garden', 'garlic', 'gentle', 'ginger', 'global', 'goblin', 'golden', 'gravel',
  'ground', 'growth', 'guitar', 'harbor', 'harrow', 'heaven', 'helper', 'hidden',
  'hiking', 'hoping', 'humble', 'hungry', 'island', 'jigsaw', 'jungle', 'junior',
  'kitten', 'knight', 'ladder', 'launch', 'lender', 'lesson', 'letter', 'liquid',
  'listen', 'living', 'locker', 'locket', 'lonely', 'longer', 'lovable', 'lovely',
  'marble', 'master', 'meadow', 'midday', 'mirror', 'moment', 'monkey', 'mother',
  'muscle', 'myself', 'nature', 'needle', 'nestle', 'nickel', 'notice', 'number',
  'object', 'obtain', 'oceans', 'office', 'opened', 'orange', 'others', 'palace',
  'parent', 'pencil', 'people', 'pepper', 'person', 'pillow', 'pirate', 'planet',
  'player', 'pocket', 'points', 'potato', 'powder', 'pretty', 'prince', 'purple',
  'puzzle', 'rabbit', 'rattle', 'record', 'rescue', 'riding', 'ripple', 'rocket',
  'rubber', 'saddle', 'sailor', 'sample', 'school', 'second', 'secret', 'select',
  'settle', 'silver', 'simple', 'single', 'sister', 'slowly', 'smooth', 'spider',
  'spring', 'squeak', 'stable', 'statue', 'steady', 'stream', 'street', 'strung',
  'summer', 'supper', 'symbol', 'tennis', 'thatch', 'throat', 'ticket', 'tissue',
  'tongue', 'toucan', 'tunnel', 'turtle', 'tuxedo', 'useful', 'valley', 'violet',
  'wander', 'winter', 'wisdom', 'wonder', 'yellow', 'zinnia',
];

// 7-10 letter words (age 8-10)
const HARD_WORDS: string[] = [
  // 7-letter
  'already', 'amazing', 'awesome', 'because', 'between', 'bicycle', 'blanket',
  'blossom', 'cabinet', 'camping', 'captain', 'careful', 'cartoon', 'ceiling',
  'chapter', 'chicken', 'compass', 'connect', 'control', 'country', 'courage',
  'curtain', 'cutting', 'decided', 'deliver', 'diamond', 'dolphin', 'drawing',
  'earning', 'failing', 'farming', 'feeling', 'finally', 'fishing', 'forever',
  'forward', 'freedom', 'getting', 'glacier', 'harvest', 'helpful', 'holding',
  'holiday', 'however', 'hunting', 'imagine', 'journey', 'jumping', 'kitchen',
  'knotted', 'knowing', 'learned', 'leather', 'letting', 'message', 'morning',
  'mystery', 'nothing', 'nowhere', 'ordered', 'outside', 'pattern', 'perfect',
  'picture', 'playing', 'popular', 'present', 'prevent', 'primary', 'problem',
  'product', 'program', 'promise', 'protect', 'quickly', 'quietly', 'reading',
  'regular', 'request', 'running', 'sandbox', 'science', 'seagull', 'silence',
  'singing', 'sitting', 'sixteen', 'someone', 'special', 'station', 'stories',
  'subject', 'surface', 'teacher', 'texture', 'tonight', 'traffic', 'trouble',
  'turning', 'unusual', 'village', 'visited', 'walking', 'weather', 'welcome',
  'western', 'whether', 'whisper', 'without', 'working', 'writing',
  // 8-letter
  'absolute', 'accurate', 'activity', 'addition', 'although', 'anything', 'anywhere',
  'backbone', 'birthday', 'building', 'carnival', 'carrying', 'catching', 'children',
  'clothing', 'complete', 'computer', 'consider', 'continue', 'creating', 'describe',
  'discover', 'distance', 'doorbell', 'everyone', 'exciting', 'existing', 'favorite',
  'football', 'fourteen', 'friendly', 'grateful', 'greeting', 'guidance', 'handsome',
  'happened', 'happiest', 'headline', 'homework', 'hospital', 'imagined', 'increase',
  'industry', 'innocent', 'keyboard', 'kindness', 'language', 'laughter', 'learning',
  'lemonade', 'listened', 'location', 'medicine', 'midnight', 'movement', 'neighbor',
  'nineteen', 'occurred', 'outdoors', 'peaceful', 'platform', 'pleasant', 'possible',
  'printing', 'probably', 'recently', 'relaxing', 'remember', 'reptiles', 'research',
  'returned', 'rotation', 'sailboat', 'schedule', 'seashore', 'sentence', 'separate',
  'shoulder', 'skeleton', 'sleeping', 'snowfall', 'solution', 'speaking', 'spinning',
  'spending', 'strength', 'sunlight', 'sunshine', 'swimming', 'teaching', 'together',
  'tomorrow', 'traveled', 'tropical', 'turbines', 'uncommon', 'unlikely', 'valuable',
  'whatever', 'whenever', 'wherever', 'youngest',
  // 9-10 letter
  'adventure', 'afternoon', 'beginning', 'carefully', 'celebrate', 'challenge',
  'character', 'classroom', 'community', 'correctly', 'courtyard', 'curiosity',
  'detective', 'different', 'direction', 'discovery', 'education', 'effective',
  'encourage', 'enjoyment', 'equipment', 'excellent', 'existence', 'explained',
  'fantastic', 'gathering', 'gentleman', 'glamorous', 'happiness', 'heartbeat',
  'highlight', 'hopefully', 'hurricane', 'identical', 'important', 'introduce',
  'invention', 'invisible', 'knowledge', 'landscape', 'lightning', 'listening',
  'machinery', 'memorable', 'mountains', 'narrative', 'objective', 'orchestra',
  'overnight', 'passenger', 'petroleum', 'practical', 'preparing', 'presently',
  'producing', 'qualified', 'questions', 'receiving', 'remaining', 'renewable',
  'rewarding', 'scattered', 'schooling', 'shipwreck', 'signature', 'solutions',
  'something', 'sometimes', 'somewhere', 'carefully', 'submarine', 'superhero',
  'surprised', 'traveling', 'treatment', 'turbulent', 'unfolding', 'unlimited',
  'wonderful', 'yesterday',
  // 10-letter
  'accomplish', 'activities', 'altogether', 'appearance', 'atmosphere', 'basketball',
  'boundaries', 'brainstorm', 'caterpillar', 'collecting', 'completely', 'confidence',
  'connection', 'considered', 'contribute', 'creativity', 'decoration', 'definition',
  'determined', 'directions', 'discovered', 'elementary', 'especially', 'eventually',
  'excellence', 'excitement', 'experience', 'expression', 'fascinated', 'foundation',
  'friendship', 'generation', 'gymnastics', 'historical', 'impossible', 'incredible',
  'information', 'inspiration', 'interested', 'leadership', 'marvelous', 'memorable',
  'motorcycle', 'mysterious', 'objectives', 'organizing', 'particular', 'performing',
  'persistent', 'previously', 'production', 'protecting', 'remarkable', 'remembering',
  'repeatedly', 'responding', 'revolution', 'screenplay', 'skyscraper', 'steadiness',
  'strawberry', 'successful', 'suggestion', 'surrounded', 'surprising', 'technology',
  'tournament', 'tremendous', 'understand', 'vocabulary', 'wilderness', 'wonderland',
];

const BLANK_COUNT: Record<Difficulty, number> = { easy: 1, medium: 2, hard: 3 };
const BOARD_SIZE: Record<Difficulty, number> = { easy: 8, medium: 10, hard: 12 };

function pickDistractors(avoidLetters: string[], count: number): string[] {
  const pool = 'abcdefghijklmnopqrstuvwxyz'
    .split('')
    .filter(c => !avoidLetters.includes(c));
  const result: string[] = [];
  const available = [...pool];
  while (result.length < count && available.length > 0) {
    const idx = Math.floor(Math.random() * available.length);
    result.push(available.splice(idx, 1)[0]);
  }
  return result;
}

export function generateSpellingQuestion(difficulty: Difficulty): SpellingQuestion {
  const wordList =
    difficulty === 'easy' ? EASY_WORDS :
    difficulty === 'medium' ? MEDIUM_WORDS :
    HARD_WORDS;

  const word = wordList[Math.floor(Math.random() * wordList.length)].toLowerCase();
  const blanks = Math.min(BLANK_COUNT[difficulty], word.length);
  const boardSize = BOARD_SIZE[difficulty];

  // Pick random indices to blank (left-to-right sort)
  const allIndices = Array.from({ length: word.length }, (_, i) => i);
  const shuffled = [...allIndices].sort(() => Math.random() - 0.5);
  const missingIndices = shuffled.slice(0, blanks).sort((a, b) => a - b);
  const missingLetters = missingIndices.map(i => word[i]);

  // Board: unique missing letters + distractors (distractors avoid the exact answer letters)
  const uniqueAnswerLetters = [...new Set(missingLetters)];
  const distractorCount = boardSize - uniqueAnswerLetters.length;
  const distractors = pickDistractors(uniqueAnswerLetters, distractorCount);
  const letterBoard = [...uniqueAnswerLetters, ...distractors].sort(() => Math.random() - 0.5);

  return {
    id: `${word}-${Date.now()}-${Math.random()}`,
    word,
    missingIndices,
    missingLetters,
    letterBoard,
  };
}
