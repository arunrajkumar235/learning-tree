import { makeAutoObservable } from 'mobx';

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface SpellingQuestion {
  id: string;
  word: string;
  missingIndices: number[];
  missingLetters: string[];
  letterBoard: string[];
}

export interface Question {
  id: string;
  question: string;
  answer: number;
  options: number[];
  type: 'addition' | 'subtraction' | 'multiplication' | 'division';
  emoji: string;
}

export const QUIZ_QUESTION_LIMIT = 10;
// Base max is 100 (10 pts × 10 questions); bonus can push score over 100
export const MAX_SCORE = QUIZ_QUESTION_LIMIT * 10;
export const MISTAKE_POINTS: Record<number, number> = { 0: 10, 1: 7, 2: 2 };

function calcSpeedBonus(elapsedSeconds: number): number {
  if (elapsedSeconds <= 1) return 5;
  if (elapsedSeconds <= 2) return 4;
  if (elapsedSeconds <= 3) return 3;
  if (elapsedSeconds <= 4) return 2;
  if (elapsedSeconds <= 5) return 1;
  return 0;
}

class AppStore {
  selectedSubject: string | null = null;
  selectedLesson: string | null = null;
  difficulty: Difficulty = 'easy';
  currentQuestion: Question | null = null;
  currentSpellingWord: SpellingQuestion | null = null;
  wrongAnswers: number[] = [];
  autoEliminatedOptions: number[] = [];
  score: number = 0;
  correctCount: number = 0;
  questionCount: number = 0;
  currentQuestionNumber: number = 1;
  showSuccess: boolean = false;
  streak: number = 0;
  isDarkMode: boolean = localStorage.getItem('darkMode') === 'true';
  questionStartTime: number = Date.now();
  totalTimeSpent: number = 0;
  quizComplete: boolean = false;
  lastBonusPoints: number = 0;
  gameKey: number = 0;

  constructor() {
    makeAutoObservable(this);
    if (this.isDarkMode) document.documentElement.classList.add('dark');
  }

  toggleDarkMode() {
    this.isDarkMode = !this.isDarkMode;
    localStorage.setItem('darkMode', String(this.isDarkMode));
    document.documentElement.classList.toggle('dark', this.isDarkMode);
  }

  setSubject(subject: string) {
    this.selectedSubject = subject;
    this.selectedLesson = null;
    this._resetGameState();
  }

  setLesson(lesson: string, difficulty: Difficulty) {
    this.selectedLesson = lesson;
    this.difficulty = difficulty;
    this._resetGameState();
  }

  setQuestion(question: Question) {
    this.currentQuestion = question;
    this.wrongAnswers = [];
    this.autoEliminatedOptions = [];
    this.showSuccess = false;
    this.lastBonusPoints = 0;
    this.questionStartTime = Date.now();
  }

  markWrongAnswer(answer: number) {
    if (!this.wrongAnswers.includes(answer)) {
      this.wrongAnswers.push(answer);
    }
    this.streak = 0;
  }

  autoEliminateOption(option: number) {
    if (!this.autoEliminatedOptions.includes(option) && !this.wrongAnswers.includes(option)) {
      this.autoEliminatedOptions.push(option);
    }
  }

  markCorrect() {
    const elapsedSeconds = (Date.now() - this.questionStartTime) / 1000;
    this.totalTimeSpent += Date.now() - this.questionStartTime;
    const totalMistakes = this.wrongAnswers.length + this.autoEliminatedOptions.length;
    const basePoints = MISTAKE_POINTS[totalMistakes] ?? 0;
    const bonus = calcSpeedBonus(elapsedSeconds);
    this.lastBonusPoints = bonus;
    this.score += basePoints + bonus;
    this.correctCount += 1;
    this.questionCount += 1;
    this.showSuccess = true;
    this.streak += 1;
    if (this.questionCount >= QUIZ_QUESTION_LIMIT) {
      this.quizComplete = true;
    }
  }

  clearSuccess() {
    this.showSuccess = false;
  }

  nextQuestion(question: Question) {
    this.currentQuestion = question;
    this.wrongAnswers = [];
    this.autoEliminatedOptions = [];
    this.showSuccess = false;
    this.lastBonusPoints = 0;
    this.currentQuestionNumber += 1;
    this.questionStartTime = Date.now();
  }

  skipQuestion(question: Question) {
    this.totalTimeSpent += Date.now() - this.questionStartTime;
    this.questionCount += 1;
    this.currentQuestion = question;
    this.wrongAnswers = [];
    this.autoEliminatedOptions = [];
    this.showSuccess = false;
    this.streak = 0;
    this.lastBonusPoints = 0;
    this.currentQuestionNumber += 1;
    this.questionStartTime = Date.now();
    if (this.questionCount >= QUIZ_QUESTION_LIMIT) {
      this.quizComplete = true;
    }
  }

  restartQuiz() {
    this._resetGameState();
    this.gameKey += 1;
  }

  setSpellingWord(word: SpellingQuestion) {
    this.currentSpellingWord = word;
    this.lastBonusPoints = 0;
    this.questionStartTime = Date.now();
  }

  nextSpellingWord(word: SpellingQuestion) {
    this.currentSpellingWord = word;
    this.lastBonusPoints = 0;
    this.currentQuestionNumber += 1;
    this.questionStartTime = Date.now();
  }

  skipSpellingWord(word: SpellingQuestion) {
    this.totalTimeSpent += Date.now() - this.questionStartTime;
    this.questionCount += 1;
    this.currentSpellingWord = word;
    this.lastBonusPoints = 0;
    this.currentQuestionNumber += 1;
    this.streak = 0;
    this.questionStartTime = Date.now();
    if (this.questionCount >= QUIZ_QUESTION_LIMIT) {
      this.quizComplete = true;
    }
  }

  markWordComplete(wrongCount: number) {
    const elapsedSeconds = (Date.now() - this.questionStartTime) / 1000;
    this.totalTimeSpent += Date.now() - this.questionStartTime;
    const basePoints = MISTAKE_POINTS[wrongCount] ?? 0;
    const bonus = calcSpeedBonus(elapsedSeconds);
    this.lastBonusPoints = bonus;
    this.score += basePoints + bonus;
    this.correctCount += 1;
    this.questionCount += 1;
    this.showSuccess = true;
    this.streak += 1;
    if (this.questionCount >= QUIZ_QUESTION_LIMIT) {
      this.quizComplete = true;
    }
  }

  resetLesson() {
    this.selectedLesson = null;
    this._resetGameState();
  }

  resetSubject() {
    this.selectedSubject = null;
    this.selectedLesson = null;
    this._resetGameState();
  }

  private _resetGameState() {
    this.currentQuestion = null;
    this.currentSpellingWord = null;
    this.wrongAnswers = [];
    this.autoEliminatedOptions = [];
    this.showSuccess = false;
    this.score = 0;
    this.correctCount = 0;
    this.questionCount = 0;
    this.currentQuestionNumber = 1;
    this.streak = 0;
    this.totalTimeSpent = 0;
    this.quizComplete = false;
    this.lastBonusPoints = 0;
    this.questionStartTime = Date.now();
  }
}

export const appStore = new AppStore();
