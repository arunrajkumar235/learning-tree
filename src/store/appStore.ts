import { makeAutoObservable } from 'mobx';

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface Question {
  id: string;
  question: string;
  answer: number;
  options: number[];
  type: 'addition' | 'subtraction' | 'multiplication' | 'division';
  emoji: string;
}

export const QUIZ_QUESTION_LIMIT = 10;
export const MAX_SCORE = QUIZ_QUESTION_LIMIT * 10;
export const HINT_POINTS: Record<number, number> = { 0: 10, 1: 7, 2: 2 };

class AppStore {
  selectedGrade: number | null = null;
  selectedSubject: string | null = null;
  difficulty: Difficulty = 'easy';
  currentQuestion: Question | null = null;
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

  constructor() {
    makeAutoObservable(this);
    if (this.isDarkMode) document.documentElement.classList.add('dark');
  }

  toggleDarkMode() {
    this.isDarkMode = !this.isDarkMode;
    localStorage.setItem('darkMode', String(this.isDarkMode));
    document.documentElement.classList.toggle('dark', this.isDarkMode);
  }

  setGrade(grade: number) {
    this.selectedGrade = grade;
    this.selectedSubject = null;
    this.currentQuestion = null;
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
    this.questionStartTime = Date.now();
  }

  setSubject(subject: string) {
    this.selectedSubject = subject;
    this.currentQuestion = null;
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
    this.questionStartTime = Date.now();
  }

  setDifficulty(difficulty: Difficulty) {
    this.difficulty = difficulty;
  }

  setQuestion(question: Question) {
    this.currentQuestion = question;
    this.wrongAnswers = [];
    this.autoEliminatedOptions = [];
    this.showSuccess = false;
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
    this.totalTimeSpent += Date.now() - this.questionStartTime;
    const hints = this.autoEliminatedOptions.length;
    this.score += HINT_POINTS[hints] ?? 0;
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
    this.currentQuestionNumber += 1;
    this.questionStartTime = Date.now();
    if (this.questionCount >= QUIZ_QUESTION_LIMIT) {
      this.quizComplete = true;
    }
  }

  restartQuiz(question: Question) {
    this.currentQuestion = question;
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
    this.questionStartTime = Date.now();
  }

  resetSubject() {
    this.selectedSubject = null;
    this.currentQuestion = null;
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
    this.questionStartTime = Date.now();
  }

  resetGrade() {
    this.selectedGrade = null;
    this.selectedSubject = null;
    this.currentQuestion = null;
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
    this.questionStartTime = Date.now();
  }
}

export const appStore = new AppStore();
