type TriviaQuestion = {
  question: string;
  options: Array<string>;
  answer: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
};

/** General-audience “modern life” trivia: food, games, internet, language, media — not textbook nature/geography drills. */
const QUESTIONS: Array<TriviaQuestion> = [
  {
    question: 'What does the "S" in "HTTPS" stand for?',
    options: ['Secure', 'Simple', 'Streaming', 'Shared'],
    answer: 'Secure',
    category: 'tech',
    difficulty: 'easy',
  },
  {
    question: 'What is the main ingredient in classic hummus?',
    options: ['Chickpeas', 'Lentils', 'Black beans', 'Quinoa'],
    answer: 'Chickpeas',
    category: 'food',
    difficulty: 'easy',
  },
  {
    question: 'A word that reads the same forwards and backwards is called a what?',
    options: ['Palindrome', 'Anagram', 'Synonym', 'Acronym'],
    answer: 'Palindrome',
    category: 'language',
    difficulty: 'easy',
  },
  {
    question: 'In chess, which piece only moves diagonally?',
    options: ['Rook', 'Knight', 'Bishop', 'Pawn'],
    answer: 'Bishop',
    category: 'games',
    difficulty: 'easy',
  },
  {
    question: 'What does "GIF" stand for?',
    options: [
      'Graphics Interchange Format',
      'General Image File',
      'Gradient Image Format',
      'Giga Image Frame',
    ],
    answer: 'Graphics Interchange Format',
    category: 'tech',
    difficulty: 'easy',
  },
  {
    question: 'In the classic film line, "I\'ll be back," which franchise is it most associated with?',
    options: ['The Terminator', 'Die Hard', 'Mission: Impossible', 'James Bond'],
    answer: 'The Terminator',
    category: 'media',
    difficulty: 'easy',
  },
  {
    question: 'Roughly how many hours are in a leap year?',
    options: ['8,760', '8,784', '8,800', '9,000'],
    answer: '8,784',
    category: 'everyday',
    difficulty: 'hard',
  },
  {
    question: 'Which of these is usually NOT considered vegan?',
    options: ['Olive oil', 'Maple syrup', 'Honey', 'Lentils'],
    answer: 'Honey',
    category: 'food',
    difficulty: 'medium',
  },
  {
    question: 'What does "PDF" stand for?',
    options: [
      'Portable Document Format',
      'Public Document File',
      'Printed Document Format',
      'Portable Data File',
    ],
    answer: 'Portable Document Format',
    category: 'tech',
    difficulty: 'medium',
  },
  {
    question: 'On a standard US QWERTY keyboard, which row are the keys A S D F on?',
    options: ['Top row', 'Home row', 'Bottom row', 'Number row'],
    answer: 'Home row',
    category: 'everyday',
    difficulty: 'easy',
  },
  {
    question: 'In Monopoly, which color group is typically the most expensive on the classic board?',
    options: ['Green', 'Dark blue', 'Red', 'Yellow'],
    answer: 'Dark blue',
    category: 'games',
    difficulty: 'medium',
  },
  {
    question: 'What does the "p" in "1080p" most commonly stand for?',
    options: ['Progressive', 'Pixels', 'Portable', 'Premium'],
    answer: 'Progressive',
    category: 'media',
    difficulty: 'medium',
  },
  {
    question: 'Which shortcut is widely used for "Undo" on Windows and many Linux apps?',
    options: ['Ctrl+Z', 'Ctrl+Y', 'Ctrl+C', 'Ctrl+X'],
    answer: 'Ctrl+Z',
    category: 'tech',
    difficulty: 'easy',
  },
  {
    question: 'Which nut is traditional in classic basil pesto?',
    options: ['Pine nuts', 'Peanuts', 'Cashews', 'Almonds'],
    answer: 'Pine nuts',
    category: 'food',
    difficulty: 'medium',
  },
  {
    question: 'What is a word that means the opposite of another word?',
    options: ['Antonym', 'Homonym', 'Pronoun', 'Verb'],
    answer: 'Antonym',
    category: 'language',
    difficulty: 'easy',
  },
  {
    question: 'Which company owns Instagram and WhatsApp?',
    options: ['Meta', 'Google', 'Microsoft', 'Apple'],
    answer: 'Meta',
    category: 'media',
    difficulty: 'easy',
  },
  {
    question: 'In photography, a higher ISO setting generally does what?',
    options: [
      'Makes the sensor more sensitive to light',
      'Shrinks the file size',
      'Adds a watermark',
      'Turns on the flash automatically',
    ],
    answer: 'Makes the sensor more sensitive to light',
    category: 'media',
    difficulty: 'medium',
  },
  {
    question: 'Which drink is mostly steamed milk with a shot or two of espresso?',
    options: ['Americano', 'Latte', 'Espresso', 'Cold brew'],
    answer: 'Latte',
    category: 'food',
    difficulty: 'easy',
  },
  {
    question: 'What does "URL" stand for?',
    options: [
      'Uniform Resource Locator',
      'Universal Reference Link',
      'Unified Resource Link',
      'Uniform Reference Locator',
    ],
    answer: 'Uniform Resource Locator',
    category: 'tech',
    difficulty: 'medium',
  },
  {
    question: 'How many squares are along one edge of a standard chessboard?',
    options: ['6', '8', '10', '12'],
    answer: '8',
    category: 'games',
    difficulty: 'easy',
  },
];

const usedIndices = new Set<number>();

export function getRandomQuestion(category?: string): TriviaQuestion {
  let pool = QUESTIONS.map((q, i) => ({ ...q, _index: i }));

  if (category) {
    const filtered = pool.filter((q) => q.category === category);
    if (filtered.length > 0) pool = filtered;
  }

  const unused = pool.filter((q) => !usedIndices.has(q._index));
  const candidates = unused.length > 0 ? unused : pool;

  if (unused.length === 0) usedIndices.clear();

  const pick = candidates[Math.floor(Math.random() * candidates.length)];
  usedIndices.add(pick._index);

  const { _index: _, ...question } = pick;
  return question;
}
